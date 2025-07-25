import type { Player } from '../../player/player.svelte';
import type { Item } from '../itemTypes';

export const Lightsaber: Item = {
	name: 'Lightsaber',
	description: 'Base Attack + 15',
	type: 'mainhand',
	baseCost: 3,
	maxAmount: 1,
	image: '/Items/MainHandEquipables/Lightsaber.svg',

	onEquip: (player: Player) => {
		player.addStatModifier('Lightsaber', 'attack', 15);
	},
	onUnequip: (player: Player) => {
		player.removeStatModifier('Lightsaber', 'attack');
	}
} as const;
