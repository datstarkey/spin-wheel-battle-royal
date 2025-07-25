import type { Player } from '../../player/player.svelte';
import type { Item } from '../itemTypes';

export const Box: Item = {
	name: 'A Box',
	description: 'Gain +20 Defense, lose -10 Attack',
	type: 'helm',
	baseCost: 3,
	maxAmount: 1,
	image: '/Items/HelmEquipables/Box.jpg',

	onEquip: (player: Player) => {
		player.bonusAttack -= 10
		player.bonusDefense += 20;
	},
	onUnequip: (player: Player) => {
		player.bonusAttack += 10;
		player.bonusDefense -= 20;
	}
};
