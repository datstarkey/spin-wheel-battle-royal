import type { Player } from '../../player/player.svelte';
import type { Item } from '../itemTypes';

export const ANiceHat: Item = {
	name: 'A Nice Hat',
	description: 'Gain +5 Attack, Gain +5 Defense',
	type: 'helm',
	baseCost: 3,
	maxAmount: 1,
	image: '/Items/HelmEquipables/ANiceHat.svg',

	onEquip: (player: Player) => {
		player.addStatModifier('A Nice Hat', 'attack', 5);
		player.addStatModifier('A Nice Hat', 'defense', 5);
	},
	onUnequip: (player: Player) => {
		player.removeStatModifier('A Nice Hat', 'attack');
		player.removeStatModifier('A Nice Hat', 'defense');
	}
};
