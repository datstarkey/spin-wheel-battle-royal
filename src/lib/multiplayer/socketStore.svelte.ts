import { createContext } from 'svelte';
import { io, type Socket } from 'socket.io-client';
import { Game } from '#lib/game/game.svelte.js';
import type { Position } from '#lib/game/board/types.js';
import type { AllItems } from '#lib/game/items/itemTypes.js';
import type {
	ActionOf,
	ActionPayload,
	ActionType,
	ClientToServerEvents,
	GameAction,
	Role,
	ServerToClientEvents,
	SpectatorHint,
	WheelSpinBroadcast
} from './types';
import { loadSession } from './multiplayerStore.svelte';

// ============================================================================
// Store Instance Types (inferred from setter return values)
// ============================================================================

type GameStoreInstance = ReturnType<typeof import('#lib/stores/gameStore.svelte.js').setGameStore>;
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
				// The server resends every live wheel on rejoin; drop ours so dismissed ones don't linger
				this.mpStore.clearPendingWheels();
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
				// Apply the delta only when it directly follows the state we hold
				const game = this.gameStore.game;
				if (game && data.delta && data.delta.version === this.lastStateVersion + 1) {
					game.applyDelta(data.delta);
				} else if (!game || data.version !== this.lastStateVersion || !data.delta) {
					// Initial load, rejoin, version gap, or a change the server sent without a delta
					this.gameStore.game = Game.deserialize(data.gameState);
				}
				this.lastStateVersion = data.version;

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
					this.mpStore.setMyPlayerName(response.playerName ?? gmName);
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
					this.mpStore.setMyPlayerName(response.playerName ?? playerName);
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
					// Keep the token in the saved session, or the next refresh can't rejoin
					this.mpStore.setRejoinToken(rejoinToken);
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

	/** Confirm a landed wheel; the server applies the outcome it chose */
	confirmWheel(wheelKey: string) {
		this.act('WHEEL_SPIN_RESULT', { wheelKey });
	}

	private dispatch(action: GameAction) {
		this.sendAction(action, (response) => {
			if (!response?.success) {
				console.error('[gameActions]', response?.error ?? 'Action failed');
			}
		});
	}

	/** Send any action; failures are logged (the server is the source of truth) */
	act<T extends ActionType>(type: T, payload?: ActionPayload<T>) {
		this.dispatch({ type, ...(payload ?? {}) } as ActionOf<T>);
	}

	// =================================================================
	// Game Actions
	// =================================================================

	move(position: Position) {
		this.act('MOVE', { position });
	}
	finishTurn() {
		this.act('FINISH_TURN');
	}
	attackResolve(attackerName: string, defenderName: string) {
		this.act('ATTACK_RESOLVE', { attackerName, defenderName });
	}
	shopBuy(item: AllItems) {
		this.act('SHOP_BUY', { item });
	}
	shopReroll() {
		this.act('SHOP_REROLL');
	}
	casino() {
		this.act('CASINO');
	}
	castSpell(spellLevel: 'minor' | 'major' | 'ultimate', targetName?: string) {
		this.act('SPELL_CAST', { spellLevel, targetName });
	}
	useConsumable(item: AllItems) {
		this.act('USE_CONSUMABLE', { item });
	}
	teleport(destination: Position) {
		this.act('TELEPORT', { destination });
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
