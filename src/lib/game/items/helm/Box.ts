import type { Player } from '../../player/player.svelte';
import type { Item } from '../itemTypes';

export const Box: Item = {
	name: 'A Box',
	description: 'Gain +20 Defense, lose -10 Attack',
	type: 'helm',
	baseCost: 3,
	maxAmount: 1,
	image: '/Items/HelmEquipables/Box.jpg',

	onEquip: (player: Player) => {
		player.addStatModifier('A Box', 'attack', -10);
		player.addStatModifier('A Box', 'defense', 20);
	},
	onUnequip: (player: Player) => {
		player.removeStatModifier('A Box', 'attack');
		player.removeStatModifier('A Box', 'defense');
	}
};
