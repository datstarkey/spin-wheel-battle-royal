import type { Player } from '../../player/player.svelte';
import type { Item } from '../itemTypes';

const modName = 'Beer Goggles';

function debuff(opponent: Player) {
	opponent.addStatModifier(modName, 'attack', -5);
	opponent.addStatModifier(modName, 'defense', -5);
}

function clearDebuff(opponent: Player) {
	opponent.removeStatModifier(modName, 'attack');
	opponent.removeStatModifier(modName, 'defense');
}

export const BeerGoggles: Item = {
	name: 'Beer Goggles',
	description: 'Opponents have -5 Attack and Defense',
	type: 'helm',
	baseCost: 3,
	maxAmount: 1,
	image: '/Items/HelmEquipables/BeerGoggles.svg',

	onAttackStart: (_player, opponent) => debuff(opponent),
	onAttackEnd: (_player, opponent) => clearDebuff(opponent),
	onDefenseStart: (_player, opponent) => debuff(opponent),
	onDefenseEnd: (_player, opponent) => clearDebuff(opponent)
};
