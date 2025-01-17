import type { Item } from '../itemTypes';

export const SportsBra: Item = {
	name: 'Sports Bra',
	description: 'Opponents lose 5 attack, you dont want a lawsuit',
	type: 'chest',
	baseCost: 3,
	maxAmount: 1,
	image: '/Items/ChestEquipables/Sportsbra.svg',

	onAttackStart(player, attackingPlayer) {
		attackingPlayer.bonusAttack -= 5;
	},

	onAttackEnd(player, attackingPlayer) {
		attackingPlayer.bonusAttack += 5;
	},

	onDefenseStart(player, playerAttackingYou) {
		playerAttackingYou.bonusAttack -= 5;
	},

	onDefenseEnd(player, playerAttackingYou) {
		playerAttackingYou.bonusAttack += 5;
	}
};
