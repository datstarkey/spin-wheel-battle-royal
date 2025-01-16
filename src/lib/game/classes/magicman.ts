import type { ClassBase } from './classType';

export const Magicman: ClassBase = {
	hp: 8,
	attack: 20,
	defense: 5,
	attackRange: 3,
	name: 'Magic Man',
	onWinAbility: 'Can teleport any other player',
	onAttackWin() {
		//Need Board to be able to access players
	}
};
