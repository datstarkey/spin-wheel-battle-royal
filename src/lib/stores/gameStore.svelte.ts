import { page } from '$app/state';
import { gameBoard } from '$lib/game/board/board.svelte';
import { SPAWN_ZONES } from '$lib/game/board/boardData';
import type { Position } from '$lib/game/board/types';
import { Game } from '$lib/game/game.svelte';
import { getItemByType, type AllItems } from '$lib/game/items/itemTypes';
import { Player } from '$lib/game/player/player.svelte';
import type { WheelBase } from '$lib/game/wheels/wheels';
import type { WheelTheme } from '$lib/components/wheel/types';
import toast from '$lib/stores/toaster.svelte';
import { localStorageStore } from './localStorageStore.svelte';

// ============================================================================
// Core Game State
// ============================================================================

export const currentGame = localStorageStore<Game | null>('currentGame', null);

if (page.url.searchParams.get('clear') == 'true') {
	if (confirm('Are you sure you want to reset the game?')) {
		resetGame();
	}
}

export function resetGame() {
	currentGame.value = new Game();
}

// ============================================================================
// Turn Action Flags
// ============================================================================

export function getHasShoppedThisTurn() {
	return currentGame.value?.hasShopped ?? false;
}

export function setHasShoppedThisTurn(value: boolean) {
	if (!currentGame.value) return;
	currentGame.value.hasShopped = value;
}

export function getHasUsedCasinoThisTurn() {
	return currentGame.value?.hasUsedCasino ?? false;
}

export function setHasUsedCasinoThisTurn(value: boolean) {
	if (!currentGame.value) return;
	currentGame.value.hasUsedCasino = value;
}

// ============================================================================
// Global Stats
// ============================================================================

export function getGlobalHpReduction() {
	return currentGame.value?.globalHpReduction ?? 0;
}

export function getGlobalMovementBonus() {
	return currentGame.value?.globalMovementBonus ?? 0;
}

export function getGlobalTurnCount() {
	return currentGame.value?.globalTurnCount ?? 0;
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

// ============================================================================
// Player Management
// ============================================================================

function gameHasStarted() {
	if (currentGame.value?.started) {
		toast.error("Can't modify game after it has started!");
		return true;
	}
	return false;
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
 */
export function getPlayerByName(name?: string): Player | undefined {
	return currentGame.value?.players.find((player) => player.name === name);
}

// ============================================================================
// Spawn & Board Sync
// ============================================================================

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
			const freeSpawns = availableSpawns.filter((sp) => !usedPositions.has(`${sp.x},${sp.y}`));

			if (freeSpawns.length > 0) {
				const randomIndex = Math.floor(Math.random() * freeSpawns.length);
				const randomSpawn = freeSpawns[randomIndex];
				player.position = { ...randomSpawn };
				usedPositions.add(`${randomSpawn.x},${randomSpawn.y}`);
				addAuditTrail(`${player.name} spawned at (${randomSpawn.x}, ${randomSpawn.y})`);
			} else {
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

	gameBoard.playerPositions.clear();

	for (const player of currentGame.value.players) {
		if (player.position && !player.dead) {
			gameBoard.setPlayerPosition(player.name, player.position);
		}
	}
}

export function startGame() {
	if (!currentGame.value) return;

	assignSpawnPositions();
	syncPlayerPositionsToBoard();

	currentGame.value.started = true;
	currentGame.value.startTurn();
	addAuditTrail('Game started!');
}

// ============================================================================
// Custom Wheels
// ============================================================================

/**
 * Adds a custom wheel to the game, which will have to be spun before the game can continue
 */
export function addCustomWheel(key: string, wheel: WheelBase, theme?: WheelTheme) {
	if (!currentGame.value) return;
	currentGame.value.customWheels.set(key, { items: wheel, theme });
}

export function removeCustomWheel(key: string) {
	if (!currentGame.value) return;
	currentGame.value.customWheels.delete(key);
}

// ============================================================================
// Shop System
// ============================================================================

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

export function getShopCostModifier(): number {
	return currentGame.value?.shopCostModifier ?? 0;
}

export function getItemCostModifier(item: AllItems): number {
	return currentGame.value?.getItemCostModifier(item) ?? 1;
}

export function getConsumableItemCostModifier(item: AllItems) {
	void item;
	return currentGame.value?.shopConsumableCostModifier ?? 0;
}

export function getItemCost(item: AllItems): number {
	const modifier = getItemCostModifier(item);
	const actualitem = getItemByType(item);
	const baseCost = actualitem?.baseCost ?? 0;
	const isConsumable = actualitem?.type == 'consumables';
	if (isConsumable) return baseCost + getConsumableItemCostModifier(item) + modifier;
	return baseCost + modifier + getShopCostModifier();
}

export function getShopItems() {
	return currentGame.value?.shopItems ?? [];
}

export function getShopRerollCost(): number {
	return currentGame.value?.shopRerollCost ?? 2;
}

export function rerollShopItems(): boolean {
	if (!currentGame.value) return false;
	return currentGame.value.rerollShopItems();
}

// ============================================================================
// Audit Trail
// ============================================================================

export function addAuditTrail(message: string) {
	try {
		if (!currentGame.value) return;
		currentGame.value.addAuditTrail(message);
	} catch {
		// Silently ignore during initialization
	}
}
