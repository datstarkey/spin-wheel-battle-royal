import { createStatModifierStatus } from './statusFactory';

export const arcaneShield = createStatModifierStatus(
	{
		name: 'Arcane Shield',
		description: '+15 defense for 3 turns',
		image: '/StatIcons/Defense.svg',
		turnDuration: 3,
		allowMultiple: false
	},
	[{ stat: 'defense', value: 15 }]
);

export const blink = createStatModifierStatus(
	{
		name: 'Blink',
		description: '+3 movement this turn',
		image: '/StatIcons/Movement.svg',
		turnDuration: 1,
		allowMultiple: false
	},
	[{ stat: 'movement', value: 3 }]
);
