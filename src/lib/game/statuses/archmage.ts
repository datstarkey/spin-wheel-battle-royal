import type { StatusEffect } from './statusTypes';

export const archmage: StatusEffect = {
	name: 'Archmage',
	description: 'Ascended Magic Man! Can attack from anywhere and regenerates double mana.',
	image: 'https://i.imgur.com/8QfJqnR.png', // placeholder archmage image
	allowMultiple: false,
	classLock: ['magicman'],

	onApply(player) {
		// Archmage gets +50% attack and defense permanently
		player.attackMultipliers['Archmage'] = 1.5;
		player.defenseMultipliers['Archmage'] = 1.5;
		// Unlimited attack range (set to high number)
		player.addStatModifier('Archmage', 'attackRange', 100);
	},

	onRemove(player) {
		delete player.attackMultipliers['Archmage'];
		delete player.defenseMultipliers['Archmage'];
		player.removeStatModifier('Archmage', 'attackRange');
	}
};
