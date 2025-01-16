import type { Player } from '$lib/game/player/player.svelte';
import type { Item } from '../itemTypes';

export const HylianShield: Item = {
	name: 'Hylian Shield',
	description: 'Gain +20 Defense',
	type: 'offHand',
	baseCost: 3,
	image:
		'static/Items/OffHandEquipables/HylianShield.svg',

	onEquip: (player: Player) => {
		player.bonusDefense += 20;
	},
	onUnequip: (player: Player) => {
		player.bonusDefense -= 20;
	}
};
