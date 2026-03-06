import type { GameContext } from '../gameContext';
import { playerNameSpinItemsFromContext } from '../gameContext';
import type { Player } from '../player/player.svelte';

export function generateRandomPlayerWheel(
	key: string,
	onPlayer: (winner: Player) => void,
	ctx: GameContext
) {
	const playerNames = playerNameSpinItemsFromContext(ctx);
	const wheel = playerNames.map((x) => {
		return {
			label: x.label,
			onWin() {
				const player = ctx.getPlayerByName(x.label);
				if (!player) return;
				onPlayer(player);
			}
		};
	});

	ctx.addCustomWheel(key, wheel);
}

export function withTargetPlayerOrRandomWheel(
	targetPlayer: Player | undefined,
	key: string,
	onPlayer: (winner: Player) => void,
	ctx: GameContext
) {
	if (targetPlayer && !targetPlayer.dead) {
		onPlayer(targetPlayer);
		return;
	}

	generateRandomPlayerWheel(key, onPlayer, ctx);
}
