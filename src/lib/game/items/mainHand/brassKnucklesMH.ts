import type { Player } from '../../player/player.svelte';
import type { Item, ItemType } from '../itemTypes';

const name = 'Brass Knuckles';
export const BrassKnucklesMH: Item = {
	name: name + ' (Main Hand)',
	description:
		'Gain Attack equal to 50% (If Dual Wielding, gain attack equal to 75% of your Defense',
	type: 'mainhand',
	baseCost: 3,
	image: '/Items/MainHandEquipables/BrassKnuckles.svg',
	maxAmount: 1,
	onEquip: (player: Player, type: ItemType) => {
		const dualwield =
			(player.gear.mainHandItem?.name.startsWith(name) && type == 'offHand') ||
			(player.gear.offHandItem?.name.startsWith(name) && type == 'mainhand');
		player.brassKnucklesMultiplier = dualwield ? 0.75 : 0.5;
	},
	onUnequip: (player: Player, type: ItemType) => {
		const hasAnotherOneEquipped =
			(player.gear.mainHandItem?.name.startsWith(name) && type == 'offHand') ||
			(player.gear.offHandItem?.name.startsWith(name) && type == 'mainhand');

		player.brassKnucklesMultiplier = hasAnotherOneEquipped ? 0.5 : 0;
	}
};
