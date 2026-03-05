import { createContext } from 'svelte';
import type {
	CombatState,
	PendingWheelPayload,
	Role,
	RoomPhase,
	RoomPlayer,
	WheelSpinParams
} from './types';

// ============================================================================
// Session Persistence (standalone — works before context is initialized)
// ============================================================================

const SESSION_KEY = 'mp_session';

interface SessionData {
	roomCode: string;
	playerName: string;
	role: Role;
}

export function loadSession(): SessionData | null {
	try {
		const raw = sessionStorage.getItem(SESSION_KEY);
		if (!raw) return null;
		return JSON.parse(raw) as SessionData;
	} catch {
		return null;
	}
}

// ============================================================================
// Store Class
// ============================================================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

class MultiplayerStore {
	// Connection state
	private _connectionStatus = $state<ConnectionStatus>('disconnected');
	private _myRole = $state<Role>('player');
	private _myPlayerName = $state('');
	private _currentPlayerName = $state('');
	private _roomCode = $state('');
	private _connectedPlayers = $state<RoomPlayer[]>([]);
	private _pendingWheels = $state<PendingWheelPayload[]>([]);
	private _combatState = $state<CombatState | null>(null);
	private _roomPhase = $state<RoomPhase>('waiting');

	// -----------------------------------------------------------
	// Reactive getters
	// -----------------------------------------------------------

	get connectionStatus() {
		return this._connectionStatus;
	}
	get myRole() {
		return this._myRole;
	}
	get myPlayerName() {
		return this._myPlayerName;
	}
	get roomCode() {
		return this._roomCode;
	}
	get connectedPlayers() {
		return this._connectedPlayers;
	}
	get pendingWheels() {
		return this._pendingWheels;
	}
	get combatState() {
		return this._combatState;
	}
	get roomPhase() {
		return this._roomPhase;
	}

	// -----------------------------------------------------------
	// Derived getters
	// -----------------------------------------------------------

	get isConnected(): boolean {
		return this._connectionStatus === 'connected' && this._roomCode !== '';
	}

	get isMyTurn(): boolean {
		return this._currentPlayerName !== '' && this._currentPlayerName === this._myPlayerName;
	}

	get iAmGM(): boolean {
		return this._myRole === 'gm';
	}

	get canAct(): boolean {
		return this.isMyTurn || this.iAmGM;
	}

	// -----------------------------------------------------------
	// Setters (called by socketClient)
	// -----------------------------------------------------------

	setConnectionStatus(status: ConnectionStatus) {
		this._connectionStatus = status;
	}

	setMyRole(role: Role) {
		this._myRole = role;
	}

	setMyPlayerName(name: string) {
		this._myPlayerName = name;
	}

	setCurrentPlayerName(name: string) {
		this._currentPlayerName = name;
	}

	setRoomCode(code: string) {
		this._roomCode = code;
	}

	setConnectedPlayers(players: RoomPlayer[]) {
		this._connectedPlayers = players;
	}

	setRoomPhase(phase: RoomPhase) {
		this._roomPhase = phase;
	}

	// -----------------------------------------------------------
	// Pending wheels
	// -----------------------------------------------------------

	addPendingWheel(wheel: PendingWheelPayload) {
		this._pendingWheels = [...this._pendingWheels, wheel];
	}

	removePendingWheel(wheelKey: string) {
		this._pendingWheels = this._pendingWheels.filter((w) => w.key !== wheelKey);
	}

	clearPendingWheels() {
		this._pendingWheels = [];
	}

	setWheelSpinParams(wheelKey: string, params: WheelSpinParams) {
		const wheel = this._pendingWheels.find((w) => w.key === wheelKey);
		if (!wheel) return;
		wheel.spinState = 'spinning';
		wheel.spinParams = params;
		this._pendingWheels = [...this._pendingWheels];
	}

	setWheelLanded(wheelKey: string) {
		const wheel = this._pendingWheels.find((w) => w.key === wheelKey);
		if (!wheel) return;
		wheel.spinState = 'landed';
		this._pendingWheels = [...this._pendingWheels];
	}

	// -----------------------------------------------------------
	// Combat state
	// -----------------------------------------------------------

	setCombatState(state: CombatState | null) {
		this._combatState = state;
	}

	clearCombatState() {
		this._combatState = null;
	}

	// -----------------------------------------------------------
	// Session persistence
	// -----------------------------------------------------------

	saveSession() {
		const data: SessionData = {
			roomCode: this._roomCode,
			playerName: this._myPlayerName,
			role: this._myRole
		};
		try {
			sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
		} catch {
			// Ignore storage errors
		}
	}

	clearSession() {
		try {
			sessionStorage.removeItem(SESSION_KEY);
		} catch {
			// Ignore
		}
	}

	// -----------------------------------------------------------
	// Reset
	// -----------------------------------------------------------

	reset() {
		this._connectionStatus = 'disconnected';
		this._myRole = 'player';
		this._myPlayerName = '';
		this._roomCode = '';
		this._connectedPlayers = [];
		this._pendingWheels = [];
		this._roomPhase = 'waiting';
		this.clearSession();
	}
}

// ============================================================================
// Context — NO _instance, NO module-level helpers
// ============================================================================

const [get, set] = createContext<MultiplayerStore>();

export function getMultiplayerStore() {
	return get();
}

export function setMultiplayerStore() {
	const store = new MultiplayerStore();
	set(store);
	return store;
}
