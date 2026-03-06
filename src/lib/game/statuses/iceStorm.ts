import { createStatModifierStatus } from './statusFactory';

export const iceStorm = createStatModifierStatus(
	{
		name: 'Ice Storm',
		description: 'Slowed by a magical ice storm (-1 movement)',
		image: '',
		turnDuration: 3
	},
	[{ stat: 'movement', value: -1 }]
);
