import { addAuditTrail } from '$lib/stores/gameStore.svelte';
import type { Player } from '../player/player.svelte';
import type { ClassBase } from './classType';

// Track grudges by player name -> target name (module level since resources only stores numbers)
const grudgeTargets = new Map<string, string>();

// Multiplier keys
const DOUBLE_TAP_ATTACK = 'DoubleTapAttack';
const DOUBLE_TAP_DEFENSE = 'DoubleTapDefense';
const GRUDGE_BONUS = 'GrudgeBonus';

// Helper to set grudge target
function setGrudge(player: Player, attackerName: string) {
	const oldGrudge = grudgeTargets.get(player.name);
	if (oldGrudge !== attackerName) {
		grudgeTargets.set(player.name, attackerName);
		addAuditTrail(`${player.name} marks ${attackerName} for revenge! 🎯`);
	}
}

// Helper to check if target is grudge target
function isGrudgeTarget(player: Player, targetName: string): boolean {
	return grudgeTargets.get(player.name) === targetName;
}

// Helper to clear grudge
function clearGrudge(player: Player) {
	const oldGrudge = grudgeTargets.get(player.name);
	if (oldGrudge) {
		grudgeTargets.delete(player.name);
		addAuditTrail(`${player.name} got their revenge on ${oldGrudge}! Grudge cleared. 💀`);
	}
}

// Export for UI display
export function getGrudgeTarget(playerName: string): string | undefined {
	return grudgeTargets.get(playerName);
}

// Export for game reset
export function clearAllGrudges() {
	grudgeTargets.clear();
}

export const Gorf: ClassBase = {
	hp: 100,
	attack: 12,
	defense: 8,
	name: 'Gorf',
	icon: '/Classes/Gorf.svg',
	attackRange: 1,
	description:
		'A scrappy two-tapper who amplifies all combat. Deals and takes 50% bonus damage. Holds a Grudge against whoever last attacked them (+25% damage).',
	onWinAbility: 'Two-tap bonus damage + Grudge revenge',

	// When Gorf attacks, apply Double Tap (50% more damage) and Grudge bonus if applicable
	onAttackStart(player, defendingPlayer) {
		// Double Tap: +50% damage dealt
		player.attackMultipliers[DOUBLE_TAP_ATTACK] = 1.5;

		// Grudge: +25% damage vs last attacker
		if (isGrudgeTarget(player, defendingPlayer.name)) {
			player.attackMultipliers[GRUDGE_BONUS] = 1.25;
			addAuditTrail(`${player.name} attacks their Grudge target ${defendingPlayer.name}! +25% damage! 🔥`);
		}
	},

	onAttackEnd(player, _defendingPlayer) {
		// Clean up multipliers
		delete player.attackMultipliers[DOUBLE_TAP_ATTACK];
		delete player.attackMultipliers[GRUDGE_BONUS];
	},

	onAttackWin(player, defendingPlayer) {
		// If we beat our grudge target, clear the grudge
		if (isGrudgeTarget(player, defendingPlayer.name)) {
			clearGrudge(player);
		}
		// Bonus gold for the win
		player.gold += 2;
		addAuditTrail(`${player.name} two-tapped ${defendingPlayer.name}! +2 gold 💰`);
	},

	// When Gorf defends, apply Double Tap (50% more damage taken)
	onDefenseStart(_player, attackingPlayer) {
		// Double Tap: +50% damage taken (reduce our defense effectiveness)
		attackingPlayer.attackMultipliers[DOUBLE_TAP_DEFENSE] = 1.5;
	},

	onDefenseEnd(_player, attackingPlayer) {
		// Clean up multiplier
		delete attackingPlayer.attackMultipliers[DOUBLE_TAP_DEFENSE];
	},

	onDefendLose(player, attackingPlayer) {
		// Set grudge against whoever just hit us
		setGrudge(player, attackingPlayer.name);
	}
};
