import { addCustomWheel, currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
import toast from 'svelte-french-toast';
import { generateGamblerWheel } from './gamblerWheel';
import { generateLootWheel } from './lootWheel';
import { generateRandomPlayerWheel } from './randomPlayerWheel';

export function generateLoseWheel(playerName: string) {
	const player = getPlayerByName(playerName);
	if (!player) {
		toast.error(`Could not generate win wheel, Player ${playerName} not found!`);
		return;
	}

	if (player.dead) return;

	const globalHpValue = (currentGame.value?.globalHpReduction ?? 1) * 15;
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
			//3 TODO - add when shadow realm is implemented
			label: 'Go to the shadow realm',
			onWin: () => {
				player.inShadowRealm = true;
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
			onWin: () => generateLootWheel(player.name)
		},
		{
			//6
			label: 'Give someone HP',
			onWin: () => {
				toast.success(`${playerName} Must spin again`);
				generateRandomPlayerWheel(`${playerName} Gives ${globalHpValue} Hp To`, (winner) => {
					let hpAmount = Math.min(player.hp, globalHpValue);
					player.hp -= hpAmount;
					winner.hp += hpAmount;
				});
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
				generateRandomPlayerWheel(`${playerName} Sends to Shadow Realm`, (winner) => {
					winner.inShadowRealm = true;
				});
			}
		},
		{
			label: 'Emotional damage',
			onWin: () => {
					player.statuses.addStatus('EmotionalDamage');
				}
		},
	];
	if (player.classType == 'gambler') generateGamblerWheel(player.name);
	else addCustomWheel(`Lose Wheel - ${player.name}`, wheel);
}
