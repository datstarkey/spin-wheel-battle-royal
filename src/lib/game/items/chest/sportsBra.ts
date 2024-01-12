import type { Item } from '../itemTypes';

export const SportsBra: Item = {
	name: 'Sports Bra',
	description: 'Opponents lose 5 attack, you dont want a lawsuit',
	type: 'chest',
	baseCost: 3,
	image:
		'https://www.google.com/aclk?sa=l&ai=DChcSEwiX18zpidaDAxUbhWgJHYudA3gYABALGgJ3Zg&gclid=Cj0KCQiAwP6sBhDAARIsAPfK_wYR36B9tR30RAx9_-jC-AVxrRS6F-wKvWwWAhUTPswAICOBk1xNHnYaAvKSEALw_wcB&sig=AOD64_34Rmci0xilmnRRVhPzLjp4TqR3_w&adurl&ctype=5&ved=2ahUKEwiGkb3pidaDAxWErycCHVBlCyAQwg96BQgBEJEB&nis=8',

	onAttackStart(player, attackingPlayer) {
		attackingPlayer.bonusAttack -= 5;
	},

	onAttackEnd(player, attackingPlayer) {
		attackingPlayer.bonusAttack += 5;
	}
};
