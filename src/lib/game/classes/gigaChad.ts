import type { ClassBase } from './classType';

export const GigaChad: ClassBase = {
	hp: 100,
	attack: 20,
	defense: 5,
	name: 'Giga Chad',
	onWinAbility: 'Spin the Giga Chad wheel instead of the win and loss wheels',
	attackRange: 1,
	onAttackWin: (player) => {
		player.baseAttack += 3;
	}
};
