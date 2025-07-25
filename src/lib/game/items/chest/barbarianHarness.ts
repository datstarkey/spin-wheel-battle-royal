import type { Player } from '../../player/player.svelte';
import type { Item } from '../itemTypes';

export const BarbarianHarness: Item = {
	name: 'Barbarian Harness',
	description: 'Gain +20 attack, Lose -10 Defense',
	type: 'chest',
	baseCost: 3,
	maxAmount: 1,
	image: '/Items/ChestEquipables/BarbarianHarness.svg',

	onEquip: (player: Player) => {
		player.addStatModifier('Barbarian Harness', 'attack', 20);
		player.addStatModifier('Barbarian Harness', 'defense', -10);
	},
	onUnequip: (player: Player) => {
		player.removeStatModifier('Barbarian Harness', 'attack');
		player.removeStatModifier('Barbarian Harness', 'defense');
	}
};
