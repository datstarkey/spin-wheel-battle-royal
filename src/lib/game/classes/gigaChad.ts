import type { ClassBase } from './classType';

export const GigaChad: ClassBase = {
	hp: 100,
	attack: 20,
	defense: 5,
	name: 'Giga Chad',
	icon: '/Classes/GigaChad.svg',
	description: 'An unstoppable force. Gets 30% of base attack as bonus defense.',
	onWinAbility: 'Gain 3 attack permanently',
	attackRange: 1,

	// Passive: 30% of base attack becomes bonus defense
	getBonusDefense(player) {
		return Math.floor(0.3 * player.baseAttack);
	},

	onAttackWin(player, _defendingPlayer) {
		player.baseAttack += 3;
	}
};
