import type { WheelTheme } from '$lib/components/wheel/types';
import type { SpinWheelItem } from '$lib/components/wheel/types';
import type { Game } from './game.svelte';
import type { Player } from './player/player.svelte';
import type { WheelBase } from './wheels/wheels';

export interface GameContext {
	getPlayerByName(name: string): Player | undefined;
	addCustomWheel(key: string, wheel: WheelBase, theme?: WheelTheme, forPlayerName?: string): void;
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
	/** Banish a player to the Shadow Realm, syncing both player flag and Game array. */
	banishToShadowRealm(player: Player, auditMessage?: string): void;
}

/**
 * Resolve a player from context, logging an audit trail if not found.
 * Eliminates the duplicated "resolve player or toast" pattern across all wheel generators.
 */
export function requirePlayer(
	ctx: GameContext,
	playerName: string,
	wheelName: string
): Player | null {
	const player = ctx.getPlayerByName(playerName);
	if (!player) {
		ctx.addAuditTrail(`Could not generate ${wheelName}, Player ${playerName} not found!`);
		return null;
	}
	return player;
}

/**
 * Build spin wheel items from player names using a GameContext.
 * Replaces the gameStore-dependent `playerNameSpinItems()` for wheel generators.
 * Filters out dead players and shadow realm players (unless all non-dead are in shadow realm).
 */
export function playerNameSpinItemsFromContext(ctx: GameContext): SpinWheelItem[] {
	const game = ctx.getGame();
	if (!game) return [];

	const alivePlayers = game.players.filter((player) => !game.started || !player.dead);

	// Prefer players not in shadow realm, but fall back to all alive if everyone is there
	const nonShadow = alivePlayers.filter((player) => !player.inShadowRealm);
	const candidates = nonShadow.length > 0 ? nonShadow : alivePlayers;

	return candidates.map((player) => ({ label: player.name }));
}
