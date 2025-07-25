import type { Player } from '$lib/game/player/player.svelte';
import type { Item } from '../itemTypes';

export const Fireball: Item = {
	name: 'Fireball',
	description: 'Gain +1 Attack Range',
	image: '/Items/MainHandEquipables/Fireball.svg',
	type: 'mainhand',
	baseCost: 3,
	maxAmount: 1,
	onEquip: (player: Player) => {
		player.addStatModifier('Fireball', 'attackRange', 1);
	},
	onUnequip: (player: Player) => {
		player.removeStatModifier('Fireball', 'attackRange');
	}
};
