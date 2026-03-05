import { createContext } from 'svelte';
import { gameBoard } from '$lib/game/board/board.svelte';
import type { Game } from '$lib/game/game.svelte';
import type { AllItems } from '$lib/game/items/itemTypes';
import type { Player } from '$lib/game/player/player.svelte';

// ============================================================================
// Store Class
// ============================================================================

class GameStore {
	private _game = $state<Game | null>(null);

	get game() {
		return this._game;
	}
	set game(value: Game | null) {
		this._game = value;
	}

	// -----------------------------------------------------------
	// Turn Action Flags
	// -----------------------------------------------------------

	getHasShoppedThisTurn() {
		return this._game?.hasShopped ?? false;
	}

	setHasShoppedThisTurn(value: boolean) {
		if (!this._game) return;
		this._game.hasShopped = value;
	}

	getHasUsedCasinoThisTurn() {
		return this._game?.hasUsedCasino ?? false;
	}

	setHasUsedCasinoThisTurn(value: boolean) {
		if (!this._game) return;
		this._game.hasUsedCasino = value;
	}

	// -----------------------------------------------------------
	// Global Stats
	// -----------------------------------------------------------

	getGlobalHpReduction() {
		return this._game?.globalHpReduction ?? 0;
	}

	getGlobalMovementBonus() {
		return this._game?.globalMovementBonus ?? 0;
	}

	getGlobalTurnCount() {
		return this._game?.globalTurnCount ?? 0;
	}

	increaseGlobalHpReduction(amount: number = 0) {
		if (!this._game) return;
		this._game.increaseGlobalHpReduction(amount);
	}

	// -----------------------------------------------------------
	// Player Management
	// -----------------------------------------------------------

	getPlayerByName(name?: string): Player | undefined {
		return this._game?.players.find((player) => player.name === name);
	}

	// -----------------------------------------------------------
	// Board Sync
	// -----------------------------------------------------------

	syncPlayerPositionsToBoard() {
		if (!this._game) return;

		gameBoard.playerPositions.clear();

		for (const player of this._game.players) {
			if (player.position && !player.dead) {
				gameBoard.setPlayerPosition(player.name, player.position);
			}
		}
	}

	// -----------------------------------------------------------
	// Shop System
	// -----------------------------------------------------------

	increaseItemCostModifier(item: AllItems, amount: number = 1) {
		if (!this._game) return;
		this._game.increaseItemCostModifier(item, amount);
	}

	increaseShopCostModifier(amount: number = 1) {
		if (!this._game) return;
		this._game.shopCostModifier += amount;
	}

	increaseShopConsumableCostModifier(amount: number = 1) {
		if (!this._game) return;
		this._game.shopConsumableCostModifier += amount;
	}

	getShopCostModifier(): number {
		return this._game?.shopCostModifier ?? 0;
	}

	getItemCostModifier(item: AllItems): number {
		return this._game?.getItemCostModifier(item) ?? 1;
	}

	getConsumableItemCostModifier() {
		return this._game?.shopConsumableCostModifier ?? 0;
	}

	getItemCost(item: AllItems): number {
		return this._game?.getItemCost(item) ?? 0;
	}

	getShopItems() {
		return this._game?.shopItems ?? [];
	}

	getShopRerollCost(): number {
		return this._game?.shopRerollCost ?? 2;
	}

	rerollShopItems(): boolean {
		if (!this._game) return false;
		return this._game.rerollShopItems();
	}

	// -----------------------------------------------------------
	// Audit Trail
	// -----------------------------------------------------------

	addAuditTrail(message: string) {
		try {
			if (!this._game) return;
			this._game.addAuditTrail(message);
		} catch {
			// Silently ignore during initialization
		}
	}
}

// ============================================================================
// Context — NO _instance, NO module-level helpers
// ============================================================================

const [get, set] = createContext<GameStore>();

export function getGameStore() {
	return get();
}

export function setGameStore() {
	const store = new GameStore();
	set(store);
	return store;
}
