import type { Player } from '../../player/player.svelte';
import type { Item } from '../itemTypes';

export const Kevlar: Item = {
	name: 'Kevlar',
	description: 'Gain +15 Defense',
	type: 'chest',
	baseCost: 3,
	maxAmount: 1,
	image: '/Items/ChestEquipables/KevlarVest.svg',

	onEquip: (player: Player) => {
		player.bonusDefense += 15;
	},
	onUnequip: (player: Player) => {
		player.bonusDefense -= 15;
	}
};
