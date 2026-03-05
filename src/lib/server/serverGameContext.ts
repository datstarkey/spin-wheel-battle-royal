import type { WheelTheme } from '$lib/components/wheel/types';
import type { GameContext } from '$lib/game/gameContext';
import type { Player } from '$lib/game/player/player.svelte';
import type { WheelBase } from '$lib/game/wheels/wheels';
import { generateShuffleOrder } from './actionHandler';
import type { GameRoom } from './gameRooms';

/**
 * Server-side GameContext implementation for a specific room.
 *
 * Key difference from clientGameContext:
 * - addCustomWheel stores wheels with closures in room.pendingWheels (NOT in game.customWheels)
 * - The server will send visual-only wheel data to clients, then execute the closure
 *   when the client reports the spin result
 */
export function createServerGameContext(room: GameRoom, forPlayerName: string): GameContext {
	return {
		getPlayerByName(name: string): Player | undefined {
			return room.game.players.find((p) => p.name === name);
		},

		addCustomWheel(key: string, wheel: WheelBase, theme?: WheelTheme): void {
			// Store wheel with closures server-side (NOT in game.customWheels)
			room.pendingWheels.set(key, {
				items: wheel,
				theme,
				forPlayerName,
				shuffledOrder: generateShuffleOrder(wheel.length)
			});
		},

		addAuditTrail(message: string): void {
			room.game.addAuditTrail(message);
		},

		increaseShopCostModifier(amount = 1): void {
			room.game.shopCostModifier += amount;
		},

		setHasUsedCasinoThisTurn(value: boolean): void {
			room.game.hasUsedCasino = value;
		},

		getHasUsedCasinoThisTurn(): boolean {
			return room.game.hasUsedCasino;
		},

		gainAnotherTurn(): void {
			room.game.gainAnotherTurn();
		},

		skipNextTurn(player: Player): void {
			room.game.skipNextTurn(player);
		},

		getGame() {
			return room.game;
		},

		getGlobalHpReduction(): number {
			return room.game.globalHpReduction;
		},

		getAlivePlayers(): Player[] {
			return room.game.alivePlayers;
		},

		getAllPlayers(): Player[] {
			return room.game.players;
		}
	};
}
