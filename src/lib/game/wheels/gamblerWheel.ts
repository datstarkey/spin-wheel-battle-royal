import { incrementLuckyStreak, resetLuckyStreak } from '../classes/gambler';
import { requirePlayer, type GameContext } from '../gameContext';
import { generateLootWheel } from './lootWheel';
import { generateRandomPlayerWheel } from './randomPlayerWheel';

export function generateGamblerWheel(playerName: string, ctx: GameContext) {
	const player = requirePlayer(ctx, playerName, 'gambler wheel');
	if (!player || player.dead) return;

	const globalHpValue = ctx.getGlobalHpReduction();
	const wheel = [
		{
			// POSITIVE: +15 Base Attack
			label: 'Gain 15 Base Attack',
			onWin: () => {
				player.baseAttack += 15;
				ctx.addAuditTrail(`${playerName} gained 15 Base Attack!`);
				incrementLuckyStreak(player);
			}
		},
		{
			// POSITIVE: Spin Loot Wheel Twice (weight 2 for better odds)
			label: 'Spin Loot Wheel Twice',
			weight: 2,
			onWin: () => {
				ctx.addAuditTrail(`${playerName} gets to spin the Loot Wheel twice!`);
				generateLootWheel(player.name, ctx, 1);
				generateLootWheel(player.name, ctx, 2);
				incrementLuckyStreak(player);
			}
		},
		{
			// NEGATIVE: Lose 7 Base Defense
			label: 'Lose 7 Base Defense',
			onWin: () => {
				player.baseDefense -= 7;
				ctx.addAuditTrail(`${playerName} lost 7 Base Defense`);
				resetLuckyStreak(player);
			}
		},
		{
			// POSITIVE: +15 Base Defense
			label: 'Gain 15 Base Defense',
			onWin: () => {
				player.baseDefense += 15;
				ctx.addAuditTrail(`${playerName} gained 15 Base Defense!`);
				incrementLuckyStreak(player);
			}
		},
		{
			// NEGATIVE: Lose 7 Base Attack
			label: 'Lose 7 Base Attack',
			onWin: () => {
				player.baseAttack -= 7;
				ctx.addAuditTrail(`${playerName} lost 7 Base Attack`);
				resetLuckyStreak(player);
			}
		},
		{
			// POSITIVE: Gain HP
			label: `Gain ${globalHpValue * 30} Gold/HP`,
			onWin: () => {
				player.gold += globalHpValue * 30;
				ctx.addAuditTrail(`${playerName} gained ${globalHpValue * 30} Gold!`);
				incrementLuckyStreak(player);
			}
		},
		{
			// NEGATIVE: Lose HP
			label: `Lose ${globalHpValue * 15} Gold/HP`,
			onWin: () => {
				player.gold -= globalHpValue * 15;
				ctx.addAuditTrail(`${playerName} lost ${globalHpValue * 15} Gold`);
				resetLuckyStreak(player);
			}
		},
		{
			// NEGATIVE: Skip Next Turn
			label: 'Skip Next Turn',
			onWin: () => {
				ctx.addAuditTrail(`${playerName} must skip their next turn!`);
				ctx.skipNextTurn(player);
				resetLuckyStreak(player);
			}
		},
		{
			// POSITIVE: Send someone to Shadow Realm
			label: 'Send Someone to Shadow Realm',
			onWin: () => {
				ctx.addAuditTrail(`${playerName} sends someone to the Shadow Realm!`);
				generateRandomPlayerWheel(
					`${playerName} Sends to Shadow Realm`,
					(winner) => {
						ctx.banishToShadowRealm(winner, `${winner.name} was sent to the Shadow Realm!`);
					},
					ctx
				);
				incrementLuckyStreak(player);
			}
		},
		{
			// POSITIVE: Double or Nothing (risky but positive EV)
			label: 'Double or Nothing (+25g or 0)',
			onWin: () => {
				const roll = Math.random();
				if (roll >= 0.5) {
					player.gold += 25;
					ctx.addAuditTrail(`${playerName} won Double or Nothing! +25g`);
					incrementLuckyStreak(player, 2); // Big win = double streak
				} else {
					ctx.addAuditTrail(`${playerName} got nothing on Double or Nothing`);
					// No streak change - neutral outcome
				}
			}
		},
		{
			// MEGA POSITIVE: Lucky 7 Jackpot
			label: 'Lucky 7 Jackpot! (+50g)',
			onWin: () => {
				player.gold += 50;
				ctx.addAuditTrail(`${playerName} hit the Lucky 7 Jackpot! +50g!`);
				incrementLuckyStreak(player, 3); // Jackpot = triple streak!
			}
		}
	];

	ctx.addCustomWheel(`Gambler Wheel - ${player.name} - ${Date.now()}`, wheel, 'gambler');
}
