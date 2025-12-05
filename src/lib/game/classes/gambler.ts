import { addAuditTrail } from '$lib/stores/gameStore.svelte';
import type { Player } from '../player/player.svelte';
import type { ClassBase } from './classType';

// Resource key for tracking lucky streak
export const LUCKY_STREAK_RESOURCE = 'LuckyStreak';

// Helper to increment lucky streak
export function incrementLuckyStreak(player: Player, amount: number = 1) {
	player.resources[LUCKY_STREAK_RESOURCE] ??= 0;
	player.resources[LUCKY_STREAK_RESOURCE] += amount;
	const streak = player.resources[LUCKY_STREAK_RESOURCE];
	addAuditTrail(
		`${player.name}'s Lucky Streak grows to ${streak}! 🔥 (+${streak * 2}% ATK/DEF)`
	);
}

// Helper to reset lucky streak on bad outcome
export function resetLuckyStreak(player: Player) {
	const oldStreak = player.resources[LUCKY_STREAK_RESOURCE] ?? 0;
	if (oldStreak > 0) {
		player.resources[LUCKY_STREAK_RESOURCE] = 0;
		addAuditTrail(`${player.name}'s Lucky Streak of ${oldStreak} was broken! 💔`);
	}
}

// Get current streak value
export function getLuckyStreak(player: Player): number {
	return player.resources[LUCKY_STREAK_RESOURCE] ?? 0;
}

export const Gambler: ClassBase = {
	hp: 100,
	attack: 15,
	defense: 15,
	name: 'Gambler',
	description:
		'A risk-taker whose HP equals Gold. Builds Lucky Streak on positive wheel outcomes (+2% ATK/DEF per stack). Free casino entry. Streak resets on bad outcomes.',
	onWinAbility: 'Spin the Gambler wheel instead of the win and loss wheels',
	attackRange: 1,
	startingGold: 100,

	// Passive: +2% ATK per Lucky Streak stack (based on base attack)
	getBonusAttack(player) {
		const streak = player.resources[LUCKY_STREAK_RESOURCE] ?? 0;
		return Math.floor((streak * 2 / 100) * player.baseAttack);
	},

	// Passive: +2% DEF per Lucky Streak stack (based on base defense)
	getBonusDefense(player) {
		const streak = player.resources[LUCKY_STREAK_RESOURCE] ?? 0;
		return Math.floor((streak * 2 / 100) * player.baseDefense);
	},

	onAttackWin(player, _defendingPlayer) {
		// Winning an attack is a positive outcome - streak grows
		incrementLuckyStreak(player);
	},

	onAttackLose(player, _defendingPlayer) {
		// Losing an attack breaks the streak
		resetLuckyStreak(player);
	},

	onDefendLose(player, _attackingPlayer) {
		// Getting hit breaks the streak
		resetLuckyStreak(player);
	},

	onTurnStart(player) {
		player.hp = player.gold;
	}
};
