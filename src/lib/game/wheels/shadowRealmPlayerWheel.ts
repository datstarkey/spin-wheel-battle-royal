import { playerNameSpinItems } from '$lib/components/wheel/utils';
import { currentGame, getPlayerByName } from '$lib/stores/gameStore';
import { get } from 'svelte/store';
import type { WheelBase } from './wheels';

// Gets all players and adds the win function as sending to shadow realm
export const shadowRealmPlayerWheel: WheelBase = playerNameSpinItems().map((x) => {
	return {
		label: x.label,
		onWin: () => {
			const player = getPlayerByName(x.label);
			const game = get(currentGame);
			if (!game || !player) return;
			game.addPlayerToShadowRealm(player);
		}
	};
});
