/**
 * Board State Manager
 *
 * Manages the game board state including player positions,
 * valid moves calculation, and tile interactions.
 */

import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { BOARD_HEIGHT, BOARD_WIDTH, SPAWN_ZONES, TELEPORTERS, TILES } from './boardData';
import type { Direction, Position, Tile, TileType } from './types';
import { getAdjacentPosition, getManhattanDistance, isInBounds, positionsEqual } from './types';

/**
 * Get a tile at a specific position
 */
export function getTileAt(pos: Position): Tile | undefined {
	if (!isInBounds(pos, BOARD_WIDTH, BOARD_HEIGHT)) {
		return undefined;
	}
	return TILES[pos.y]?.[pos.x];
}

/**
 * Check if a position is walkable
 */
export function isWalkable(pos: Position): boolean {
	const tile = getTileAt(pos);
	return tile?.walkable ?? false;
}

/**
 * Check if movement from one tile to an adjacent tile is valid
 * (respects the connection directions)
 */
export function canMoveBetween(from: Position, to: Position): boolean {
	const fromTile = getTileAt(from);
	const toTile = getTileAt(to);

	if (!fromTile || !toTile || !fromTile.walkable || !toTile.walkable) {
		return false;
	}

	// Determine direction of movement
	const dx = to.x - from.x;
	const dy = to.y - from.y;

	// Must be adjacent (Manhattan distance of 1)
	if (Math.abs(dx) + Math.abs(dy) !== 1) {
		return false;
	}

	let direction: Direction;
	if (dy === -1) direction = 'north';
	else if (dy === 1) direction = 'south';
	else if (dx === 1) direction = 'east';
	else direction = 'west';

	// Check if the from tile has this connection
	return fromTile.connections.includes(direction);
}

/**
 * Calculate all valid move positions from a starting position within a given range.
 * Uses BFS (flood fill) respecting tile connections.
 */
export function getValidMoves(startPos: Position, range: number): Position[] {
	const validMoves: Position[] = [];
	const visited = new SvelteSet<string>();
	const queue: { pos: Position; distance: number }[] = [{ pos: startPos, distance: 0 }];

	const posKey = (p: Position) => `${p.x},${p.y}`;
	visited.add(posKey(startPos));

	while (queue.length > 0) {
		const current = queue.shift()!;

		// Add to valid moves (except starting position)
		if (current.distance > 0) {
			validMoves.push(current.pos);
		}

		// If we've reached max range, don't explore further
		if (current.distance >= range) {
			continue;
		}

		// Get the current tile
		const currentTile = getTileAt(current.pos);
		if (!currentTile) continue;

		// Explore each valid connection
		for (const direction of currentTile.connections) {
			const nextPos = getAdjacentPosition(current.pos, direction);
			const key = posKey(nextPos);

			if (!visited.has(key) && isWalkable(nextPos)) {
				visited.add(key);
				queue.push({ pos: nextPos, distance: current.distance + 1 });
			}
		}
	}

	return validMoves;
}

/**
 * Get players that can be attacked from a position (within attack range)
 */
export function getPlayersInAttackRange(
	attackerPos: Position,
	attackRange: number,
	allPlayerPositions: Map<string, Position>,
	excludePlayerId?: string
): string[] {
	const inRange: string[] = [];

	for (const [playerId, pos] of allPlayerPositions) {
		if (playerId === excludePlayerId) continue;

		const distance = getManhattanDistance(attackerPos, pos);
		// Can attack if on same tile (distance 0) or within range
		if (distance <= attackRange) {
			inRange.push(playerId);
		}
	}

	return inRange;
}

/**
 * Get available spawn points for a spawn zone
 */
export function getSpawnPointsForZone(zoneId: number): Position[] {
	const zone = SPAWN_ZONES.find((z) => z.id === zoneId);
	return zone?.spawnPoints ?? [];
}

/**
 * Get all outer teleporter positions (for teleporter destination selection)
 */
export function getOuterTeleporters(): Position[] {
	return TELEPORTERS.outer;
}

/**
 * Get the inner (center) teleporter position
 */
export function getInnerTeleporter(): Position {
	return TELEPORTERS.inner;
}

/**
 * Check if a position is an outer teleporter
 */
export function isOuterTeleporter(pos: Position): boolean {
	return TELEPORTERS.outer.some((t) => positionsEqual(t, pos));
}

/**
 * Check if a position is the inner teleporter
 */
export function isInnerTeleporter(pos: Position): boolean {
	return positionsEqual(TELEPORTERS.inner, pos);
}

/**
 * Get other outer teleporters (excluding the one at given position)
 */
export function getOtherOuterTeleporters(currentPos: Position): Position[] {
	return TELEPORTERS.outer.filter((t) => !positionsEqual(t, currentPos));
}

/**
 * Board state class with reactive properties
 */
export class GameBoard {
	/** Map of player ID to their current position */
	playerPositions = new SvelteMap<string, Position>();

	/** Currently highlighted valid move positions */
	highlightedMoves = $state<Position[]>([]);

	/** Currently selected tile (for UI) */
	selectedTile = $state<Position | null>(null);

	/**
	 * Set a player's position on the board
	 */
	setPlayerPosition(playerId: string, position: Position): void {
		// SvelteMap is already reactive, no need to reassign
		this.playerPositions.set(playerId, position);
	}

	/**
	 * Get a player's current position
	 */
	getPlayerPosition(playerId: string): Position | undefined {
		return this.playerPositions.get(playerId);
	}

	/**
	 * Remove a player from the board (e.g., when they die)
	 */
	removePlayer(playerId: string): void {
		// SvelteMap is already reactive, no need to reassign
		this.playerPositions.delete(playerId);
	}

	/**
	 * Get all players at a specific position
	 */
	getPlayersAt(pos: Position): string[] {
		const players: string[] = [];
		for (const [playerId, playerPos] of this.playerPositions) {
			if (positionsEqual(playerPos, pos)) {
				players.push(playerId);
			}
		}
		return players;
	}

	/**
	 * Calculate and highlight valid moves for a player
	 */
	showValidMoves(playerId: string, range: number): void {
		const pos = this.getPlayerPosition(playerId);
		if (pos) {
			this.highlightedMoves = getValidMoves(pos, range);
		}
	}

	/**
	 * Clear highlighted moves
	 */
	clearHighlights(): void {
		this.highlightedMoves = [];
		this.selectedTile = null;
	}

	/**
	 * Check if a position is highlighted as a valid move
	 */
	isHighlighted(pos: Position): boolean {
		return this.highlightedMoves.some((p) => positionsEqual(p, pos));
	}

	/**
	 * Move a player to a new position (with validation)
	 */
	movePlayer(playerId: string, to: Position): boolean {
		const from = this.getPlayerPosition(playerId);
		if (!from) return false;

		// Check if destination is in valid moves
		const validMoves =
			this.highlightedMoves.length > 0 ? this.highlightedMoves : getValidMoves(from, 10); // Fallback to max range

		if (!validMoves.some((p) => positionsEqual(p, to))) {
			return false;
		}

		this.setPlayerPosition(playerId, to);
		this.clearHighlights();
		return true;
	}

	/**
	 * Get the tile type at a player's position
	 */
	getPlayerTileType(playerId: string): TileType | undefined {
		const pos = this.getPlayerPosition(playerId);
		if (!pos) return undefined;
		return getTileAt(pos)?.type;
	}

	/**
	 * Serialize board state for saving
	 */
	serialize(): Record<string, Position> {
		const positions: Record<string, Position> = {};
		for (const [playerId, pos] of this.playerPositions) {
			positions[playerId] = pos;
		}
		return positions;
	}

	/**
	 * Deserialize board state from saved data
	 */
	deserialize(data: Record<string, Position>): void {
		// Clear existing and repopulate the SvelteMap
		this.playerPositions.clear();
		for (const [playerId, pos] of Object.entries(data)) {
			this.playerPositions.set(playerId, pos);
		}
	}
}

// Export singleton instance
export const gameBoard = new GameBoard();
