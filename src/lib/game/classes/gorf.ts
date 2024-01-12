import { getGlobalHpReduction } from '$lib/stores/gameStore';
import toast from 'svelte-french-toast';
import type { ClassBase } from './classType';

export const Gorf: ClassBase = {
	hp: 10,
	attack: 12,
	defense: 8,
	name: 'Gorf',
	attackRange: 1,

	onWinAbility: 'Gives 2 taps - 2nd passive',

	// Gorf's passive just does wins another gold, or takes Additional damage if he loses
	onWin(player, attackingPlayer) {
		toast.success(`${player.name} 2 tapped ${attackingPlayer.name}!`);
		attackingPlayer.hp -= getGlobalHpReduction();
		player.gold += 1;
	},
	onLose(player) {
		toast.error(`${player.name} got 2 tapped!`);
		player.hp -= getGlobalHpReduction();
	}
};
