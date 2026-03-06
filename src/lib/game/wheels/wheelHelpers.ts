import type { Player } from '../player/player.svelte';
import type { GameContext } from '../gameContext';
import { generateRandomPlayerWheel } from './randomPlayerWheel';

export function createBanishToShadowRealmItem(player: Player, ctx: GameContext) {
	return {
		label: 'Send Someone to the Shadow Realm',
		onWin: () => {
			ctx.addAuditTrail(`${player.name} must spin again`);
			generateRandomPlayerWheel(
				`${player.name} Sends to Shadow Realm`,
				(winner) => {
					ctx.banishToShadowRealm(
						winner,
						`${player.name} banished ${winner.name} to the Shadow Realm!`
					);
				},
				ctx
			);
		}
	};
}
