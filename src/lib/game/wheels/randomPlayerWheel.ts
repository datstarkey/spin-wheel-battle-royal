import { playerNameSpinItems } from '$lib/components/wheel/utils';
import { addCustomWheel, getPlayerByName } from '$lib/stores/gameStore';
import type { Player } from '../player/player';

export function generateRandomPlayerWheel(key: string, onPlayer: (winner: Player) => void) {
	const playerNames = playerNameSpinItems();
	const wheel = playerNames.map((x) => {
		return {
			label: x.label,
			onWin() {
				const player = getPlayerByName(x.label);
				if (!player) return;
				onPlayer(player);
			}
		};
	});

	addCustomWheel(key, wheel);
}
