import type { Player } from '$lib/game/player/player.svelte';
import type { Item } from '../itemTypes';

export const HylianShield: Item = {
	name: 'Hylian Shield',
	description: 'Gain +20 Defense',
	type: 'offHand',
	baseCost: 3,
	image: '/Items/OffHandEquipables/HylianShield.svg',

	onEquip: (player: Player) => {
		player.addStatModifier('Hylian Shield', 'defense', 20);
	},
	onUnequip: (player: Player) => {
		player.removeStatModifier('Hylian Shield', 'defense');
	}
};
