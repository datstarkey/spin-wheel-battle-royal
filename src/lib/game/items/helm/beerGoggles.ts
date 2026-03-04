import type { Item } from '../itemTypes';

const modName = 'Beer Goggles';

export const BeerGoggles: Item = {
	name: 'Beer Goggles',
	description: 'Opponents have -5 Attack and Defense',
	type: 'helm',
	baseCost: 3,
	maxAmount: 1,
	image: '/Items/HelmEquipables/BeerGoggles.svg',

	onAttackStart(player, defendingPlayer) {
		defendingPlayer.addStatModifier(modName, 'attack', -5);
		defendingPlayer.addStatModifier(modName, 'defense', -5);
	},

	onAttackEnd(player, defendingPlayer) {
		defendingPlayer.removeStatModifier(modName, 'attack');
		defendingPlayer.removeStatModifier(modName, 'defense');
	}
};
