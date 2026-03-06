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

	getItemCost(item: AllItems): number {
		return this._game?.getItemCost(item) ?? 0;
	}

	getShopItems() {
		return this._game?.shopItems ?? [];
	}

	getShopRerollCost(): number {
		return this._game?.shopRerollCost ?? 2;
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
