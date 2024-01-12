import type { Item } from '../itemTypes';

export const HealthPot: Item = {
	baseCost: 1,
	description: 'Heals 10hp',
	image: '',
	name: 'Health Potion',
	type: 'consumables',

	onUse(player) {
		player.hp += 10;
	}
};
