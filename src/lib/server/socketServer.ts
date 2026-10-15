import { randomUUID } from 'crypto';
import { Server as SocketServer, type Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import type {
	ClientToServerEvents,
	GameAction,
	Role,
	ServerToClientEvents
} from '#lib/multiplayer/types.js';
import { normalizePlayerName } from '#lib/multiplayer/names.js';
import { createRoom, getRoom, startCleanupTimer, type GameRoom } from './gameRooms';
import { handleAction } from './actionHandler';
import { toPendingWheelPayload } from './pendingWheelPayload';
import { PerSocketRateLimiter } from './rateLimiter';
import { weightedRandomIndex } from './wheelUtils';

/** Max spectator hint payload size in bytes */
const MAX_SPECTATOR_HINT_SIZE = 4096;
const SPIN_DURATION_MS = 5000;
/** How long a landed wheel waits for its spinner to press Continue before the server resolves it */
const WHEEL_AUTO_RESOLVE_MS = SPIN_DURATION_MS + 20_000;

type TypedServer = SocketServer<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type Ack = (response: { success: boolean; error?: string }) => void;

/** Send all pending wheels to a single socket (used on join/rejoin) */
function sendPendingWheels(socket: TypedSocket, room: GameRoom) {
	for (const [key, wheel] of room.pendingWheels) {
		const shuffledClientIndex =
			wheel.chosenIndex !== undefined ? wheel.shuffledOrder.indexOf(wheel.chosenIndex) : undefined;

		socket.emit(
			'room:wheel_pending',
			toPendingWheelPayload(key, wheel, {
				spinState: shuffledClientIndex !== undefined ? 'spinning' : undefined,
				spinParams:
					shuffledClientIndex !== undefined
						? {
								selectedIndex: shuffledClientIndex,
								duration: 1000,
								numberOfRevolutions: 1,
								direction: 1
							}
						: undefined
			})
		);
	}
}

/** Full-state snapshot for one room, sent on join/rejoin/disconnect */
function snapshot(room: GameRoom) {
	return {
		gameState: room.game.serialize(),
		roomState: room.getRoomState(),
		version: room.stateVersion,
		combatState: room.combatState ?? undefined
	};
}

let io: TypedServer | null = null;
const actionLimiter = new PerSocketRateLimiter(100);
// Hover/movement hints fire often; they get their own budget so they never eat real actions
const hintLimiter = new PerSocketRateLimiter(100);

export function getIO(): TypedServer | null {
	return io;
}

/** Execute an action for a player and broadcast the outcome to their room. */
function runAction(room: GameRoom, playerName: string, action: GameAction) {
	const wheel =
		action.type === 'WHEEL_SPIN_RESULT' ? room.pendingWheels.get(action.wheelKey) : undefined;
	clearTimeout(wheel?.resolveTimer);

	const result = handleAction(room, playerName, action);
	// Failed actions only broadcast when they still changed state (an executor threw mid-way)
	if (!result.success && !result.gameState) return result;

	// Combat wheel resolving ends the battle; a new attack starts one
	const combatEnded = wheel?.type === 'combat';
	if (combatEnded) room.combatState = null;
	else if (result.combat) room.combatState = result.combat;

	if (action.type === 'WHEEL_SPIN_RESULT') {
		io?.to(room.code).emit('room:wheel_dismiss', { wheelKey: action.wheelKey });
	}

	if (result.gameState) {
		io?.to(room.code).emit('room:state_update', {
			gameState: result.gameState,
			delta: result.delta,
			version: room.stateVersion,
			roomState: room.getRoomState(),
			combatState: combatEnded ? null : (result.combat ?? undefined)
		});
	}

	for (const pending of result.pendingWheels ?? []) {
		io?.to(room.code).emit('room:wheel_pending', pending);
	}

	return result;
}

export function initSocketServer(httpServer: HttpServer): TypedServer {
	if (io) return io;

	const corsOrigin = process.env.ORIGIN ?? 'http://localhost:7654';
	io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
		cors: {
			origin: corsOrigin,
			methods: ['GET', 'POST']
		},
		path: '/socket.io'
	});

	startCleanupTimer();

	io.on('connection', (socket) => {
		let currentRoomCode: string | null = null;

		/**
		 * Socket.io calls handlers synchronously from its event emitter, so an exception thrown by a
		 * malformed payload would crash the whole server. Every handler goes through this guard.
		 */
		function on<E extends keyof ClientToServerEvents>(
			event: E,
			handler: (...args: Parameters<ClientToServerEvents[E]>) => void
		) {
			socket.on(event, ((...args: Parameters<ClientToServerEvents[E]>) => {
				try {
					handler(...args);
				} catch (err) {
					console.error(`[socket.io] ${String(event)} failed:`, err);
					const ack = args[args.length - 1];
					if (typeof ack === 'function') ack({ success: false, error: 'Server error' });
				}
			}) as never);
		}

		/** Wrap an optional client callback so a missing one never throws */
		function ackOf<T>(callback: unknown): (response: T) => void {
			return typeof callback === 'function' ? (callback as (response: T) => void) : () => {};
		}

		function currentContext(ack: Ack) {
			if (actionLimiter.isThrottled(socket.id)) {
				ack({ success: false, error: 'Too many actions, slow down' });
				return;
			}
			const room = currentRoomCode ? getRoom(currentRoomCode) : undefined;
			const playerName = room?.getPlayerNameBySocket(socket.id);
			if (!room || !playerName) {
				ack({ success: false, error: 'Not in a room' });
				return;
			}
			return { room, playerName };
		}

		function enterRoom(room: GameRoom) {
			if (currentRoomCode && currentRoomCode !== room.code) handleDisconnect();
			currentRoomCode = room.code;
			socket.join(room.code);
		}

		on('room:create', (data, callback) => {
			const ack = ackOf<Parameters<typeof callback>[0]>(callback);
			const gmName = normalizePlayerName(data?.gmName);
			if (!gmName) {
				ack({ success: false, error: 'Name must be 1-20 characters' });
				return;
			}

			const room = createRoom(gmName, socket.id, data.password || undefined);
			enterRoom(room);

			const rejoinToken = randomUUID();
			room.rejoinTokens.set(gmName, rejoinToken);

			socket.emit('room:state_update', snapshot(room));
			ack({ success: true, roomCode: room.code, rejoinToken });
		});

		on('room:join', (data, callback) => {
			const ack = ackOf<Parameters<typeof callback>[0]>(callback);
			const room = typeof data?.roomCode === 'string' ? getRoom(data.roomCode.trim()) : undefined;
			if (!room) {
				ack({ success: false, error: 'Room not found' });
				return;
			}

			if (!room.checkPassword(data.password)) {
				ack({ success: false, error: 'Incorrect password' });
				return;
			}

			const playerName = normalizePlayerName(data.playerName);
			if (!playerName) {
				ack({ success: false, error: 'Name must be 1-20 characters' });
				return;
			}

			// Only 'player' or 'spectator' can be requested; the GM role is never granted by a join.
			// Once setup has begun the roster is locked, so late joiners watch instead.
			const requested: Role = data.role === 'spectator' ? 'spectator' : 'player';
			const role: Role = room.phase === 'waiting' ? requested : 'spectator';

			if (!room.addPlayer(playerName, socket.id, role)) {
				ack({ success: false, error: 'Name already taken' });
				return;
			}
			if (role === 'player') room.addGamePlayer(playerName);

			enterRoom(room);

			const rejoinToken = randomUUID();
			room.rejoinTokens.set(playerName, rejoinToken);

			socket.to(room.code).emit('room:player_joined', { playerName, role });
			io?.to(room.code).emit('room:state_update', snapshot(room));
			sendPendingWheels(socket, room);

			ack({ success: true, role, playerName, rejoinToken });
		});

		on('room:rejoin', (data, callback) => {
			const ack = ackOf<Parameters<typeof callback>[0]>(callback);
			const room = typeof data?.roomCode === 'string' ? getRoom(data.roomCode) : undefined;
			if (!room) {
				ack({ success: false, error: 'Room not found' });
				return;
			}

			const storedToken = room.rejoinTokens.get(data.playerName);
			if (!storedToken || storedToken !== data.rejoinToken) {
				ack({ success: false, error: 'Invalid rejoin token' });
				return;
			}

			if (!room.rejoinPlayer(data.playerName, socket.id)) {
				ack({ success: false, error: 'Player not found in room' });
				return;
			}

			enterRoom(room);

			// Everyone else sees the player come back online
			io?.to(room.code).emit('room:state_update', snapshot(room));
			sendPendingWheels(socket, room);

			ack({ success: true, role: room.getPlayerRole(data.playerName) });
		});

		on('room:leave', () => {
			handleDisconnect();
		});

		on('player:action', (data, callback) => {
			const ack = ackOf<Parameters<Ack>[0]>(callback);
			const context = currentContext(ack);
			if (!context) return;

			if (!data?.action || typeof data.action.type !== 'string') {
				ack({ success: false, error: 'Invalid action' });
				return;
			}

			const result = runAction(context.room, context.playerName, data.action);
			ack(result.success ? { success: true } : { success: false, error: result.error });
		});

		on('wheel:request_spin', (data, callback) => {
			const ack = ackOf<Parameters<Ack>[0]>(callback);
			const context = currentContext(ack);
			if (!context) return;
			const { room, playerName } = context;

			const pw = room.pendingWheels.get(data?.wheelKey);
			if (!pw) {
				ack({ success: false, error: 'Wheel not found' });
				return;
			}

			if (pw.forPlayerName !== playerName && room.getPlayerRole(playerName) !== 'gm') {
				ack({ success: false, error: 'Not your wheel' });
				return;
			}

			if (pw.chosenIndex !== undefined) {
				ack({ success: false, error: 'Already spinning' });
				return;
			}

			// Server picks the winner (index into original items array)
			pw.chosenIndex = weightedRandomIndex(pw.items);

			io?.to(room.code).emit('room:wheel_spin', {
				wheelKey: data.wheelKey,
				selectedIndex: pw.shuffledOrder.indexOf(pw.chosenIndex),
				duration: SPIN_DURATION_MS,
				numberOfRevolutions: 4,
				direction: 1
			});

			// If the spinner walks away or disconnects, resolve the landed wheel so the game never stalls
			pw.resolveTimer = setTimeout(() => {
				if (room.pendingWheels.get(data.wheelKey) !== pw) return;
				try {
					runAction(room, pw.forPlayerName, { type: 'WHEEL_SPIN_RESULT', wheelKey: data.wheelKey });
				} catch (err) {
					console.error('[socket.io] wheel auto-resolve failed:', err);
				}
			}, WHEEL_AUTO_RESOLVE_MS);

			ack({ success: true });
		});

		on('room:spectator_hint', (data) => {
			if (hintLimiter.isThrottled(socket.id)) return;
			if (!currentRoomCode) return;

			if (!data || typeof data !== 'object' || !data.hint || typeof data.hint.kind !== 'string')
				return;
			if (JSON.stringify(data).length > MAX_SPECTATOR_HINT_SIZE) return;

			socket.to(currentRoomCode).emit('room:spectator_hint', data);
		});

		function handleDisconnect() {
			actionLimiter.removeSocket(socket.id);
			hintLimiter.removeSocket(socket.id);

			if (!currentRoomCode) return;
			const roomCode = currentRoomCode;
			currentRoomCode = null;
			socket.leave(roomCode);

			const room = getRoom(roomCode);
			const playerName = room?.removePlayerBySocket(socket.id);
			if (!room || !playerName) return;

			socket.to(roomCode).emit('room:player_left', { playerName });
			io?.to(roomCode).emit('room:state_update', snapshot(room));
		}

		socket.on('disconnect', () => {
			try {
				handleDisconnect();
			} catch (err) {
				console.error('[socket.io] disconnect failed:', err);
			}
		});
	});

	return io;
}
