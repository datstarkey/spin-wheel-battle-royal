import { addAuditTrail } from '$lib/stores/gameStore.svelte';
import type { Player } from '../player/player.svelte';
import type { ClassBase } from './classType';

// Resource key for tracking lucky streak
export const LUCKY_STREAK_RESOURCE = 'LuckyStreak';
const LUCKY_STREAK_MULTIPLIER_KEY = 'LuckyStreak';

// Helper to update the multipliers based on current streak
function updateLuckyStreakMultipliers(player: Player) {
	const streak = player.resources[LUCKY_STREAK_RESOURCE] ?? 0;
	if (streak > 0) {
		// Each stack gives +10% multiplier (0.1 per stack)
		// Attack multipliers are additive (summed then added to 1)
		// Defense multipliers are multiplicative (multiplied starting at 1)
		const multiplierBonus = streak * 0.1;
		player.attackMultipliers[LUCKY_STREAK_MULTIPLIER_KEY] = multiplierBonus;
		player.defenseMultipliers[LUCKY_STREAK_MULTIPLIER_KEY] = 1 + multiplierBonus;
	} else {
		delete player.attackMultipliers[LUCKY_STREAK_MULTIPLIER_KEY];
		delete player.defenseMultipliers[LUCKY_STREAK_MULTIPLIER_KEY];
	}
}

// Helper to increment lucky streak
export function incrementLuckyStreak(player: Player, amount: number = 1) {
	player.resources[LUCKY_STREAK_RESOURCE] ??= 0;
	player.resources[LUCKY_STREAK_RESOURCE] += amount;
	const streak = player.resources[LUCKY_STREAK_RESOURCE];
	updateLuckyStreakMultipliers(player);
	addAuditTrail(`${player.name}'s Lucky Streak grows to ${streak}! 🔥 (${streak * 10}% ATK/DEF multiplier)`);
}

// Helper to reset lucky streak on bad outcome
export function resetLuckyStreak(player: Player) {
	const oldStreak = player.resources[LUCKY_STREAK_RESOURCE] ?? 0;
	if (oldStreak > 0) {
		player.resources[LUCKY_STREAK_RESOURCE] = 0;
		updateLuckyStreakMultipliers(player);
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
	icon: '/Classes/Gambler.svg',
	description:
		'A risk-taker whose HP equals Gold. Builds Lucky Streak on positive wheel outcomes (10% ATK/DEF multiplier per stack). Free casino entry. Streak resets on bad outcomes.',
	onWinAbility: 'Spin the Gambler wheel instead of the win and loss wheels',
	attackRange: 1,
	startingGold: 100,

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
