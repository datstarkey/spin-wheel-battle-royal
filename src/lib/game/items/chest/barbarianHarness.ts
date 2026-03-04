import type { Item } from '../itemTypes';
import { createStatModifierItem } from '../itemFactory';

export const BarbarianHarness: Item = createStatModifierItem(
	{
		name: 'Barbarian Harness',
		description: 'Gain +20 attack, Lose -10 Defense',
		type: 'chest',
		baseCost: 3,
		maxAmount: 1,
		image: '/Items/ChestEquipables/BarbarianHarness.svg'
	},
	[
		{ stat: 'attack', value: 20 },
		{ stat: 'defense', value: -10 }
	]
);
