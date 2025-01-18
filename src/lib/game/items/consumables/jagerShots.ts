import type { Item } from '../itemTypes';

export const JagerShots: Item = {
	baseCost: 1,
	description: 'Gain 10 Defense for 3 turns',
	image: '/Items/Consumables/Bevs/JagerShots.svg',
	name: 'Jager Shots',
	type: 'consumables',
	maxAmount: 5,
	onUse(player) {
		player.statuses.addStatus("JagerShots")
	}
};
