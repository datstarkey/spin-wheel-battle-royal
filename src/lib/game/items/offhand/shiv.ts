import { addAuditTrail } from '$lib/stores/gameStore.svelte';
import type { Item } from '../itemTypes';

export const Shiv: Item = {
	name: 'Shiv',
	description: 'Steal one gold on win',
	type: 'offHand',
	baseCost: 3,
	image: '/Items/OffHandEquipables/Shiv.svg',

	onAttackWin(player, attackingPlayer) {
		player.gold += 1;
		attackingPlayer.gold -= 1;

		addAuditTrail(`${player.name} shivved ${attackingPlayer.name} and stole 1 gold!`);
	}
};
