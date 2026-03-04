import type { Item } from '../itemTypes';
import { createStatModifierItem } from '../itemFactory';

export const Fireball: Item = createStatModifierItem(
	{
		name: 'Fireball',
		description: 'Gain +3 Attack Range',
		image: '/Items/MainHandEquipables/Fireball.svg',
		type: 'mainhand',
		baseCost: 3,
		maxAmount: 1
	},
	[{ stat: 'attackRange', value: 3 }]
);
