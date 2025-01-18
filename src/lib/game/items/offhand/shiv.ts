import { addAuditTrail } from '$lib/stores/gameStore.svelte';
import type { Item } from '../itemTypes';

const SHIV_COST = 5;

export const Shiv: Item = {
	name: 'Shiv',
	description: 'Steal one gold on win',
	type: 'offHand',
	baseCost: 3,
	image: '/Items/OffHandEquipables/Shiv.svg',

	onAttackWin(player, attackingPlayer) {
		const goldToGive = Math.min(attackingPlayer.gold, SHIV_COST);
		if (goldToGive == 0) {
			addAuditTrail(`${attackingPlayer.name} does not have enough gold to shiv!`);
			return;
		}
		player.gold += goldToGive;
		attackingPlayer.gold -= goldToGive;

		addAuditTrail(`${player.name} shivved ${attackingPlayer.name} and stole 1 gold!`);
	}
};
