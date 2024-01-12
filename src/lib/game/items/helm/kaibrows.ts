import type { Player } from '../../player/player';
import type { Item } from '../itemTypes';

export const Kaibrows: Item = {
	name: 'Kaibrows',
	description: 'Gain +15 Attack, Lose -5 Defense',
	type: 'helm',
	baseCost: 3,
	image:
		'/Items/HelmEquipables/Kaibrows.svg',

	onEquip: (player: Player) => {
		player.bonusAttack += 15;
        player.bonusDefense -=5;
	},
	onUnequip: (player: Player) => {
		player.bonusAttack -= 15;
        player.bonusDefense +=5;
	}
};