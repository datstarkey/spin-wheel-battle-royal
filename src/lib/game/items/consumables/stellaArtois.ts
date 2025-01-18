import type { Item } from '../itemTypes';

export const stellaArtois: Item = {
	baseCost: 1,
	description: 'Gain 10 Attack for 3 turns',
	image: '/Items/Consumables/Bevs/Stella.svg',
	name: 'Stella Artois',
	type: 'consumables',
	maxAmount: 5,
	onUse(player) {
		player.statuses.addStatus("StellaArtois")
	}
};
