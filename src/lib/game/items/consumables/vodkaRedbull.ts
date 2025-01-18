import type { Item } from '../itemTypes';

export const vodkaRedbull: Item = {
	baseCost: 1,
	description: 'Gain +5 Movement for 3 turns',
	image: '/Items/Consumables/VodkaRedbull.svg',
	name: 'Vodka Redbull',
	type: 'consumables',
	maxAmount: 5,
	onUse(player) {
		player.statuses.addStatus("VodkaRedbull")
	}
};
