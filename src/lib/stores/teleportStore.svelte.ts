import { gameBoard } from '$lib/game/board/board.svelte';
import { SHADOW_REALM_TILES, SPAWN_ZONES } from '$lib/game/board/boardData';
import type { Position } from '$lib/game/board/types';
import type { Player } from '$lib/game/player/player.svelte';
import toast from '$lib/stores/toaster.svelte';
import { getServerGameContext } from '$lib/game/serverContext';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get the Manhattan distance between two positions
 */
function getDistanceToPosition(from: Position, to: Position): number {
	return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

/**
 * Get all available spawn points from all spawn zones
 */
function getAllSpawnPoints(): Position[] {
	const spawnPoints: Position[] = [];
	for (const zone of SPAWN_ZONES) {
		spawnPoints.push(...zone.spawnPoints);
	}
	return spawnPoints;
}

/**
 * Get a random spawn point position
 */
export function getRandomSpawnPosition(): Position | null {
	const allSpawnPoints = getAllSpawnPoints();
	if (allSpawnPoints.length === 0) return null;

	const randomIndex = Math.floor(Math.random() * allSpawnPoints.length);
	return { ...allSpawnPoints[randomIndex] };
}

/**
 * Shared helper: teleport a player to a random spawn point and log with a custom audit message
 */
function teleportPlayerToSpawn(player: Player, auditMessage: string): void {
	const randomSpawn = getRandomSpawnPosition();
	if (!randomSpawn) {
		toast.error('No spawn points found!');
		return;
	}

	player.position = { ...randomSpawn };
	gameBoard.setPlayerPosition(player.name, randomSpawn);

	getServerGameContext().addAuditTrail(
		auditMessage.replace('{x}', String(randomSpawn.x)).replace('{y}', String(randomSpawn.y))
	);
}

// ============================================================================
// Shadow Realm Movement
// ============================================================================

/**
 * Find the nearest shadow realm tile to a given position
 */
export function getNearestShadowRealmTile(fromPosition: Position): Position | null {
	if (SHADOW_REALM_TILES.length === 0) return null;

	let nearest: Position | null = null;
	let minDistance = Infinity;

	for (const tile of SHADOW_REALM_TILES) {
		const distance = getDistanceToPosition(fromPosition, tile);
		if (distance < minDistance) {
			minDistance = distance;
			nearest = tile;
		}
	}

	return nearest;
}

/**
 * Teleport a player to the nearest shadow realm tile
 * Called when a player enters the shadow realm
 */
export function teleportToShadowRealm(player: Player): void {
	if (!player.position) return;

	const nearestShadowTile = getNearestShadowRealmTile(player.position);
	if (!nearestShadowTile) {
		toast.error('No shadow realm tiles found!');
		return;
	}

	player.position = { ...nearestShadowTile };
	gameBoard.setPlayerPosition(player.name, nearestShadowTile);

	getServerGameContext().addAuditTrail(
		`${player.name} was teleported to the Shadow Realm at (${nearestShadowTile.x}, ${nearestShadowTile.y})`
	);
}

/**
 * Teleport a player to a random spawn point
 * Called when a player leaves the shadow realm
 */
export function teleportFromShadowRealm(player: Player): void {
	teleportPlayerToSpawn(
		player,
		`${player.name} escaped the Shadow Realm and spawned at ({x}, {y})`
	);
}

/**
 * Teleport a player to a random spawn point
 * Called when a player is defeated
 */
export function teleportToRandomSpawn(player: Player): void {
	teleportPlayerToSpawn(player, `${player.name} was defeated and respawned at ({x}, {y})`);
}

/**
 * Check if a player can move (shadow realm players cannot move unless Shadeweaver)
 */
export function canPlayerMove(player: Player): boolean {
	if (!player.inShadowRealm) return true;

	// Shadeweaver can move in shadow realm
	if (player.classType === 'shadeweaver') return true;

	return false;
}
