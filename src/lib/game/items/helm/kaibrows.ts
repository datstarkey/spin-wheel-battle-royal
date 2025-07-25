import type { Player } from '../../player/player.svelte';
import type { Item } from '../itemTypes';

export const Kaibrows: Item = {
	name: 'Kaibrows',
	description: 'Gain 10% Attack',
	type: 'helm',
	baseCost: 3,
	maxAmount: 1,
	image: '/Items/HelmEquipables/Kaibrows.svg',

	onEquip: (player: Player) => {
		player.addStatModifier('Kaibrows', 'attack', 15);
		player.addStatModifier('Kaibrows', 'defense', -5);
	},
	onUnequip: (player: Player) => {
		player.removeStatModifier('Kaibrows', 'attack');
		player.removeStatModifier('Kaibrows', 'defense');
	}
};
