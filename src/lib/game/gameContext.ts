import toast from '$lib/stores/toaster.svelte';
import type { WheelTheme } from '$lib/components/wheel/types';
import type { SpinWheelItem } from '$lib/components/wheel/types';
import type { Game } from './game.svelte';
import type { Player } from './player/player.svelte';
import type { WheelBase } from './wheels/wheels';

export interface GameContext {
	getPlayerByName(name: string): Player | undefined;
	addCustomWheel(key: string, wheel: WheelBase, theme?: WheelTheme): void;
	addAuditTrail(message: string): void;
	increaseShopCostModifier(amount?: number): void;
	setHasUsedCasinoThisTurn(value: boolean): void;
	getHasUsedCasinoThisTurn(): boolean;
	gainAnotherTurn(): void;
	skipNextTurn(player: Player): void;
	getGame(): Game | null;
	getGlobalHpReduction(): number;
	getAlivePlayers(): Player[];
	getAllPlayers(): Player[];
}

/**
 * Resolve a player from context, showing an error toast if not found.
 * Eliminates the duplicated "resolve player or toast" pattern across all wheel generators.
 */
export function requirePlayer(
	ctx: GameContext,
	playerName: string,
	wheelName: string
): Player | null {
	const player = ctx.getPlayerByName(playerName);
	if (!player) {
		toast.error(`Could not generate ${wheelName}, Player ${playerName} not found!`);
		return null;
	}
	return player;
}

/**
 * Build spin wheel items from player names using a GameContext.
 * Replaces the gameStore-dependent `playerNameSpinItems()` for wheel generators.
 */
export function playerNameSpinItemsFromContext(ctx: GameContext): SpinWheelItem[] {
	const game = ctx.getGame();
	return (
		game?.players
			.filter((player) => !game?.started || !player.dead)
			.map((player) => ({ label: player.name })) ?? []
	);
}
