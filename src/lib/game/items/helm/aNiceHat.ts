import type { Player } from '../../player/player';
import type { Item } from '../itemTypes';

export const ANiceHat: Item = {
	name: 'A Nice Hat',
	description: 'Gain +5 Attack, Gain +10 Defense',
	type: 'helm',
	baseCost: 3,
	image:
		'/Items/HelmEquipables/ANiceHat.svg',

	onEquip: (player: Player) => {
		player.bonusAttack += 5;
        player.bonusDefense +=10;
	},
	onUnequip: (player: Player) => {
		player.bonusAttack -= 5;
        player.bonusDefense -=10;
	}
};