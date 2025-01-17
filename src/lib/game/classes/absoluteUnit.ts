import type { ClassBase } from './classType';

export const AbsoluteUnit: ClassBase = {
	hp: 100,
	attack: 5,
	defense: 15,
	name: 'Absolute Unit',
	onWinAbility: 'Gain 5 defense',
	attackRange: 1,
	onAttackWin(player, defendingPlayer) {
		player.baseDefense += 5;
	}
};
