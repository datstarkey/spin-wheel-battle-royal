import { Game } from '$lib/game/game.svelte';
import { Player } from '$lib/game/player/player.svelte';
import type { WheelBase } from '$lib/game/wheels/wheels';
import type { WheelTheme } from '$lib/components/wheel/types';
import type { Role, RoomPhase, RoomPlayer, RoomState } from '$lib/multiplayer/types';

// ============================================================================
// Room Types
// ============================================================================

export interface PendingWheel {
	items: WheelBase;
	theme?: WheelTheme;
	forPlayerName: string;
	/** Distinguishes combat wheels from generic wheels (avoids stringly-typed key parsing) */
	type?: 'combat' | 'generic';
	/** Shuffled order of item indices — sent to all clients so they render the same visual order */
	shuffledOrder: number[];
	/** Server-chosen winner index (into original items array). Set when wheel:request_spin is processed */
	chosenIndex?: number;
}

export class GameRoom {
	code: string;
	password?: string;
	game: Game;
	gmSocketId: string;
	gmName: string;
	lastActivity: number;
	phase: RoomPhase = 'waiting';

	/** playerName → socketId */
	connectedPlayers = new Map<string, string>();
	/** socketId → playerName */
	socketToPlayer = new Map<string, string>();
	/** playerName → Role */
	playerRoles = new Map<string, Role>();
	/** wheelKey → WheelBase (closures stay server-side) */
	pendingWheels = new Map<string, PendingWheel>();

	/** Monotonically increasing version for delta updates */
	stateVersion = 0;
	/** Turn order determined during setup phase */
	turnOrder: string[] = [];
	/** Classes assigned during setup phase */
	assignedClasses = new Map<string, string>();
	/** Recent action IDs per player for deduplication (ring buffer of last 20) */
	private recentActionIds = new Map<string, string[]>();

	/** Check and record action ID. Returns true if duplicate. */
	isDuplicateAction(playerName: string, actionId: string | undefined): boolean {
		if (!actionId) return false; // No ID = no dedup (backwards compat)
		const recent = this.recentActionIds.get(playerName) ?? [];
		if (recent.includes(actionId)) return true;
		recent.push(actionId);
		if (recent.length > 20) recent.shift();
		this.recentActionIds.set(playerName, recent);
		return false;
	}

	constructor(code: string, gmName: string, gmSocketId: string, password?: string) {
		this.code = code;
		this.gmName = gmName;
		this.gmSocketId = gmSocketId;
		this.password = password;
		this.game = new Game();
		this.lastActivity = Date.now();

		this.connectedPlayers.set(gmName, gmSocketId);
		this.socketToPlayer.set(gmSocketId, gmName);
		this.playerRoles.set(gmName, 'gm');

		// Auto-add GM as a game player
		const gmPlayer = new Player(gmName);
		gmPlayer.setGame(this.game);
		this.game.players.push(gmPlayer);
	}

	touch() {
		this.lastActivity = Date.now();
	}

	addPlayer(name: string, socketId: string, role: Role): boolean {
		if (this.connectedPlayers.has(name) && this.connectedPlayers.get(name) !== socketId) {
			return false; // Name taken by another socket
		}
		this.connectedPlayers.set(name, socketId);
		this.socketToPlayer.set(socketId, name);
		this.playerRoles.set(name, role);
		this.touch();
		return true;
	}

	/** Auto-add as game player if not already present and game hasn't started */
	addGamePlayer(name: string) {
		if (this.game.started) return;
		if (this.game.getPlayerByName(name)) return;
		const player = new Player(name);
		player.setGame(this.game);
		this.game.players.push(player);
	}

	removePlayerBySocket(socketId: string): string | undefined {
		const name = this.socketToPlayer.get(socketId);
		if (!name) return undefined;

		this.socketToPlayer.delete(socketId);
		// Mark as disconnected but keep in connectedPlayers for rejoin
		this.connectedPlayers.delete(name);
		this.touch();
		return name;
	}

	/** Remove a game player (GM kick) */
	removeGamePlayer(name: string) {
		const idx = this.game.players.findIndex((p) => p.name === name);
		if (idx >= 0) this.game.players.splice(idx, 1);
	}

	rejoinPlayer(name: string, socketId: string): boolean {
		const role = this.playerRoles.get(name);
		if (!role) return false;

		// Update socket mappings
		const oldSocketId = this.connectedPlayers.get(name);
		if (oldSocketId) {
			this.socketToPlayer.delete(oldSocketId);
		}
		this.connectedPlayers.set(name, socketId);
		this.socketToPlayer.set(socketId, name);

		if (role === 'gm') {
			this.gmSocketId = socketId;
		}

		this.touch();
		return true;
	}

	isPlayerConnected(name: string): boolean {
		return this.connectedPlayers.has(name);
	}

	getPlayerNameBySocket(socketId: string): string | undefined {
		return this.socketToPlayer.get(socketId);
	}

	getPlayerRole(name: string): Role | undefined {
		return this.playerRoles.get(name);
	}

	hasActiveConnections(): boolean {
		return this.connectedPlayers.size > 0;
	}

	/** Get the name of the current spinner during setup phases */
	getCurrentSpinnerName(): string | undefined {
		if (this.phase === 'turn_order') {
			// Next player to be placed in turn order
			const remaining = this.game.players
				.map((p) => p.name)
				.filter((n) => !this.turnOrder.includes(n));
			// GM spins for turn order, but we track who hasn't been placed yet
			return remaining.length > 0 ? this.gmName : undefined;
		}
		if (this.phase === 'class_selection') {
			// The next player in turn order who hasn't chosen a class
			for (const name of this.turnOrder) {
				if (!this.assignedClasses.has(name)) return name;
			}
		}
		return undefined;
	}

	getRoomState(): RoomState {
		const players: RoomPlayer[] = [];
		for (const [name, role] of this.playerRoles) {
			players.push({
				name,
				role,
				connected: this.connectedPlayers.has(name)
			});
		}

		return {
			roomCode: this.code,
			players,
			gmName: this.gmName,
			started: this.game.started,
			phase: this.phase,
			currentSpinnerName: this.getCurrentSpinnerName()
		};
	}
}

// ============================================================================
// Room Registry
// ============================================================================

const rooms = new Map<string, GameRoom>();

const ROOM_CODE_LENGTH = 6;
const ROOM_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // Check every 15 minutes

function generateRoomCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars: I,O,0,1
	let code: string;
	do {
		code = Array.from({ length: ROOM_CODE_LENGTH }, () =>
			chars.charAt(Math.floor(Math.random() * chars.length))
		).join('');
	} while (rooms.has(code));
	return code;
}

export function createRoom(gmName: string, gmSocketId: string, password?: string): GameRoom {
	const code = generateRoomCode();
	const room = new GameRoom(code, gmName, gmSocketId, password);
	rooms.set(code, room);
	return room;
}

export function getRoom(code: string): GameRoom | undefined {
	return rooms.get(code.toUpperCase());
}

export function removeRoom(code: string): boolean {
	return rooms.delete(code.toUpperCase());
}

export function getRoomCount(): number {
	return rooms.size;
}

// ============================================================================
// Stale Room Cleanup
// ============================================================================

function cleanupStaleRooms() {
	const now = Date.now();
	for (const [code, room] of rooms) {
		if (!room.hasActiveConnections() && now - room.lastActivity > ROOM_TTL_MS) {
			rooms.delete(code);
		}
	}
}

// Start cleanup interval (only runs server-side)
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

export function startCleanupTimer() {
	if (cleanupTimer) return;
	cleanupTimer = setInterval(cleanupStaleRooms, CLEANUP_INTERVAL_MS);
}

export function stopCleanupTimer() {
	if (cleanupTimer) {
		clearInterval(cleanupTimer);
		cleanupTimer = null;
	}
}
