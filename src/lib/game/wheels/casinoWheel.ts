import { addAuditTrail, addCustomWheel, getPlayerByName, getHasUsedCasinoThisTurn, setHasUsedCasinoThisTurn } from '$lib/stores/gameStore.svelte';
import toast from '$lib/stores/toaster.svelte';
import { incrementLuckyStreak, resetLuckyStreak } from '../classes/gambler';
import { generateLootWheel } from './lootWheel';
import { generateRandomPlayerWheel } from './randomPlayerWheel';

const CASINO_ENTRY_FEE = 5;

/**
 * Check if a player can gamble at the casino
 * Gamblers get free entry!
 */
export function canGambleAtCasino(playerName: string): { canGamble: boolean; reason?: string } {
	const player = getPlayerByName(playerName);
	if (!player) {
		return { canGamble: false, reason: 'Player not found' };
	}

	if (player.dead) {
		return { canGamble: false, reason: 'Dead players cannot gamble' };
	}

	if (getHasUsedCasinoThisTurn()) {
		return { canGamble: false, reason: 'Already used the casino this turn' };
	}

	// Gamblers get free entry!
	if (player.classType === 'gambler') {
		return { canGamble: true };
	}

	if (player.gold < CASINO_ENTRY_FEE) {
		return { canGamble: false, reason: `Need at least ${CASINO_ENTRY_FEE}g to gamble` };
	}

	return { canGamble: true };
}

/**
 * Generate the casino wheel for a player
 * Entry fee: 5 gold (FREE for Gamblers!)
 * Gamblers also build Lucky Streak from casino outcomes
 */
export function generateCasinoWheel(playerName: string) {
	const player = getPlayerByName(playerName);
	if (!player) {
		toast.error(`Could not generate casino wheel, Player ${playerName} not found!`);
		return;
	}

	if (player.dead) return;

	const isGambler = player.classType === 'gambler';

	// Gamblers get FREE entry!
	if (isGambler) {
		addAuditTrail(`${playerName} entered the casino (VIP - FREE entry!) 🎰`);
	} else {
		// Charge entry fee for non-gamblers
		if (player.gold < CASINO_ENTRY_FEE) {
			toast.error(`${playerName} needs at least ${CASINO_ENTRY_FEE}g to gamble!`);
			return;
		}
		player.gold -= CASINO_ENTRY_FEE;
		addAuditTrail(`${playerName} entered the casino (paid ${CASINO_ENTRY_FEE}g)`);
	}

	setHasUsedCasinoThisTurn(true);

	const wheel = [
		{
			// POSITIVE - JACKPOT (rare, high reward)
			label: '🎰 JACKPOT! Double Gold',
			onWin: () => {
				const bonus = Math.min(player.gold, 50); // Cap at +50g
				player.gold += bonus;
				addAuditTrail(`${playerName} hit the JACKPOT! Won ${bonus}g at the casino!`);
				if (isGambler) incrementLuckyStreak(player, 3); // Jackpot = big streak!
			}
		},
		{
			// POSITIVE - Lucky 7s (safe win)
			label: '🍀 Lucky 7s: +15 Gold',
			onWin: () => {
				player.gold += 15;
				addAuditTrail(`${playerName} won 15g at Lucky 7s!`);
				if (isGambler) incrementLuckyStreak(player);
			}
		},
		{
			// NEGATIVE - House Edge (loss)
			label: '🏠 House Edge: -10 Gold',
			onWin: () => {
				player.gold = Math.max(0, player.gold - 10);
				addAuditTrail(`${playerName} lost 10g to the House Edge`);
				if (isGambler) resetLuckyStreak(player);
			}
		},
		{
			// MIXED - All In (high risk/reward)
			label: '🎲 ALL IN: Double or Half',
			onWin: () => {
				const roll = Math.random();
				if (roll >= 0.5) {
					const bonus = Math.min(player.gold, 40);
					player.gold += bonus;
					addAuditTrail(`${playerName} went ALL IN and won ${bonus}g!`);
					if (isGambler) incrementLuckyStreak(player, 2);
				} else {
					const loss = Math.floor(player.gold / 2);
					player.gold -= loss;
					addAuditTrail(`${playerName} went ALL IN and lost ${loss}g!`);
					if (isGambler) resetLuckyStreak(player);
				}
			}
		},
		{
			// POSITIVE - Chip Exchange (utility - attack)
			label: '💪 Trade: +5 Base Attack',
			onWin: () => {
				player.baseAttack += 5;
				addAuditTrail(`${playerName} traded chips for +5 Base Attack`);
				if (isGambler) incrementLuckyStreak(player);
			}
		},
		{
			// NEUTRAL - Comp Drinks (trade-off)
			label: '🍹 Comp Drinks: +20 HP, -5 Gold',
			onWin: () => {
				player.hp += 20;
				player.gold = Math.max(0, player.gold - 5);
				addAuditTrail(`${playerName} got comp drinks: +20 HP, -5g`);
				// Neutral - no streak change
			}
		},
		{
			// POSITIVE - Card Shark (PvP)
			label: '🃏 Card Shark: Steal 10g',
			onWin: () => {
				generateRandomPlayerWheel(`${playerName} Steals From`, (victim) => {
					const stolen = Math.min(10, victim.gold);
					victim.gold -= stolen;
					player.gold += stolen;
					addAuditTrail(`${playerName} used Card Shark to steal ${stolen}g from ${victim.name}!`);
				});
				if (isGambler) incrementLuckyStreak(player);
			}
		},
		{
			// NEGATIVE - Busted (loss)
			label: '💸 Busted: -25% Gold',
			onWin: () => {
				const loss = Math.floor(player.gold * 0.25);
				player.gold -= loss;
				addAuditTrail(`${playerName} went bust at the casino! Lost ${loss}g`);
				if (isGambler) resetLuckyStreak(player);
			}
		},
		{
			// POSITIVE - VIP Spin (bonus wheel)
			label: '⭐ VIP Access: Spin Loot Wheel',
			onWin: () => {
				addAuditTrail(`${playerName} got VIP access to the Loot Wheel!`);
				generateLootWheel(playerName);
				if (isGambler) incrementLuckyStreak(player);
			}
		},
		{
			// POSITIVE - Gambler's Favor (class synergy)
			label: isGambler ? "🎰 Gambler's Favor: +30 Gold" : "🎰 Gambler's Favor: +5 Gold",
			onWin: () => {
				if (isGambler) {
					player.gold += 30;
					addAuditTrail(`${playerName} received Gambler's Favor: +30g!`);
					incrementLuckyStreak(player, 2); // Extra streak for class bonus!
				} else {
					player.gold += 5;
					addAuditTrail(`${playerName} received Gambler's Favor: +5g`);
				}
			}
		},
		{
			// POSITIVE - Chip Exchange (utility - defense)
			label: '🛡️ Trade: +5 Base Defense',
			onWin: () => {
				player.baseDefense += 5;
				addAuditTrail(`${playerName} traded chips for +5 Base Defense`);
				if (isGambler) incrementLuckyStreak(player);
			}
		},
		{
			// POSITIVE - Hot Streak (another spin)
			label: '🔥 Hot Streak: Spin Again FREE',
			onWin: () => {
				addAuditTrail(`${playerName} is on a Hot Streak! Free spin!`);
				if (isGambler) incrementLuckyStreak(player, 2); // Hot streak = double streak!
				// Refund entry fee for non-gamblers and spin again
				if (!isGambler) player.gold += CASINO_ENTRY_FEE;
				setHasUsedCasinoThisTurn(false); // Allow another spin
				generateCasinoWheel(playerName);
			}
		}
	];

	addCustomWheel(`Casino - ${player.name}`, wheel, 'casino');
}

/**
 * Get the casino entry fee
 */
export function getCasinoEntryFee(): number {
	return CASINO_ENTRY_FEE;
}
