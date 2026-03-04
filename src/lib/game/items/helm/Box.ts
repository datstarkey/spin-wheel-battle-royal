import type { Item } from '../itemTypes';
import { createStatModifierItem } from '../itemFactory';

export const Box: Item = createStatModifierItem(
	{
		name: 'A Box',
		description: 'Gain +20 Defense, lose -10 Attack',
		type: 'helm',
		baseCost: 3,
		maxAmount: 1,
		image: '/Items/HelmEquipables/Box.svg'
	},
	[
		{ stat: 'attack', value: -10 },
		{ stat: 'defense', value: 20 }
	]
);
