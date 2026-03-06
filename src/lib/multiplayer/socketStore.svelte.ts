import { createContext } from 'svelte';
import { io, type Socket } from 'socket.io-client';
import { Game } from '$lib/game/game.svelte';
import type { Position } from '$lib/game/board/types';
import type { ClassType } from '$lib/game/classes/classType';
import type { AllItems } from '$lib/game/items/itemTypes';
import type {
	ClientToServerEvents,
	GameAction,
	GMWheelType,
	Role,
	ServerToClientEvents,
	SpectatorHint,
	WheelSpinBroadcast
} from './types';
import { loadSession } from './multiplayerStore.svelte';

// ============================================================================
// Store Instance Types (inferred from setter return values)
// ============================================================================

type GameStoreInstance = ReturnType<typeof import('$lib/stores/gameStore.svelte').setGameStore>;
type MultiplayerStoreInstance = ReturnType<
	typeof import('./multiplayerStore.svelte').setMultiplayerStore
>;

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ============================================================================
// SocketStore Class
// ============================================================================

class SocketStore {
	private socket: TypedSocket | null = null;
	private gameStore: GameStoreInstance;
	private mpStore: MultiplayerStoreInstance;
	/** Last applied delta version — used to detect gaps and trigger full sync */
	private lastStateVersion = 0;

	constructor(gameStore: GameStoreInstance, mpStore: MultiplayerStoreInstance) {
		this.gameStore = gameStore;
		this.mpStore = mpStore;
	}

	// =================================================================
	// Connection
	// =================================================================

	connect(url?: string): TypedSocket {
		if (this.socket?.connected) return this.socket;

		const socketUrl = url ?? window.location.origin;
		this.socket = io(socketUrl, {
			path: '/socket.io',
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: 10,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000
		});

		this.mpStore.setConnectionStatus('connecting');

		this.socket.on('connect', () => {
			this.mpStore.setConnectionStatus('connected');
			const session = loadSession();
			if (session?.rejoinToken) {
				this.rejoinRoom(session.roomCode, session.playerName, session.rejoinToken);
			}
		});

		this.socket.on('disconnect', () => {
			this.mpStore.setConnectionStatus('reconnecting');
		});

		this.socket.on('connect_error', () => {
			this.mpStore.setConnectionStatus('reconnecting');
		});

		// ================================================================
		// Server Event Handlers
		// ================================================================

		this.socket.on('room:state_update', (data) => {
			try {
				// Try delta update if we have a valid sequential version
				const canApplyDelta =
					data.delta && this.gameStore.game && data.delta.version === this.lastStateVersion + 1;

				if (canApplyDelta) {
					this.gameStore.game!.applyDelta(data.delta!);
					this.lastStateVersion = data.delta!.version;
				} else {
					// Full state replacement (initial load, rejoin, version gap)
					this.gameStore.game = Game.deserialize(data.gameState);
					if (data.delta) {
						this.lastStateVersion = data.delta.version;
					}
				}

				this.gameStore.syncPlayerPositionsToBoard();

				if (data.roomState) {
					this.mpStore.setConnectedPlayers(data.roomState.players);
					this.mpStore.setRoomPhase(data.roomState.phase);
				}

				// Handle combat state (consolidated into state_update)
				if (data.combatState !== undefined) {
					if (data.combatState === null) {
						this.mpStore.clearCombatState();
					} else {
						this.mpStore.setCombatState(data.combatState);
					}
				}

				const currentPlayerName = this.gameStore.game?.started
					? (this.gameStore.game.currentPlayer?.name ?? '')
					: '';

				// Clear stale spectator hints on turn change
				const prevPlayer = this.mpStore.currentPlayerName;
				if (currentPlayerName && currentPlayerName !== prevPlayer) {
					this.mpStore.clearSpectatorHints();
				}

				this.mpStore.setCurrentPlayerName(currentPlayerName);
			} catch (err) {
				console.error('[socket] Failed to process state update, falling back to full sync:', err);
				try {
					this.gameStore.game = Game.deserialize(data.gameState);
					this.gameStore.syncPlayerPositionsToBoard();
				} catch (fallbackErr) {
					console.error('[socket] Full sync fallback also failed:', fallbackErr);
				}
			}
		});

		this.socket.on('room:wheel_pending', (data) => {
			this.mpStore.addPendingWheel(data);
		});

		this.socket.on('room:wheel_dismiss', (data) => {
			this.mpStore.removePendingWheel(data.wheelKey);
		});

		this.socket.on('room:wheel_spin', (data: WheelSpinBroadcast) => {
			this.mpStore.setWheelSpinParams(data.wheelKey, {
				selectedIndex: data.selectedIndex,
				duration: data.duration,
				numberOfRevolutions: data.numberOfRevolutions,
				direction: data.direction
			});
		});

		this.socket.on('room:player_joined', (data) => {
			console.log(`[socket] ${data.playerName} joined as ${data.role}`);
		});

		this.socket.on('room:player_left', (data) => {
			console.log(`[socket] ${data.playerName} left`);
		});

		this.socket.on('room:error', (data) => {
			console.error('[socket] Server error:', data.message);
		});

		this.socket.on('room:started', () => {
			console.log('[socket] Game started!');
		});

		this.socket.on('room:spectator_hint', (data) => {
			const hint = data.hint;
			switch (hint.kind) {
				case 'movement_mode':
					this.mpStore.setSpectatorMoves(hint.playerName, hint.validMoves);
					break;
				case 'movement_cancel':
					this.mpStore.clearSpectatorMoves();
					break;
				case 'shopping':
					this.mpStore.setShoppingPlayer(hint.playerName, hint.open);
					break;
			}
		});

		return this.socket;
	}

	disconnect() {
		if (this.socket) {
			this.socket.emit('room:leave');
			this.socket.disconnect();
			this.socket = null;
		}
		this.lastStateVersion = 0;
		this.mpStore.reset();
		this.gameStore.game = null;
	}

	getSocket(): TypedSocket | null {
		return this.socket;
	}

	autoReconnect() {
		const session = loadSession();
		if (session) {
			this.connect();
		}
	}

	// =================================================================
	// Room Operations
	// =================================================================

	private async ensureConnected(): Promise<void> {
		if (this.socket?.connected) return;
		this.connect();
		await new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => {
				this.socket!.off('connect', onConnect);
				this.socket!.off('connect_error', onError);
				reject(new Error('Connection timed out after 10s'));
			}, 10_000);

			const onConnect = () => {
				clearTimeout(timeout);
				this.socket!.off('connect_error', onError);
				resolve();
			};

			const onError = (err: Error) => {
				clearTimeout(timeout);
				this.socket!.off('connect', onConnect);
				reject(new Error(`Connection failed: ${err.message}`));
			};

			this.socket!.once('connect', onConnect);
			this.socket!.once('connect_error', onError);
		});
	}

	async createRoom(
		gmName: string,
		password?: string
	): Promise<{ success: boolean; roomCode?: string; error?: string }> {
		await this.ensureConnected();

		return new Promise((resolve) => {
			this.socket!.emit('room:create', { gmName, password }, (response) => {
				if (response.success && response.roomCode) {
					this.mpStore.setMyRole('gm');
					this.mpStore.setMyPlayerName(gmName);
					this.mpStore.setRoomCode(response.roomCode);
					if (response.rejoinToken) this.mpStore.setRejoinToken(response.rejoinToken);
					this.mpStore.saveSession();
				}
				resolve(response);
			});
		});
	}

	async joinRoom(
		roomCode: string,
		playerName: string,
		password?: string,
		role?: Role
	): Promise<{ success: boolean; error?: string }> {
		await this.ensureConnected();

		return new Promise((resolve) => {
			this.socket!.emit('room:join', { roomCode, playerName, password, role }, (response) => {
				if (response.success) {
					this.mpStore.setMyRole(response.role ?? role ?? 'player');
					this.mpStore.setMyPlayerName(playerName);
					this.mpStore.setRoomCode(roomCode);
					if (response.rejoinToken) this.mpStore.setRejoinToken(response.rejoinToken);
					this.mpStore.saveSession();
				}
				resolve(response);
			});
		});
	}

	async rejoinRoom(
		roomCode: string,
		playerName: string,
		rejoinToken: string
	): Promise<{ success: boolean; error?: string }> {
		if (!this.socket?.connected) return { success: false, error: 'Not connected' };

		return new Promise((resolve) => {
			this.socket!.emit('room:rejoin', { roomCode, playerName, rejoinToken }, (response) => {
				if (response.success) {
					this.mpStore.setMyRole(response.role ?? 'player');
					this.mpStore.setMyPlayerName(playerName);
					this.mpStore.setRoomCode(roomCode);
					this.mpStore.saveSession();
				} else {
					this.mpStore.reset();
				}
				resolve(response);
			});
		});
	}

	// =================================================================
	// Action Dispatch
	// =================================================================

	sendAction(
		action: GameAction,
		callback?: (response: { success: boolean; error?: string }) => void
	) {
		if (!this.socket?.connected) {
			callback?.({ success: false, error: 'Not connected' });
			return;
		}
		const fullAction = { ...action, actionId: action.actionId ?? crypto.randomUUID() };
		this.socket.emit('player:action', { action: fullAction }, callback);
	}

	sendSpectatorHint(hint: SpectatorHint) {
		this.socket?.emit('room:spectator_hint', { hint });
	}

	requestWheelSpin(wheelKey: string) {
		this.socket?.emit('wheel:request_spin', { wheelKey });
	}

	sendWheelSpinResult(
		wheelKey: string,
		selectedIndex: number,
		callback?: (response: { success: boolean; error?: string }) => void
	) {
		if (!this.socket?.connected) {
			callback?.({ success: false, error: 'Not connected' });
			return;
		}
		this.socket.emit('wheel:spin_result', { wheelKey, selectedIndex }, callback);
	}

	private dispatch(action: GameAction) {
		this.sendAction(action, (response) => {
			if (!response?.success) {
				console.error('[gameActions]', response?.error ?? 'Action failed');
			}
		});
	}

	// =================================================================
	// Game Actions
	// =================================================================

	move(position: Position) {
		this.dispatch({ type: 'MOVE', position });
	}
	finishTurn() {
		this.dispatch({ type: 'FINISH_TURN' });
	}
	attackResolve(attackerName: string, defenderName: string) {
		this.dispatch({ type: 'ATTACK_RESOLVE', attackerName, defenderName });
	}
	shopBuy(item: AllItems) {
		this.dispatch({ type: 'SHOP_BUY', item });
	}
	shopReroll() {
		this.dispatch({ type: 'SHOP_REROLL' });
	}
	casino() {
		this.dispatch({ type: 'CASINO' });
	}
	castSpell(spellLevel: 'minor' | 'major' | 'ultimate', targetName?: string) {
		this.dispatch({ type: 'SPELL_CAST', spellLevel, targetName });
	}
	useConsumable(item: AllItems) {
		this.dispatch({ type: 'USE_CONSUMABLE', item });
	}
	teleport(destination: Position) {
		this.dispatch({ type: 'TELEPORT', destination });
	}

	// =================================================================
	// GM Actions
	// =================================================================

	gmStartGame() {
		this.dispatch({ type: 'GM_START_GAME' });
	}
	gmRemovePlayer(playerName: string) {
		this.dispatch({ type: 'GM_REMOVE_PLAYER', playerName });
	}
	gmSetClass(playerName: string, classType: ClassType) {
		this.dispatch({ type: 'GM_SET_CLASS', playerName, classType });
	}
	gmSetHp(playerName: string, hp: number) {
		this.dispatch({ type: 'GM_SET_HP', playerName, hp });
	}
	gmSetGold(playerName: string, gold: number) {
		this.dispatch({ type: 'GM_SET_GOLD', playerName, gold });
	}
	gmSetAttack(playerName: string, attack: number) {
		this.dispatch({ type: 'GM_SET_ATTACK', playerName, attack });
	}
	gmSetDefense(playerName: string, defense: number) {
		this.dispatch({ type: 'GM_SET_DEFENSE', playerName, defense });
	}
	gmGiveItem(playerName: string, item: AllItems) {
		this.dispatch({ type: 'GM_GIVE_ITEM', playerName, item });
	}
	gmKillPlayer(playerName: string) {
		this.dispatch({ type: 'GM_KILL_PLAYER', playerName });
	}
	gmRevivePlayer(playerName: string) {
		this.dispatch({ type: 'GM_REVIVE_PLAYER', playerName });
	}
	gmAddWheel(playerName: string, wheelType: GMWheelType) {
		this.dispatch({ type: 'GM_ADD_WHEEL', playerName, wheelType });
	}
}

// ============================================================================
// Context — NO _instance
// ============================================================================

const [get, set] = createContext<SocketStore>();

export function getSocketStore() {
	return get();
}

export function setSocketStore(gameStore: GameStoreInstance, mpStore: MultiplayerStoreInstance) {
	const store = new SocketStore(gameStore, mpStore);
	set(store);
	return store;
}
