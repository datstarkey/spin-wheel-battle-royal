import type { ClassBase } from './classType';

export const None: ClassBase = {
	hp: 0,
	attack: 0,
	defense: 0,
	attackRange: 0,
	name: 'None',
	onWinAbility: 'None',
	onWin() {
		//Do nothing
	}
};
