import type { ClassBase } from './classType';

export const Stoner: ClassBase = {
	hp: 100,
	attack: 15,
	defense: 15,
	attackRange: 1,
	name: 'Stoner',
	onWinAbility: 'Smoke a fat doob',
	onAttackWin() {
		//Todo implement stoner board
	}
};
