import type { Player } from '../../player/player.svelte';
import type { Item, ItemType } from '../itemTypes';

const BASE_NAME = 'Brass Knuckles';

export function createBrassKnuckles(slot: 'mainhand' | 'offHand', label: string): Item {
	return {
		name: `${BASE_NAME} (${label})`,
		description:
			'Gain Attack equal to 50% (If Dual Wielding, gain attack equal to 75% of your Defense',
		type: slot,
		baseCost: 3,
		image: '/Items/MainHandEquipables/BrassKnuckles.svg',
		maxAmount: 1,
		onEquip: (player: Player, type: ItemType) => {
			const dualwield =
				(player.gear.mainHandItem?.name.startsWith(BASE_NAME) && type == 'offHand') ||
				(player.gear.offHandItem?.name.startsWith(BASE_NAME) && type == 'mainhand');
			player.brassKnucklesMultiplier = dualwield ? 0.75 : 0.5;
		},
		onUnequip: (player: Player, type: ItemType) => {
			const hasAnotherOneEquipped =
				(player.gear.mainHandItem?.name.startsWith(BASE_NAME) && type == 'offHand') ||
				(player.gear.offHandItem?.name.startsWith(BASE_NAME) && type == 'mainhand');

			player.brassKnucklesMultiplier = hasAnotherOneEquipped ? 0.5 : 0;
		}
	};
}
