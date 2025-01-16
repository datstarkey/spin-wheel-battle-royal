import { playerNameSpinItems } from '$lib/components/wheel/utils';
import { currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
import type { WheelBase } from './wheels';

// Gets all players and adds the win function as sending to shadow realm
export const shadowRealmPlayerWheel: WheelBase = playerNameSpinItems().map((x) => {
	return {
		label: x.label,
		onWin: () => {
			const player = getPlayerByName(x.label);
			if (!currentGame.value || !player) return;
			currentGame.value.addPlayerToShadowRealm(player);
		}
	};
});
