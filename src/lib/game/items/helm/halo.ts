import type { Player } from '../../player/player';
import type { Item } from '../itemTypes';

export const Halo: Item = {
	name: 'Halo',
	description: 'Gain +1 Movement',
	type: 'helm',
	baseCost: 3,
	image:
		'static/Items/HelmEquipables/Halo.svg',

	onEquip: (player: Player) => {
		player.bonusMovement += 1;
	},
	onUnequip: (player: Player) => {
		player.bonusMovement -= 1;
	}
};
