import { createStatModifierStatus } from './statusFactory';

export const frostShield = createStatModifierStatus(
	{
		name: 'Frost Shield',
		description: '+10 defense from a magical frost barrier',
		image: '',
		turnDuration: 2
	},
	[{ stat: 'defense', value: 10 }]
);
