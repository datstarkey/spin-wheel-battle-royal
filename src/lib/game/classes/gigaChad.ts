import type { ClassBase } from './classType';

export const GigaChad: ClassBase = {
	hp: 100,
	attack: 20,
	defense: 5,
	name: 'Giga Chad',
	icon: '/Classes/GigaChad.svg',
	description: 'An unstoppable force. Gets 30% of attack as bonus defense.',
	onWinAbility: 'Gain 3 attack permanently',
	attackRange: 1,

	// Passive: 30% of total attack becomes bonus defense
	getBonusDefense(player) {
		// Use attack calculation without this bonus to avoid circular dependency
		const attackWithoutThisBonus =
			(player.baseAttack + player.bonusAttack) * player.attackMultiplier;
		return Math.floor(0.3 * attackWithoutThisBonus);
	},

	onAttackWin(player) {
		player.baseAttack += 3;
	}
};
