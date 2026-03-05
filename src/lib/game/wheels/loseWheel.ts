import toast from '$lib/stores/toaster.svelte';
import { requirePlayer, type GameContext } from '../gameContext';
import { generateGamblerWheel } from './gamblerWheel';
import { generateLootWheel } from './lootWheel';
import { generateRandomPlayerWheel } from './randomPlayerWheel';

export function generateLoseWheel(playerName: string, ctx: GameContext) {
	const player = requirePlayer(ctx, playerName, 'lose wheel');
	if (!player || player.dead) return;

	const globalHpValue = ctx.getGlobalHpReduction() * 15;
	const wheel = [
		{
			//1
			label: 'Lose 3 Base Attack',
			onWin: () => {
				player.baseAttack -= 3;
			}
		},
		{
			//2
			label: 'Lose 3 Base Defense',
			onWin: () => {
				player.baseDefense -= 3;
			}
		},
		{
			//3
			label: 'Go to the shadow realm',
			onWin: () => {
				player.inShadowRealm = true;
				ctx.addAuditTrail(`${player.name} was sent to the Shadow Realm!`);
			}
		},
		{
			//4
			label: 'Lose 1 gold',
			onWin: () => {
				player.gold -= 1;
			}
		},
		{
			//5
			label: 'Spin Loot Wheel',
			onWin: () => generateLootWheel(player.name, ctx)
		},
		{
			//6
			label: 'Give someone HP',
			onWin: () => {
				toast.success(`${playerName} Must spin again`);
				generateRandomPlayerWheel(
					`${playerName} Gives ${globalHpValue} Hp To`,
					(winner) => {
						const hpAmount = Math.min(player.hp, globalHpValue);
						ctx.addAuditTrail(`${player.name} transfers ${hpAmount} HP to ${winner.name}`);
						player.hp -= hpAmount;
						winner.hp += hpAmount;
					},
					ctx
				);
			}
		},
		{
			//7
			label: 'Lose 3 Base Attack',
			onWin: () => {
				player.baseAttack -= 3;
			}
		},
		{
			//8
			label: 'Lose 3 Base Defense',
			onWin: () => {
				player.baseDefense -= 3;
			}
		},
		{
			//9
			label: 'Lose 1 gold',
			onWin: () => {
				player.gold -= 1;
			}
		},
		{
			//10
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
		},
		{
			label: 'Emotional damage',
			onWin: () => {
				player.statuses.addStatus('EmotionalDamage');
				ctx.addAuditTrail(`${player.name} suffered Emotional Damage!`);
			}
		}
	];
	if (player.classType == 'gambler') generateGamblerWheel(player.name, ctx);
	else ctx.addCustomWheel(`Lose Wheel - ${player.name}`, wheel, 'lose');
}
