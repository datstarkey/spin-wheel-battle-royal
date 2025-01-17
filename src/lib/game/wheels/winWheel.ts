import { addCustomWheel, currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
import toast from 'svelte-french-toast';
import { generateLootWheel } from './lootWheel';
import { generateRandomPlayerWheel } from './randomPlayerWheel';

export function generateWinWheel(playerName: string) {
	const player = getPlayerByName(playerName);
	if (!player) {
		toast.error(`Could not generate win wheel, Player ${playerName} not found!`);
		return;
	}
	const wheel = [
		{
			//1
			label: 'Gain 6 Base Attack',
			onWin: () => (player.baseAttack += 6)
		},
		{
			//2
			label: 'Gain 6 Base Defense',
			onWin: () => (player.baseDefense += 6)
		},
		{
			//3
			label: 'Gain 10 Hp',
			onWin: () => (player.hp += 10)
		},
		{
			//4
			label: 'Gain 3 Gold',
			onWin: () => (player.gold += 3)
		},
		//Todo - add when turn system is implemented
		{
			//5
			label: 'Take another turn',
			onWin: () => currentGame.value?.startTurn()
		},
		{
			//6
			label: 'Spin Loot Wheel',
			onWin: () => generateLootWheel(player.name)
		},
		{
			//7
			label: 'Gain 6 Base Attack',
			onWin: () => (player.baseAttack += 6)
		},
		{
			//8
			label: 'Gain 6 Base Defense',
			onWin: () => (player.baseDefense += 6)
		},
		{
			//9
			label: 'Gain 10 Hp',
			onWin: () => (player.hp += 10)
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
		}
	];

	addCustomWheel(`Win Wheel - ${player.name}`, wheel);
}
