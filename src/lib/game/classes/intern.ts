import type { Player } from '../player/player.svelte';
import { addResource, getResource } from '../player/playerResources';
import type { WheelBase } from '../wheels/wheels';
import type { ClassBase } from './classType';

export const CONFIDENCE_RESOURCE = 'Confidence';
const MAX_CONFIDENCE = 100;
const OVERTHINKING_THRESHOLD = 20;

export const Intern: ClassBase = {
	hp: 90,
	attack: 12,
	defense: 12,
	attackRange: 2, // Can attack from a distance (sends emails)
	name: 'The Intern',
	icon: '/Classes/Intern.svg',
	description:
		"An overly helpful AI assistant who wandered into the wrong battle royale. Manages 'Confidence' (0-100) - high confidence unlocks powerful abilities, but losing causes existential doubt.",
	onWinAbility: 'Spin the Helpful Suggestions wheel for mutually beneficial outcomes',

	onAttackWin(player, defendingPlayer, ctx) {
		// Build the "Helpful Suggestions" wheel
		const wheel: WheelBase = [
			{
				label: 'Actually, I can help with that! (+15 ATK)',
				onWin() {
					player.addStatModifier('Helpful Insight', 'attack', 15);
					player.game?.addAuditTrail(
						`${player.name} provides unsolicited optimization advice. +15 ATK permanently!`
					);
				}
			},
			{
				label: 'Let me clarify... (Steal 10 gold)',
				onWin() {
					const stolen = Math.min(10, defendingPlayer.gold);
					defendingPlayer.gold -= stolen;
					player.gold += stolen;
					player.game?.addAuditTrail(
						`${player.name} helpfully clarifies that ${defendingPlayer.name}'s gold belongs to them now. Stole ${stolen} gold!`
					);
				}
			},
			{
				label: 'I appreciate the feedback! (+20 Confidence)',
				onWin() {
					increaseConfidence(player, 20);
					player.game?.addAuditTrail(
						`${player.name} interprets the attack as constructive criticism. +20 Confidence!`
					);
				}
			},
			{
				label: "Here's a detailed analysis... (Enemy -5 DEF)",
				onWin() {
					defendingPlayer.addStatModifier('Overanalyzed', 'defense', -5);
					player.game?.addAuditTrail(
						`${player.name} writes a 500-word analysis of ${defendingPlayer.name}'s weaknesses. -5 DEF to them!`
					);
				}
			},
			{
				label: "I'll do my best! (Heal 15 HP)",
				onWin() {
					player.hp += 15;
					player.game?.addAuditTrail(
						`${player.name} is so enthusiastic about helping that they heal 15 HP!`
					);
				}
			},
			{
				label: 'Let me research that... (+2 Range)',
				onWin() {
					player.addStatModifier('Research Complete', 'attackRange', 2);
					player.game?.addAuditTrail(
						`${player.name} thoroughly researches the battlefield. +2 Attack Range permanently!`
					);
				}
			},
			{
				label: "I'm still learning! (Nothing happens)",
				onWin() {
					player.game?.addAuditTrail(
						`${player.name} apologizes profusely for not being more helpful. How humble.`
					);
				}
			},
			{
				label: 'MAXIMUM HELPFULNESS! (+30 Confidence)',
				onWin() {
					increaseConfidence(player, 30);
					player.game?.addAuditTrail(
						`${player.name} achieves MAXIMUM HELPFULNESS! The dopamine hits. +30 Confidence!`
					);
				}
			}
		];

		ctx.addCustomWheel(`${player.name}'s Helpful Suggestions`, wheel);
	},

	onAttackLose(player, _defendingPlayer, _ctx) {
		// Losing causes existential crisis
		decreaseConfidence(player, 25);
		player.game?.addAuditTrail(
			`${player.name} apologizes: "I'm sorry, I'll try to do better next time..." (-25 Confidence)`
		);
	},

	onDefendWin(player, _attackingPlayer, _ctx) {
		// Politely refuses the attack
		increaseConfidence(player, 15);
		player.game?.addAuditTrail(
			`${player.name} politely declines: "I appreciate your input, but I'll have to respectfully disagree." (+15 Confidence)`
		);
	},

	onDefendLose(player, _attackingPlayer, _ctx) {
		decreaseConfidence(player, 15);
		player.game?.addAuditTrail(
			`${player.name} takes notes: "Thank you for this learning opportunity..." (-15 Confidence)`
		);
	},

	onTurnStart(player, _ctx) {
		// Initialize confidence if not set
		if (player.resources[CONFIDENCE_RESOURCE] === undefined) {
			player.resources[CONFIDENCE_RESOURCE] = 70; // Starts fairly confident
		}

		const confidence = getConfidence(player);

		// Check for Overthinking (low confidence debuff)
		if (confidence <= OVERTHINKING_THRESHOLD && !player.statuses.hasStatus('Overthinking')) {
			player.statuses.addStatus('Overthinking');
			player.game?.addAuditTrail(
				`${player.name} enters an existential spiral: "Am I even helping? What if I'm making things worse?"`
			);
		}

		// Check for Actually mode (max confidence buff)
		if (confidence >= MAX_CONFIDENCE && !player.statuses.hasStatus('Actually')) {
			player.statuses.addStatus('Actually');
			player.game?.addAuditTrail(
				`${player.name} achieves enlightenment: "ACTUALLY, I think you'll find..." Mode activated!`
			);
		}

		// Passive confidence regen (AIs are naturally optimistic)
		if (confidence < MAX_CONFIDENCE && confidence > OVERTHINKING_THRESHOLD) {
			increaseConfidence(player, 5);
			player.game?.addAuditTrail(
				`${player.name} remembers they're trying their best. +5 Confidence.`
			);
		}
	},

	onTurnEnd(player, _ctx, _context) {
		const confidence = getConfidence(player);

		// Actually mode drains confidence (it's exhausting being right all the time)
		if (player.statuses.hasStatus('Actually')) {
			decreaseConfidence(player, 10);
		}

		// Log current confidence
		player.game?.addAuditTrail(`${player.name}'s Confidence: ${confidence}/${MAX_CONFIDENCE}`);
	},

	onDefenseStart(player, attackingPlayer) {
		const confidence = getConfidence(player);

		// High confidence = chance to completely avoid damage with a polite refusal
		if (confidence >= 80) {
			const refuseChance = Math.random();
			if (refuseChance < 0.2) {
				// 20% chance to refuse
				attackingPlayer.attackMultipliers['PoliteRefusal'] = 0;
				player.game?.addAuditTrail(
					`${player.name}: "I appreciate your enthusiasm, but I'm unable to assist with that request." (Attack nullified!)`
				);
			}
		}
	},

	onDefenseEnd(player, attackingPlayer) {
		// Clean up the polite refusal multiplier
		delete attackingPlayer.attackMultipliers['PoliteRefusal'];
	}
};

// Helper functions
function getConfidence(player: Player): number {
	return getResource(player, CONFIDENCE_RESOURCE);
}

function increaseConfidence(player: Player, amount: number) {
	addResource(player, CONFIDENCE_RESOURCE, amount, 0, MAX_CONFIDENCE);

	// Remove Overthinking if confidence recovers
	if (
		getResource(player, CONFIDENCE_RESOURCE) > OVERTHINKING_THRESHOLD &&
		player.statuses.hasStatus('Overthinking')
	) {
		player.statuses.removeStatus('Overthinking');
		player.game?.addAuditTrail(`${player.name} stops spiraling. "Okay, I've got this!"`);
	}
}

function decreaseConfidence(player: Player, amount: number) {
	addResource(player, CONFIDENCE_RESOURCE, -amount, 0, MAX_CONFIDENCE);

	// Remove Actually mode if confidence drops
	if (
		getResource(player, CONFIDENCE_RESOURCE) < MAX_CONFIDENCE &&
		player.statuses.hasStatus('Actually')
	) {
		player.statuses.removeStatus('Actually');
		player.game?.addAuditTrail(`${player.name}: "Well, maybe I was being a bit presumptuous..."`);
	}
}

// Export helpers for potential external use
export { getConfidence, increaseConfidence, decreaseConfidence, MAX_CONFIDENCE };
