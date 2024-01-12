import type { Player } from '$lib/game/player/player';
import type { Item } from '../itemTypes';

export const HylianShield: Item = {
	name: 'Hylian Shield',
	description: 'Gain +20 Defense',
	type: 'offHand',
	baseCost: 3,
	image:
		'https://www.google.com/aclk?sa=l&ai=DChcSEwiX18zpidaDAxUbhWgJHYudA3gYABALGgJ3Zg&gclid=Cj0KCQiAwP6sBhDAARIsAPfK_wYR36B9tR30RAx9_-jC-AVxrRS6F-wKvWwWAhUTPswAICOBk1xNHnYaAvKSEALw_wcB&sig=AOD64_34Rmci0xilmnRRVhPzLjp4TqR3_w&adurl&ctype=5&ved=2ahUKEwiGkb3pidaDAxWErycCHVBlCyAQwg96BQgBEJEB&nis=8',

	onEquip: (player: Player) => {
		player.bonusDefense += 20;
	},
	onUnequip: (player: Player) => {
		player.bonusDefense -= 20;
	}
};
