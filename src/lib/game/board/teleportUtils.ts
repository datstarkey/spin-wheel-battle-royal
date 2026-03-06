/**
 * Teleport Utilities
 *
 * Board-level helpers for teleporting players to spawn points and shadow realm tiles.
 * All functions accept a GameContext parameter — no global singleton dependency.
 */

import type { GameContext } from '../gameContext';
import type { Player } from '../player/player.svelte';
import type { Position } from './types';
import { getManhattanDistance } from './types';
import { getRandomSpawnPoint } from './board.svelte';
import { SHADOW_REALM_TILES } from './boardData';

/**
 * Teleport a player to a random spawn point and log an audit trail.
 */
export function teleportToRandomSpawn(player: Player, ctx: GameContext): void {
	const spawn = getRandomSpawnPoint();
	player.position = { ...spawn };
	ctx.addAuditTrail(`${player.name} was defeated and respawned at (${spawn.x}, ${spawn.y})`);
}

/**
 * Find the nearest shadow realm tile to a given position.
 */
export function getNearestShadowRealmTile(fromPosition: Position): Position | null {
	if (SHADOW_REALM_TILES.length === 0) return null;

	let nearest: Position | null = null;
	let minDistance = Infinity;

	for (const tile of SHADOW_REALM_TILES) {
		const distance = getManhattanDistance(fromPosition, tile);
		if (distance < minDistance) {
			minDistance = distance;
			nearest = tile;
		}
	}

	return nearest;
}

/**
 * Check if a player can move (shadow realm players cannot move unless Shadeweaver).
 */
export function canPlayerMove(player: Player): boolean {
	if (!player.inShadowRealm) return true;
	if (player.classType === 'shadeweaver') return true;
	return false;
}
