import type { Item } from '../itemTypes';



export const BeerGoggles: Item = {
	name: 'Beer Goggles',
	description: 'Opponents have -5 Attack and Defense',
	type: 'helm',
	baseCost: 3,
	maxAmount: 1,
	image: '/Items/HelmEquipables/BeerGoggles.svg',

	onAttackStart(player, attackingPlayer) {
		attackingPlayer.bonusAttack -= 5;
		attackingPlayer.bonusDefense -= 5;
	},

	onAttackEnd(player, attackingPlayer) {
		attackingPlayer.bonusAttack += 5;
		attackingPlayer.bonusDefense += 5;
	}
};
