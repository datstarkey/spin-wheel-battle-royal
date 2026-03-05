import type { Player } from '../player/player.svelte';
import type { ClassBase } from './classType';

// Multiplier keys
const DOUBLE_TAP_ATTACK = 'DoubleTapAttack';
const DOUBLE_TAP_DEFENSE = 'DoubleTapDefense';
const GRUDGE_BONUS = 'GrudgeBonus';

// Grudge target stored in player resources with a prefixed key
const GRUDGE_PREFIX = 'GorfGrudge:';

// Helper to set grudge target using player resources
function setGrudge(player: Player, attackerName: string) {
	const oldGrudge = getGrudgeTarget(player);
	if (oldGrudge !== attackerName) {
		if (oldGrudge) {
			delete player.resources[`${GRUDGE_PREFIX}${oldGrudge}`];
		}
		player.resources[`${GRUDGE_PREFIX}${attackerName}`] = 1;
		player.game?.addAuditTrail(`${player.name} marks ${attackerName} for revenge!`);
	}
}

// Helper to get grudge target from player resources
export function getGrudgeTarget(player: Player): string | undefined {
	for (const key of Object.keys(player.resources)) {
		if (key.startsWith(GRUDGE_PREFIX) && player.resources[key] === 1) {
			return key.slice(GRUDGE_PREFIX.length);
		}
	}
	return undefined;
}

// Helper to check if target is grudge target
function isGrudgeTarget(player: Player, targetName: string): boolean {
	return getGrudgeTarget(player) === targetName;
}

// Helper to clear grudge
function clearGrudge(player: Player) {
	const oldGrudge = getGrudgeTarget(player);
	if (oldGrudge) {
		delete player.resources[`${GRUDGE_PREFIX}${oldGrudge}`];
		player.game?.addAuditTrail(`${player.name} got their revenge on ${oldGrudge}! Grudge cleared.`);
	}
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

	onAttackStart(player, defendingPlayer, _ctx) {
		player.attackMultipliers[DOUBLE_TAP_ATTACK] = 1.5;
		if (isGrudgeTarget(player, defendingPlayer.name)) {
			player.attackMultipliers[GRUDGE_BONUS] = 1.25;
			player.game?.addAuditTrail(
				`${player.name} attacks their Grudge target ${defendingPlayer.name}! +25% damage!`
			);
		}
	},

	onAttackEnd(player, _defendingPlayer) {
		delete player.attackMultipliers[DOUBLE_TAP_ATTACK];
		delete player.attackMultipliers[GRUDGE_BONUS];
	},

	onAttackWin(player, defendingPlayer, _ctx) {
		if (isGrudgeTarget(player, defendingPlayer.name)) {
			clearGrudge(player);
		}
		player.gold += 2;
		player.game?.addAuditTrail(`${player.name} two-tapped ${defendingPlayer.name}! +2 gold`);
	},

	onDefenseStart(_player, attackingPlayer) {
		attackingPlayer.attackMultipliers[DOUBLE_TAP_DEFENSE] = 1.5;
	},

	onDefenseEnd(_player, attackingPlayer) {
		delete attackingPlayer.attackMultipliers[DOUBLE_TAP_DEFENSE];
	},

	onDefendLose(player, attackingPlayer, _ctx) {
		setGrudge(player, attackingPlayer.name);
	}
};
