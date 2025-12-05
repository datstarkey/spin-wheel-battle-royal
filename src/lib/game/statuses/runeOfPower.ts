import type { StatusEffect } from './statusTypes';

export const runeOfPower: StatusEffect = {
	name: 'Rune of Power',
	description: 'Stand within the rune for 5 turns to ascend to Archmage. Moving resets progress.',
	image: 'https://i.imgur.com/6QfJqnR.png', // placeholder magic rune image
	allowMultiple: false,
	classLock: ['magicman'],

	onApply(player) {
		// +20% attack and defense while on the rune
		player.attackMultipliers['RuneOfPower'] = 1.2;
		player.defenseMultipliers['RuneOfPower'] = 1.2;
	},

	onRemove(player) {
		delete player.attackMultipliers['RuneOfPower'];
		delete player.defenseMultipliers['RuneOfPower'];
	}
};
