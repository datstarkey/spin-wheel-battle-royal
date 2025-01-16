import type { Player } from '../../player/player.svelte';
import type { Item } from '../itemTypes';

export const Lightsaber: Item = {
	name: 'Lightsaber',
	description: 'Base Attack + 15',
	type: 'mainhand',
	baseCost: 3,
	image:
		'static/Items/MainHandEquipables/Lightsaber.svg',

	onEquip: (player: Player) => {
		player.bonusAttack += 15;
	},
	onUnequip: (player: Player) => {
		player.bonusAttack -= 15;
	}
};
