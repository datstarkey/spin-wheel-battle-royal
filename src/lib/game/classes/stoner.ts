import type { ClassBase } from './classType';

export const Stoner: ClassBase = {
	hp: 100,
	attack: 10,
	defense: 10,
	attackRange: 1,
	name: 'Stoner',
	onWinAbility: 'Extend buff duration',
	onAttackWin() {
		//Todo implement stoner board
	}
};
