import type { Player } from '../../player/player';
import type { Item, ItemType } from '../itemTypes';

export const BrassKnuckles: Item = {
	name: 'Brass Knuckles',
	description: 'Gain Attack equal to 50% (If Dual Wielding, gain attack equal to 75% of your Defense',
	type: 'mainhand',
	baseCost: 3,
	image:
		'/Items/MainHandEquipables/BrassKnuckles.svg',

	onEquip: (player: Player,type:ItemType) => {
        const dualwield = (player.gear.mainHand?.name == name && type == 'offHand') || (player.gear.offHand?.name == name && type == 'mainhand')
		player.attackMultipliers['Brass Knuckles'] = dualwield ? 1.75 : 1.5;
	},
	onUnequip: (player: Player,type:ItemType) => {
        const dualwield = (player.gear.mainHand?.name == name && type == 'offHand') || (player.gear.offHand?.name == name && type == 'mainhand')
        if (dualwield){
            player.attackMultipliers['Brass Knuckles'] = 1.5
            return 
        }
		delete player.attackMultipliers['Brass Knuckles']
	}
};
