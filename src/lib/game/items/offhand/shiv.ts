import type { Item } from '../itemTypes';

export const Shiv: Item = {
	name: 'Shiv',
	description: 'Steal one gold on win',
	type: 'offHand',
	baseCost: 3,
	image:
		'https://www.google.com/aclk?sa=l&ai=DChcSEwiX18zpidaDAxUbhWgJHYudA3gYABALGgJ3Zg&gclid=Cj0KCQiAwP6sBhDAARIsAPfK_wYR36B9tR30RAx9_-jC-AVxrRS6F-wKvWwWAhUTPswAICOBk1xNHnYaAvKSEALw_wcB&sig=AOD64_34Rmci0xilmnRRVhPzLjp4TqR3_w&adurl&ctype=5&ved=2ahUKEwiGkb3pidaDAxWErycCHVBlCyAQwg96BQgBEJEB&nis=8',

	onWin(player, attackingPlayer) {
		player.gold += 1;
		attackingPlayer.gold -= 1;
	}
};
