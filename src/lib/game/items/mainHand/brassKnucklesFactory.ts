import type { Player } from '../../player/player.svelte';
import type { Item, ItemType } from '../itemTypes';

const BASE_NAME = 'Brass Knuckles';
const MODIFIER_SOURCE = 'Brass Knuckles';

function updateBrassKnucklesModifier(player: Player, multiplier: number) {
	if (multiplier > 0) {
		// Add defense-scaled bonus attack via stat modifiers
		const bonus = Math.floor(player.defense * multiplier);
		player.addStatModifier(MODIFIER_SOURCE, 'attack', bonus);
	} else {
		player.removeStatModifier(MODIFIER_SOURCE, 'attack');
	}
}

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
				(player.gear.mainHandItem?.name.startsWith(BASE_NAME) && type === 'offHand') ||
				(player.gear.offHandItem?.name.startsWith(BASE_NAME) && type === 'mainhand');
			updateBrassKnucklesModifier(player, dualwield ? 0.75 : 0.5);
		},
		onUnequip: (player: Player, type: ItemType) => {
			const hasAnotherOneEquipped =
				(player.gear.mainHandItem?.name.startsWith(BASE_NAME) && type === 'offHand') ||
				(player.gear.offHandItem?.name.startsWith(BASE_NAME) && type === 'mainhand');
			updateBrassKnucklesModifier(player, hasAnotherOneEquipped ? 0.5 : 0);
		}
	};
}
