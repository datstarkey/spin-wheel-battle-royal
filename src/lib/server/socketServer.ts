import { Server as SocketServer, type Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import type { ClientToServerEvents, ServerToClientEvents } from '$lib/multiplayer/types';
import { createRoom, getRoom, startCleanupTimer, type GameRoom } from './gameRooms';
import { handleAction, weightedRandomIndex, type ActionResult } from './actionHandler';
import { PerSocketRateLimiter } from './rateLimiter';

type TypedServer = SocketServer<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/** Send all pending wheels to a single socket (used on join/rejoin) */
function sendPendingWheels(socket: TypedSocket, room: GameRoom) {
	for (const [key, wheel] of room.pendingWheels) {
		const isMidSpin = wheel.chosenIndex !== undefined;
		const shuffledClientIndex = isMidSpin
			? wheel.shuffledOrder.indexOf(wheel.chosenIndex!)
			: undefined;

		const catchUpSpinParams =
			isMidSpin && shuffledClientIndex !== undefined
				? {
						selectedIndex: shuffledClientIndex,
						duration: 1000,
						numberOfRevolutions: 1,
						direction: 1 as const
					}
				: undefined;

		socket.emit('room:wheel_pending', {
			key,
			items: wheel.items.map((item) => ({
				label: item.label,
				weight: item.weight
			})),
			theme: wheel.theme,
			forPlayerName: wheel.forPlayerName,
			shuffledOrder: wheel.shuffledOrder,
			spinState: isMidSpin ? 'spinning' : undefined,
			spinParams: catchUpSpinParams
		});

		// Also emit the separate spin event for catch-up (in case client listens for it)
		if (catchUpSpinParams) {
			socket.emit('room:wheel_spin', {
				wheelKey: key,
				...catchUpSpinParams
			});
		}
	}
}

let io: TypedServer | null = null;
const actionLimiter = new PerSocketRateLimiter(100);

export function getIO(): TypedServer | null {
	return io;
}

export function initSocketServer(httpServer: HttpServer): TypedServer {
	if (io) return io;

	io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST']
		},
		path: '/socket.io'
	});

	startCleanupTimer();

	io.on('connection', (socket) => {
		let currentRoomCode: string | null = null;

		// ================================================================
		// Room: Create
		// ================================================================
		socket.on('room:create', (data, callback) => {
			const room = createRoom(data.gmName, socket.id, data.password);
			currentRoomCode = room.code;
			socket.join(room.code);

			// Send initial state to the GM (includes themselves as a game player)
			socket.emit('room:state_update', {
				gameState: room.game.serialize(),
				roomState: room.getRoomState()
			});

			callback({ success: true, roomCode: room.code });
		});

		// ================================================================
		// Room: Join
		// ================================================================
		socket.on('room:join', (data, callback) => {
			const room = getRoom(data.roomCode);
			if (!room) {
				callback({ success: false, error: 'Room not found' });
				return;
			}

			if (room.password && room.password !== data.password) {
				callback({ success: false, error: 'Incorrect password' });
				return;
			}

			const role = data.role ?? 'player';
			const added = room.addPlayer(data.playerName, socket.id, role);
			if (!added) {
				callback({ success: false, error: 'Name already taken' });
				return;
			}

			// Auto-add as game player (if game hasn't started and role is player/gm)
			if (role !== 'spectator') {
				room.addGamePlayer(data.playerName);
			}

			currentRoomCode = room.code;
			socket.join(room.code);

			// Notify others
			socket.to(room.code).emit('room:player_joined', {
				playerName: data.playerName,
				role
			});

			// Broadcast updated state to all (including the new player joining)
			io?.to(room.code).emit('room:state_update', {
				gameState: room.game.serialize(),
				roomState: room.getRoomState()
			});

			// Send any pending wheels to the joining player
			sendPendingWheels(socket, room);

			callback({ success: true, role });
		});

		// ================================================================
		// Room: Rejoin
		// ================================================================
		socket.on('room:rejoin', (data, callback) => {
			const room = getRoom(data.roomCode);
			if (!room) {
				callback({ success: false, error: 'Room not found' });
				return;
			}

			const rejoined = room.rejoinPlayer(data.playerName, socket.id);
			if (!rejoined) {
				callback({ success: false, error: 'Player not found in room' });
				return;
			}

			currentRoomCode = room.code;
			const role = room.getPlayerRole(data.playerName);
			socket.join(room.code);

			// Send full state
			socket.emit('room:state_update', {
				gameState: room.game.serialize(),
				roomState: room.getRoomState()
			});

			// Send any pending wheels
			sendPendingWheels(socket, room);

			callback({ success: true, role });
		});

		// ================================================================
		// Room: Leave
		// ================================================================
		socket.on('room:leave', () => {
			handleDisconnect();
		});

		// ================================================================
		// Player: Action
		// ================================================================
		socket.on('player:action', (data, callback) => {
			if (actionLimiter.isThrottled(socket.id)) {
				callback?.({ success: false, error: 'Too many actions, slow down' });
				return;
			}

			if (!currentRoomCode) {
				callback?.({ success: false, error: 'Not in a room' });
				return;
			}

			const room = getRoom(currentRoomCode);
			if (!room) {
				callback?.({ success: false, error: 'Room not found' });
				return;
			}

			const playerName = room.getPlayerNameBySocket(socket.id);
			if (!playerName) {
				callback?.({ success: false, error: 'Player not found' });
				return;
			}

			const result: ActionResult = handleAction(room, playerName, data.action);

			if (!result.success) {
				callback?.({ success: false, error: result.error });
				return;
			}

			// Broadcast updated state to all clients in the room
			if (result.gameState) {
				io?.to(currentRoomCode).emit('room:state_update', {
					gameState: result.gameState,
					delta: result.delta,
					roomState: room.getRoomState(),
					combatState: result.combat ?? undefined
				});
			}

			// Send any new pending wheels to all clients
			if (result.pendingWheels) {
				for (const wheel of result.pendingWheels) {
					io?.to(currentRoomCode).emit('room:wheel_pending', wheel);
				}
			}

			callback?.({ success: true });
		});

		// ================================================================
		// Wheel: Request Spin (server picks winner, broadcasts to all)
		// ================================================================
		socket.on('wheel:request_spin', (data, callback) => {
			if (!currentRoomCode) {
				callback?.({ success: false, error: 'Not in a room' });
				return;
			}

			const room = getRoom(currentRoomCode);
			if (!room) {
				callback?.({ success: false, error: 'Room not found' });
				return;
			}

			const playerName = room.getPlayerNameBySocket(socket.id);
			if (!playerName) {
				callback?.({ success: false, error: 'Not in room' });
				return;
			}

			const pw = room.pendingWheels.get(data.wheelKey);
			if (!pw) {
				callback?.({ success: false, error: 'Wheel not found' });
				return;
			}

			const role = room.getPlayerRole(playerName);
			if (pw.forPlayerName !== playerName && role !== 'gm') {
				callback?.({ success: false, error: 'Not your wheel' });
				return;
			}

			if (pw.chosenIndex !== undefined) {
				callback?.({ success: false, error: 'Already spinning' });
				return;
			}

			// Server picks the winner (index into original items array)
			const chosenIndex = weightedRandomIndex(pw.items);
			pw.chosenIndex = chosenIndex;

			// Map original index → shuffled client index
			const shuffledClientIndex = pw.shuffledOrder.indexOf(chosenIndex);

			// Broadcast spin params to ALL clients in room
			io?.to(currentRoomCode).emit('room:wheel_spin', {
				wheelKey: data.wheelKey,
				selectedIndex: shuffledClientIndex,
				duration: 5000,
				numberOfRevolutions: 4,
				direction: 1 as const
			});

			callback?.({ success: true });
		});

		// ================================================================
		// Wheel: Spin Result
		// ================================================================
		socket.on('wheel:spin_result', (data, callback) => {
			if (actionLimiter.isThrottled(socket.id)) {
				callback?.({ success: false, error: 'Too many actions, slow down' });
				return;
			}

			if (!currentRoomCode) {
				callback?.({ success: false, error: 'Not in a room' });
				return;
			}

			const room = getRoom(currentRoomCode);
			if (!room) {
				callback?.({ success: false, error: 'Room not found' });
				return;
			}

			const playerName = room.getPlayerNameBySocket(socket.id);
			if (!playerName) {
				callback?.({ success: false, error: 'Player not found' });
				return;
			}

			// Capture wheel type before handleAction deletes it
			const wheelType = room.pendingWheels.get(data.wheelKey)?.type;

			const result = handleAction(room, playerName, {
				type: 'WHEEL_SPIN_RESULT',
				wheelKey: data.wheelKey,
				selectedIndex: data.selectedIndex
			});

			if (!result.success) {
				callback?.({ success: false, error: result.error });
				return;
			}

			// Broadcast the wheel dismissal
			io?.to(currentRoomCode).emit('room:wheel_dismiss', { wheelKey: data.wheelKey });

			// Broadcast updated state (include combatState: null if this was a combat wheel)
			const combatEnded = wheelType === 'combat';
			if (result.gameState) {
				io?.to(currentRoomCode).emit('room:state_update', {
					gameState: result.gameState,
					delta: result.delta,
					roomState: room.getRoomState(),
					combatState: combatEnded ? null : undefined
				});
			}

			// Send any new pending wheels that resulted from the spin
			if (result.pendingWheels) {
				for (const wheel of result.pendingWheels) {
					io?.to(currentRoomCode).emit('room:wheel_pending', wheel);
				}
			}

			callback?.({ success: true });
		});

		// ================================================================
		// Disconnect
		// ================================================================
		function handleDisconnect() {
			actionLimiter.removeSocket(socket.id);

			if (!currentRoomCode) return;

			const room = getRoom(currentRoomCode);
			if (!room) return;

			const playerName = room.removePlayerBySocket(socket.id);
			if (playerName) {
				socket.to(currentRoomCode).emit('room:player_left', { playerName });

				// Only room state changed (connected players list), game state is unchanged
				io?.to(currentRoomCode).emit('room:state_update', {
					gameState: room.game.serialize(),
					roomState: room.getRoomState()
				});
			}

			socket.leave(currentRoomCode);
			currentRoomCode = null;
		}

		socket.on('disconnect', handleDisconnect);
	});

	return io;
}
