import type { Item } from '../itemTypes';
import { createStatModifierItem } from '../itemFactory';

export const ANiceHat: Item = createStatModifierItem(
	{
		name: 'A Nice Hat',
		description: 'Gain +5 Attack, Gain +5 Defense',
		type: 'helm',
		baseCost: 3,
		maxAmount: 1,
		image: '/Items/HelmEquipables/ANiceHat.svg'
	},
	[
		{ stat: 'attack', value: 5 },
		{ stat: 'defense', value: 5 }
	]
);
