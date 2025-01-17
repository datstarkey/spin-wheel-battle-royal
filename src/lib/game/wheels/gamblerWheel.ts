import { addCustomWheel, currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
import toast from 'svelte-french-toast';
import { generateLootWheel } from './lootWheel';
import { generateRandomPlayerWheel } from './randomPlayerWheel';

export function generateGamblerWheel(playerName: string) {
	const player = getPlayerByName(playerName);
	if (!player) {
		toast.error(`Could not generate win wheel, Player ${playerName} not found!`);
		return;
	}

	if (player.dead) return;

	const globalHpValue = currentGame.value?.globalHpReduction ?? 1;
	const wheel = [
		{
			//1
			label: 'Gain 15 Base Attack',
			onWin: () => (player.baseAttack += 15)
		},
		{
			//9
			label: `Spin Loot Wheel Twice`,
			onWin: () => {
				generateLootWheel(player.name, 1);
				generateLootWheel(player.name, 2);
			}
		},
		{
			//2
			label: 'Lose 7 Base Defense',
			onWin: () => (player.baseDefense -= 7)
		},
		{
			//3
			label: `Gain 15 Base Defense`,
			onWin: () => (player.baseDefense += 15)
		},
		{
			//4
			label: 'Lose 7 Base Defense',
			onWin: () => (player.baseDefense -= 7)
		},
		{
			//5
			label: `Gain ${globalHpValue * 30} Hp`,
			onWin: () => (player.hp += globalHpValue * 30)
		},
		{
			//6
			label: `Lose ${globalHpValue * 15} Hp`,
			onWin: () => (player.hp -= globalHpValue * 15)
		},

		{
			//8
			label: 'Skip Next Turn',
			onWin: () => currentGame?.value?.skipNextTurn(player)
		},
		{
			//9
			label: `Spin Loot Wheel Twice`,
			onWin: () => {
				generateLootWheel(player.name, 1);
				generateLootWheel(player.name, 2);
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
		}
	];

	addCustomWheel(`Gambler Wheel - ${player.name}`, wheel);
}
