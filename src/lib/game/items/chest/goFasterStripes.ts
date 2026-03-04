import type { Item } from '../itemTypes';
import { createStatModifierItem } from '../itemFactory';

export const GoFasterStripes: Item = createStatModifierItem(
	{
		name: 'Go Faster Stripes',
		description: 'Gain +2 Movement',
		type: 'chest',
		baseCost: 3,
		maxAmount: 1,
		image: '/Items/ChestEquipables/GoFasterStripes.svg'
	},
	[{ stat: 'movement', value: 2 }]
);
