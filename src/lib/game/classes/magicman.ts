import { addAuditTrail } from '$lib/stores/gameStore.svelte';
import type { Player } from '../player/player.svelte';
import {
	MANA_RESOURCE,
	MANA_REGEN_PER_TURN,
	MAX_MANA,
	addMana,
	getMana,
	setMana,
	getRuneOfPowerTurns,
	incrementRuneOfPowerTurns,
	resetRuneOfPowerTurns
} from '../wheels/spellWheels';
import type { ClassBase } from './classType';

export const Magicman: ClassBase = {
	hp: 80,
	attack: 20,
	defense: 10,
	attackRange: 3, // +2 attack range (base 1 + 2)
	name: 'Magic Man',
	description:
		'Master of arcane arts who casts spells instead of attacking. Manages mana (max 100) to fuel Minor (25), Major (50), and Ultimate (100) spells.',
	onWinAbility: 'Regenerates 10 mana + 1 per unused movement',

	onAttackWin: (player, _defendingPlayer) => {
		// Magic Man generates mana on attack win instead of normal win wheel
		addMana(player, 10);
		addAuditTrail(`${player.name} channels arcane energy, gaining 10 mana`);
	},

	onTurnStart(player) {
		// Initialize mana if not set
		if (player.resources[MANA_RESOURCE] === undefined) {
			setMana(player, 50); // Start with 50 mana
		}

		// Check Rune of Power status
		if (player.statuses.hasStatus('RuneOfPower')) {
			incrementRuneOfPowerTurns(player);
			const turns = getRuneOfPowerTurns(player);
			addAuditTrail(`${player.name} stands on Rune of Power (${turns}/5 turns)`);

			if (turns >= 5 && !player.statuses.hasStatus('Archmage')) {
				// ASCENSION! Become Archmage
				player.statuses.addStatus('Archmage');
				addAuditTrail(`${player.name} ASCENDS to become an ARCHMAGE!`);
			}
		}

		// Drain mana if has active spell effects (simplified - just check if in combat)
		// This could be expanded to track active spells
	},

	onTurnEnd(player) {
		// Calculate unused movement (this would need game state access)
		// For now, base regeneration only
		let manaRegen = MANA_REGEN_PER_TURN;

		// Archmage doubles mana regen
		if (player.statuses.hasStatus('Archmage')) {
			manaRegen *= 2;
		}

		addMana(player, manaRegen);
		addAuditTrail(`${player.name} regenerates ${manaRegen} mana (${getMana(player)}/${MAX_MANA})`);

		// Check if ran out of mana while on Rune of Power
		if (player.statuses.hasStatus('RuneOfPower') && getMana(player) <= 0) {
			player.statuses.removeStatus('RuneOfPower');
			resetRuneOfPowerTurns(player);
			addAuditTrail(`${player.name}'s Rune of Power fades due to mana exhaustion!`);
		}
	}
};

// Helper to check if player is Archmage (can attack anywhere with line of sight)
export function isArchmage(player: Player): boolean {
	return player.classType === 'magicman' && player.statuses.hasStatus('Archmage');
}

// Helper for unused movement mana bonus (call from game when movement is finalized)
export function grantUnusedMovementMana(player: Player, unusedMovement: number) {
	if (player.classType !== 'magicman') return;

	let bonus = unusedMovement;
	if (player.statuses.hasStatus('Archmage')) {
		bonus *= 2;
	}

	if (bonus > 0) {
		addMana(player, bonus);
		addAuditTrail(`${player.name} gains ${bonus} mana from unused movement`);
	}
}
