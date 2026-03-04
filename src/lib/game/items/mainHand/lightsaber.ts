import type { Item } from '../itemTypes';
import { createStatModifierItem } from '../itemFactory';

export const Lightsaber: Item = createStatModifierItem(
	{
		name: 'Lightsaber',
		description: 'Base Attack + 15',
		type: 'mainhand',
		baseCost: 3,
		maxAmount: 1,
		image: '/Items/MainHandEquipables/Lightsaber.svg'
	},
	[{ stat: 'attack', value: 15 }]
);
