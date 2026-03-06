import { requirePlayer, type GameContext } from '../gameContext';
import { generateGamblerWheel } from './gamblerWheel';
import { generateLootWheel } from './lootWheel';
import { createBanishToShadowRealmItem } from './wheelHelpers';

export function generateWinWheel(playerName: string, ctx: GameContext) {
	const player = requirePlayer(ctx, playerName, 'win wheel');
	if (!player || player.dead) return;

	const wheel = [
		{
			label: 'Gain 6 Base Attack',
			weight: 2,
			onWin: () => {
				player.baseAttack += 6;
			}
		},
		{
			label: 'Gain 6 Base Defense',
			weight: 2,
			onWin: () => {
				player.baseDefense += 6;
			}
		},
		{
			label: 'Gain 10 Hp',
			weight: 2,
			onWin: () => {
				player.hp += 10;
			}
		},
		{
			label: 'Gain 10 Gold',
			weight: 2,
			onWin: () => {
				player.gold += 10;
			}
		},
		{
			label: 'Take another turn',
			onWin: () => ctx.gainAnotherTurn()
		},
		{
			label: 'Spin Loot Wheel',
			onWin: () => generateLootWheel(player.name, ctx)
		},
		createBanishToShadowRealmItem(player, ctx)
	];

	if (player.classType == 'gambler') generateGamblerWheel(player.name, ctx);
	else ctx.addCustomWheel(`Win Wheel - ${player.name} - ${Date.now()}`, wheel, 'win');
}
