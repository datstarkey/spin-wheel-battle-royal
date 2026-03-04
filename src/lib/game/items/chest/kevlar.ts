import type { Item } from '../itemTypes';
import { createStatModifierItem } from '../itemFactory';

export const Kevlar: Item = createStatModifierItem(
	{
		name: 'Kevlar',
		description: 'Gain +15 Defense',
		type: 'chest',
		baseCost: 3,
		maxAmount: 1,
		image: '/Items/ChestEquipables/KevlarVest.svg'
	},
	[{ stat: 'defense', value: 15 }]
);
