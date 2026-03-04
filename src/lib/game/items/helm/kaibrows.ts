import type { Item } from '../itemTypes';
import { createStatModifierItem } from '../itemFactory';

export const Kaibrows: Item = createStatModifierItem(
	{
		name: 'Kaibrows',
		description: 'Gain +15 Attack, lose -5 Defense',
		type: 'helm',
		baseCost: 3,
		maxAmount: 1,
		image: '/Items/HelmEquipables/Kaibrows.svg'
	},
	[
		{ stat: 'attack', value: 15 },
		{ stat: 'defense', value: -5 }
	]
);
