import { addCustomWheel, currentGame, getPlayerByName, getHasUsedCasinoThisTurn, setHasUsedCasinoThisTurn } from '$lib/stores/gameStore.svelte';
import toast from '$lib/stores/toaster.svelte';
import { generateLootWheel } from './lootWheel';
import { generateRandomPlayerWheel } from './randomPlayerWheel';

const CASINO_ENTRY_FEE = 5;

/**
 * Check if a player can gamble at the casino
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

	if (player.gold < CASINO_ENTRY_FEE) {
		return { canGamble: false, reason: `Need at least ${CASINO_ENTRY_FEE}g to gamble` };
	}

	return { canGamble: true };
}

/**
 * Generate the casino wheel for a player
 * Entry fee: 5 gold
 * Net-negative expected value to prevent gold inflation
 */
export function generateCasinoWheel(playerName: string) {
	const player = getPlayerByName(playerName);
	if (!player) {
		toast.error(`Could not generate casino wheel, Player ${playerName} not found!`);
		return;
	}

	if (player.dead) return;

	// Charge entry fee
	if (player.gold < CASINO_ENTRY_FEE) {
		toast.error(`${playerName} needs at least ${CASINO_ENTRY_FEE}g to gamble!`);
		return;
	}

	player.gold -= CASINO_ENTRY_FEE;
	toast.info(`${playerName} paid ${CASINO_ENTRY_FEE}g entry fee`);
	setHasUsedCasinoThisTurn(true);

	const isGambler = player.classType === 'gambler';

	const wheel = [
		{
			// 1 - JACKPOT (rare, high reward)
			label: '🎰 JACKPOT! Double Gold',
			onWin: () => {
				const bonus = Math.min(player.gold, 50); // Cap at +50g
				player.gold += bonus;
				toast.success(`${playerName} hit the JACKPOT! +${bonus}g`);
			}
		},
		{
			// 2 - Lucky 7s (safe win)
			label: '🍀 Lucky 7s: +15 Gold',
			onWin: () => {
				player.gold += 15;
			}
		},
		{
			// 3 - House Edge (loss)
			label: '🏠 House Edge: -10 Gold',
			onWin: () => {
				player.gold = Math.max(0, player.gold - 10);
			}
		},
		{
			// 4 - All In (high risk/reward)
			label: '🎲 ALL IN: Double or Half',
			onWin: () => {
				const roll = Math.random();
				if (roll >= 0.5) {
					const bonus = Math.min(player.gold, 40);
					player.gold += bonus;
					toast.success(`${playerName} doubled up! +${bonus}g`);
				} else {
					const loss = Math.floor(player.gold / 2);
					player.gold -= loss;
					toast.error(`${playerName} lost the gamble! -${loss}g`);
				}
			}
		},
		{
			// 5 - Chip Exchange (utility - attack)
			label: '💪 Trade: +5 Base Attack',
			onWin: () => {
				player.baseAttack += 5;
				toast.success(`${playerName} exchanged chips for +5 Attack!`);
			}
		},
		{
			// 6 - Comp Drinks (trade-off)
			label: '🍹 Comp Drinks: +20 HP, -5 Gold',
			onWin: () => {
				player.hp += 20;
				player.gold = Math.max(0, player.gold - 5);
			}
		},
		{
			// 7 - Card Shark (PvP)
			label: '🃏 Card Shark: Steal 10g',
			onWin: () => {
				toast.info(`${playerName} must pick a victim!`);
				generateRandomPlayerWheel(`${playerName} Steals From`, (victim) => {
					const stolen = Math.min(10, victim.gold);
					victim.gold -= stolen;
					player.gold += stolen;
					toast.success(`${playerName} stole ${stolen}g from ${victim.name}!`);
				});
			}
		},
		{
			// 8 - Busted (loss)
			label: '💸 Busted: -25% Gold',
			onWin: () => {
				const loss = Math.floor(player.gold * 0.25);
				player.gold -= loss;
				toast.error(`${playerName} went bust! -${loss}g`);
			}
		},
		{
			// 9 - VIP Spin (bonus wheel)
			label: '⭐ VIP Access: Spin Loot Wheel',
			onWin: () => {
				toast.success(`${playerName} got VIP access!`);
				generateLootWheel(playerName);
			}
		},
		{
			// 10 - Gambler's Favor (class synergy)
			label: isGambler ? "🎰 Gambler's Favor: +30 Gold" : "🎰 Gambler's Favor: +5 Gold",
			onWin: () => {
				if (isGambler) {
					player.gold += 30;
					toast.success(`The casino favors its own! +30g`);
				} else {
					player.gold += 5;
				}
			}
		},
		{
			// 11 - Chip Exchange (utility - defense)
			label: '🛡️ Trade: +5 Base Defense',
			onWin: () => {
				player.baseDefense += 5;
				toast.success(`${playerName} exchanged chips for +5 Defense!`);
			}
		},
		{
			// 12 - Hot Streak (another spin)
			label: '🔥 Hot Streak: Spin Again FREE',
			onWin: () => {
				toast.success(`${playerName} is on a hot streak!`);
				// Refund entry fee and spin again
				player.gold += CASINO_ENTRY_FEE;
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
