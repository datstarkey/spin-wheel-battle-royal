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
		player.bonusAttack += 5;
		player.bonusDefense += 5;
	},
	onUnequip: (player: Player) => {
		player.bonusAttack -= 5;
		player.bonusDefense -= 5;
	}
};
