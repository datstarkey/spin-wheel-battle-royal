import type { Item } from '../itemTypes';

export const SportsBra: Item = {
	name: 'Sports Bra',
	description: 'Opponents give you 10% of their gold when attacking you',
	type: 'chest',
	baseCost: 3,
	maxAmount: 1,
	image: '/Items/ChestEquipables/Sportsbra.svg',

	onDefenseStart(player, playerAttackingYou) {
		const goldToTake = playerAttackingYou.gold * 0.1;
		playerAttackingYou.gold -= goldToTake;
		player.gold += goldToTake;
	}
};
