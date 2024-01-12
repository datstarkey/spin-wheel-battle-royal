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
		player.defPercent = dualwield ? 0.75 : 0.5;
		const attgain = player.defense * player.defPercent
		player.bonusAttack = attgain + player.attack

	},
	onUnequip: (player: Player,type:ItemType) => {
        const dualwield = (player.gear.mainHand?.name == name && type == 'offHand') || (player.gear.offHand?.name == name && type == 'mainhand')
        if (dualwield){
            player.defPercent = 0.5
            return 
        }
		/*delete player.bonusAttack['Brass Knuckles']
		*/
	}
};
