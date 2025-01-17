import type { ClassBase } from './classType';

export const Gambler: ClassBase = {
	hp: 100,
	attack: 15,
	defense: 15,
	name: 'Gambler',
	onWinAbility: 'Spin the Gambler wheel instead of the win and loss wheels',
	attackRange: 1,

	onAttackWin(player, defendingPlayer) {
		//in the win wheel or lose wheel its calculated to nothing to do here
	}
};
