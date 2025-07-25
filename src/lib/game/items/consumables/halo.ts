import type { Player } from '../../player/player.svelte';
import type { Item } from '../itemTypes';

export const Halo: Item = {
	name: 'Halo',
	description: 'Negates the effects of the Shadow Realm - Consumed on use',
	type: 'consumables',
	baseCost: 10,
	maxAmount: 1,
	image: '/Items/HelmEquipables/Halo.svg',

	onUse(player) {
		player.inShadowRealm = false
	}


};
