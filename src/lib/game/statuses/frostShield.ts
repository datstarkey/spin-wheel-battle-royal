import type { StatusEffect } from './statusTypes';

export const frostShield: StatusEffect = {
	name: 'Frost Shield',
	description: '+10 defense from a magical frost barrier',
	image: '',
	turnDuration: 2,

	onApply(player) {
		player.addStatModifier('Frost Shield', 'defense', 10);
	},

	onRemove(player) {
		player.removeStatModifier('Frost Shield', 'defense');
	}
};
