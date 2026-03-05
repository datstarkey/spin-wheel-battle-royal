import type { StatusEffect } from './statusTypes';

export const iceStorm: StatusEffect = {
	name: 'Ice Storm',
	description: 'Slowed by a magical ice storm (-1 movement)',
	image: '',
	turnDuration: 3,

	onApply(player) {
		player.addStatModifier('Ice Storm', 'movement', -1);
	},

	onRemove(player) {
		player.removeStatModifier('Ice Storm', 'movement');
	}
};
