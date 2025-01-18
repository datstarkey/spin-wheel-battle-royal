import type { ClassBase } from './classType';

export const Magicman: ClassBase = {
	hp: 80,
	attack: 25,
	defense: 1,
	attackRange: 2,
	name: 'Magic Man',
	onWinAbility: 'Can blink away',
	onAttackWin: (player) => {
			player.baseAttackRange += 1;
	}
};
