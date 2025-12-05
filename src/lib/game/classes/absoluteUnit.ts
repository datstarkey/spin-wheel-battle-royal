import type { ClassBase } from './classType';

export const AbsoluteUnit: ClassBase = {
	hp: 100,
	attack: 5,
	defense: 15,
	name: 'Absolute Unit',
	description: 'An immovable object. Gets 30% of base defense as bonus attack.',
	onWinAbility: 'Gain 5 defense',
	attackRange: 1,

	// Passive: 30% of base defense becomes bonus attack
	getBonusAttack(player) {
		return Math.floor(0.3 * player.baseDefense);
	},

	onAttackWin(player, _defendingPlayer) {
		player.baseDefense += 5;
	}
};
