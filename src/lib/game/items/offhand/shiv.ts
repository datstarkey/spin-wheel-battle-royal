import type { Item } from '../itemTypes';

const SHIV_COST = 5;

export const Shiv: Item = {
	name: 'Shiv',
	description: 'Steal 5 gold on win',
	type: 'offHand',
	baseCost: 3,
	image: '/Items/OffHandEquipables/Shiv.svg',

	onAttackWin(player, attackingPlayer) {
		const goldToGive = Math.min(attackingPlayer.gold, SHIV_COST);
		if (goldToGive == 0) {
			player.game?.addAuditTrail(`${attackingPlayer.name} does not have enough gold to shiv!`);
			return;
		}
		player.gold += goldToGive;
		attackingPlayer.gold -= goldToGive;

		player.game?.addAuditTrail(`${player.name} shivved ${attackingPlayer.name} and stole 5 gold!`);
	}
};
