import type { Item } from '../itemTypes';
import { createStatModifierItem } from '../itemFactory';

export const HylianShield: Item = createStatModifierItem(
	{
		name: 'Hylian Shield',
		description: 'Gain +20 Defense',
		type: 'offHand',
		baseCost: 3,
		image: '/Items/OffHandEquipables/HylianShield.svg'
	},
	[{ stat: 'defense', value: 20 }]
);
