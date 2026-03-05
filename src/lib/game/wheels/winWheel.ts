import toast from '$lib/stores/toaster.svelte';
import { requirePlayer, type GameContext } from '../gameContext';
import { generateGamblerWheel } from './gamblerWheel';
import { generateLootWheel } from './lootWheel';
import { generateRandomPlayerWheel } from './randomPlayerWheel';

export function generateWinWheel(playerName: string, ctx: GameContext) {
	const player = requirePlayer(ctx, playerName, 'win wheel');
	if (!player || player.dead) return;

	const wheel = [
		{
			//1
			label: 'Gain 6 Base Attack',
			onWin: () => {
				player.baseAttack += 6;
			}
		},
		{
			//2
			label: 'Gain 6 Base Defense',
			onWin: () => {
				player.baseDefense += 6;
			}
		},
		{
			//3
			label: `Gain 10 Hp`,
			onWin: () => {
				player.hp += 10;
			}
		},
		{
			//4
			label: 'Gain 10 Gold',
			onWin: () => {
				player.gold += 10;
			}
		},
		{
			//5
			label: 'Take another turn',
			onWin: () => ctx.gainAnotherTurn()
		},
		{
			//6
			label: 'Spin Loot Wheel',
			onWin: () => generateLootWheel(player.name, ctx)
		},
		{
			//7
			label: 'Gain 6 Base Attack',
			onWin: () => {
				player.baseAttack += 6;
			}
		},
		{
			//8
			label: 'Gain 6 Base Defense',
			onWin: () => {
				player.baseDefense += 6;
			}
		},
		{
			//9
			label: `Gain 10 Hp`,
			onWin: () => {
				player.hp += 10;
			}
		},
		{
			//10
			label: 'Gain 10 Gold',
			onWin: () => {
				player.gold += 10;
			}
		},
		{
			//11
			label: 'Send Someone to the Shadow Realm',
			onWin: () => {
				toast.success(`${playerName} Must spin again`);
				generateRandomPlayerWheel(
					`${playerName} Sends to Shadow Realm`,
					(winner) => {
						winner.inShadowRealm = true;
						ctx.addAuditTrail(`${player.name} banished ${winner.name} to the Shadow Realm!`);
					},
					ctx
				);
			}
		}
	];

	if (player.classType == 'gambler') generateGamblerWheel(player.name, ctx);
	else ctx.addCustomWheel(`Win Wheel - ${player.name} - ${Date.now()}`, wheel, 'win');
}
