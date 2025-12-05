import { page } from '$app/state';
import { gameBoard, getValidMoves } from '$lib/game/board/board.svelte';
import { SHADOW_REALM_TILES, SPAWN_ZONES } from '$lib/game/board/boardData';
import type { Position } from '$lib/game/board/types';
import { positionsEqual } from '$lib/game/board/types';
import { Game } from '$lib/game/game.svelte';
import { getItemByType, type AllItems } from '$lib/game/items/itemTypes';
import { Player } from '$lib/game/player/player.svelte';
import type { WheelBase } from '$lib/game/wheels/wheels';
import toast from '$lib/stores/toaster.svelte';
import { localStorageStore } from './localStorageStore.svelte';

// ============================================================================
// Movement State
// ============================================================================

/** Whether the current player is in movement mode */
let _isMovementMode = $state(false);

export function getIsMovementMode() {
	return _isMovementMode;
}

export function getHasMovedThisTurn() {
	return currentGame.value?.hasMoved ?? false;
}

export function getHasShoppedThisTurn() {
	return currentGame.value?.hasShopped ?? false;
}

export function setHasShoppedThisTurn(value: boolean) {
	if (!currentGame.value) return;
	currentGame.value.hasShopped = value;
}

/**
 * Enter movement mode - highlights valid moves for the current player
 */
export function enterMovementMode() {
	if (!currentGame.value) return;
	if (currentGame.value.hasMoved) {
		toast.error('You have already moved this turn!');
		return;
	}

	const currentPlayer = currentGame.value.currentPlayer;
	if (!currentPlayer?.position) return;

	// Check if player can move (shadow realm restriction)
	if (!canPlayerMove(currentPlayer)) {
		toast.error('You cannot move while in the Shadow Realm!');
		return;
	}

	_isMovementMode = true;

	// Calculate and highlight valid moves based on player's movement stat
	// Players not in shadow realm cannot move onto shadow realm tiles
	const excludeShadowRealm = !currentPlayer.inShadowRealm;
	const validMoves = getValidMoves(currentPlayer.position, currentPlayer.movement, excludeShadowRealm);
	gameBoard.highlightedMoves = validMoves;
}

/**
 * Exit movement mode - clears highlights
 */
export function exitMovementMode() {
	_isMovementMode = false;
	gameBoard.clearHighlights();
}

/**
 * Attempt to move the current player to a position
 */
export function moveCurrentPlayerTo(position: Position): boolean {
	if (!currentGame.value || !_isMovementMode) return false;

	const currentPlayer = currentGame.value.currentPlayer;
	if (!currentPlayer?.position) return false;

	// Check if the position is a valid move
	const isValidMove = gameBoard.highlightedMoves.some((p) => positionsEqual(p, position));
	if (!isValidMove) {
		toast.error('Invalid move!');
		return false;
	}

	// Move the player
	const oldPos = { ...currentPlayer.position };
	currentPlayer.position = { ...position };

	// Update the game board
	gameBoard.setPlayerPosition(currentPlayer.name, position);

	// Log the move
	addAuditTrail(`${currentPlayer.name} moved from (${oldPos.x}, ${oldPos.y}) to (${position.x}, ${position.y})`);

	// Mark as moved and exit movement mode
	currentGame.value.hasMoved = true;
	exitMovementMode();

	return true;
}

/**
 * Reset movement state for a new turn (only resets UI state, turn actions are reset in Game class)
 */
export function resetMovementState() {
	_isMovementMode = false;
	gameBoard.clearHighlights();
}

/**
 * Check if the current player is on a shop tile
 */
export function isCurrentPlayerOnShop(): boolean {
	if (!currentGame.value) return false;
	const player = currentGame.value.currentPlayer;
	if (!player?.position) return false;

	const tile = gameBoard.getPlayerTileType(player.name);
	return tile === 'shop';
}

/**
 * Get the Manhattan distance between two players
 */
export function getDistanceBetweenPlayers(player1Name: string, player2Name: string): number {
	const player1 = getPlayerByName(player1Name);
	const player2 = getPlayerByName(player2Name);

	const pos1 = player1?.position;
	const pos2 = player2?.position;

	if (!pos1 || !pos2) return Infinity;

	return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

/**
 * Check if a target player is within attack range of the current player
 * In the Shadow Realm, any player can attack any other player (no range limit)
 */
export function isPlayerInAttackRange(targetName: string): boolean {
	if (!currentGame.value) return false;
	const attacker = currentGame.value.currentPlayer;
	if (!attacker) return false;

	// In the Shadow Realm, any player can attack any other player
	if (attacker.inShadowRealm) {
		return true;
	}

	const distance = getDistanceBetweenPlayers(attacker.name, targetName);
	return distance <= attacker.attackRange;
}

// ============================================================================
// Shadow Realm Movement
// ============================================================================

/**
 * Get the Manhattan distance between a position and another position
 */
function getDistanceToPosition(from: Position, to: Position): number {
	return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

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
 * Get a random spawn point position
 */
export function getRandomSpawnPosition(): Position | null {
	const allSpawnPoints = getAllSpawnPoints();
	if (allSpawnPoints.length === 0) return null;

	const randomIndex = Math.floor(Math.random() * allSpawnPoints.length);
	return { ...allSpawnPoints[randomIndex] };
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

	const oldPos = { ...player.position };
	player.position = { ...nearestShadowTile };
	gameBoard.setPlayerPosition(player.name, nearestShadowTile);

	addAuditTrail(
		`${player.name} was teleported to the Shadow Realm at (${nearestShadowTile.x}, ${nearestShadowTile.y})`
	);
}

/**
 * Teleport a player to a random spawn point
 * Called when a player leaves the shadow realm
 */
export function teleportFromShadowRealm(player: Player): void {
	const randomSpawn = getRandomSpawnPosition();
	if (!randomSpawn) {
		toast.error('No spawn points found!');
		return;
	}

	player.position = { ...randomSpawn };
	gameBoard.setPlayerPosition(player.name, randomSpawn);

	addAuditTrail(
		`${player.name} escaped the Shadow Realm and spawned at (${randomSpawn.x}, ${randomSpawn.y})`
	);
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

if (page.url.searchParams.get('clear') == 'true') {
	resetGame();
}

export const currentGame = localStorageStore<Game | null>('currentGame', null);

export function getGlobalHpReduction() {
	return currentGame.value?.globalHpReduction ?? 0;
}

export function increaseGlobalHpReduction(amount: number = 0) {
	if (!currentGame.value) return;
	if (amount == 0) {
		currentGame.value.globalHpReduction *= 2;
	} else {
		currentGame.value.globalHpReduction += amount;
	}

	addAuditTrail(`Global HP reduction is now ${currentGame.value.globalHpReduction}`);
}

function gameHasStarted() {
	if (currentGame.value?.started) {
		toast.error("Can't modify game after it has started!");
		return true;
	}
	return false;
}

export function resetGame() {
	currentGame.value = new Game();
}

export function addPlayer(name: string) {
	if (currentGame.value?.started) {
		gameHasStarted();
		return;
	}
	currentGame.value?.players.push(new Player(name));
}

export function removePlayer(player: Player) {
	if (currentGame.value?.started) {
		gameHasStarted();
		return;
	}
	currentGame.value?.players.splice(currentGame.value?.players.indexOf(player), 1);
}

/**
 * Returns the reference to the player with the given name
 * @param name The name of the player to get
 * @returns
 */

export function getPlayerByName(name?: string): Player | undefined {
	return currentGame.value?.players.find((player) => player.name === name);
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
 * Assign spawn positions to players who don't have one
 */
function assignSpawnPositions() {
	if (!currentGame.value) return;

	const availableSpawns = getAllSpawnPoints();
	const usedPositions = new Set<string>();

	// First, mark positions already in use
	for (const player of currentGame.value.players) {
		if (player.position) {
			usedPositions.add(`${player.position.x},${player.position.y}`);
		}
	}

	// Assign spawn points to players without positions
	for (const player of currentGame.value.players) {
		if (!player.position) {
			// Find an available spawn point
			const availableSpawn = availableSpawns.find(
				(sp) => !usedPositions.has(`${sp.x},${sp.y}`)
			);

			if (availableSpawn) {
				player.position = { ...availableSpawn };
				usedPositions.add(`${availableSpawn.x},${availableSpawn.y}`);
				addAuditTrail(`${player.name} spawned at (${availableSpawn.x}, ${availableSpawn.y})`);
			} else {
				// If no spawn points available, pick a random one (allows multiple players on same tile)
				const randomSpawn = availableSpawns[Math.floor(Math.random() * availableSpawns.length)];
				if (randomSpawn) {
					player.position = { ...randomSpawn };
					addAuditTrail(`${player.name} spawned at (${randomSpawn.x}, ${randomSpawn.y})`);
				}
			}
		}
	}
}

/**
 * Sync player positions to the GameBoard for rendering
 */
export function syncPlayerPositionsToBoard() {
	if (!currentGame.value) return;

	// Clear existing positions and re-add all players
	gameBoard.playerPositions.clear();

	for (const player of currentGame.value.players) {
		if (player.position && !player.dead) {
			gameBoard.setPlayerPosition(player.name, player.position);
		}
	}
}

export function startGame() {
	if (!currentGame.value) return;

	// Assign spawn positions to players without one
	assignSpawnPositions();

	// Sync positions to the game board for rendering
	syncPlayerPositionsToBoard();

	currentGame.value.started = true;
	currentGame.value.startTurn();
	addAuditTrail('Game started!');
}

/**
 * @description Adds a custom wheel to the game, which will have to be spun before the game can continue
 * @param key The key to use to reference the wheel
 * @param wheel The wheel to add
 */
export function addCustomWheel(key: string, wheel: WheelBase) {
	if (!currentGame.value) return;
	currentGame.value.customWheels.set(key, wheel);
}

export function removeCustomWheel(key: string) {
	if (!currentGame.value) return;
	currentGame.value.customWheels.delete(key);
}

export function increaseItemCostModifier(item: AllItems, amount: number = 1) {
	if (!currentGame.value) return;
	currentGame.value.increaseItemCostModifier(item, amount);
}

export function increaseShopCostModifier(amount: number = 1) {
	if (!currentGame.value) return;
	currentGame.value.shopCostModifier += amount;
}

export function increaseShopConsumableCostModifier(amount: number = 1) {
	if (!currentGame.value) return;
	currentGame.value.shopConsumableCostModifier += amount;
}

//#endregion#
export function getShopCostModifier(): number {
	return currentGame.value?.shopCostModifier ?? 0;
}

export function getItemCostModifier(item: AllItems): number {
	return currentGame.value?.getItemCostModifier(item) ?? 1;
}

export function getConsumableItemCostModifier(item: AllItems) {
	return currentGame.value?.shopConsumableCostModifier ?? 0;
}

export function getItemCost(item: AllItems): number {
	const modifier = getItemCostModifier(item);
	const actualitem = getItemByType(item);
	let baseCost = actualitem?.baseCost ?? 0;
	let isConsumable = actualitem?.type == 'consumables';
	if (isConsumable) return baseCost + getConsumableItemCostModifier(item) + modifier;
	return baseCost + modifier + getShopCostModifier();
}

export function addAuditTrail(message: string) {
	// Use try-catch to handle the case where currentGame is accessed during initialization
	// (e.g., during deserialization from localStorage before currentGame is fully assigned)
	try {
		if (!currentGame.value) return;
		currentGame.value.addAuditTrail(message);
	} catch {
		// Silently ignore during initialization - audit trail messages during deserialize aren't critical
	}
}
