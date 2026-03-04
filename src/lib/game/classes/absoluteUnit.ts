import type { ClassBase } from './classType';

export const AbsoluteUnit: ClassBase = {
	hp: 100,
	attack: 5,
	defense: 15,
	name: 'Absolute Unit',
	icon: '/Classes/AbsoluteUnit.svg',
	description: 'An immovable object. Gets 30% of defense as bonus attack.',
	onWinAbility: 'Gain 5 base defense',
	attackRange: 1,

	// Passive: 30% of total defense becomes bonus attack
	getBonusAttack(player) {
		// Use defense calculation without this bonus to avoid circular dependency
		const defenseWithoutThisBonus =
			(player.baseDefense + player.bonusDefense) * player.defenseMultiplier;
		return Math.floor(0.3 * defenseWithoutThisBonus);
	},

	onAttackWin(player) {
		player.baseDefense += 5;
	}
};
