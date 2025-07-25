import type { Player } from '../../player/player.svelte';
import type { Item } from '../itemTypes';

export const GoFasterStripes: Item = {
	name: 'Go Faster Stripes',
	description: 'Gain +2 Movement',
	type: 'chest',
	baseCost: 3,
	maxAmount: 1,
	image: '/Items/ChestEquipables/GoFasterStripes.svg',

	onEquip: (player: Player) => {
		player.addStatModifier('Go Faster Stripes', 'movement', 2);
	},
	onUnequip: (player: Player) => {
		player.removeStatModifier('Go Faster Stripes', 'movement');
	}
};
