import { addCustomWheel, getPlayerByName } from '$lib/stores/gameStore.svelte';
import toast from 'svelte-french-toast';
import { generateLootWheel } from './lootWheel';
import { generateRandomPlayerWheel } from './randomPlayerWheel';

export function generateLoseWheel(playerName: string) {
	const player = getPlayerByName(playerName);
	if (!player) {
		toast.error(`Could not generate win wheel, Player ${playerName} not found!`);
		return;
	}
	const wheel = [
		{
			//1
			label: 'Lose 3 Base Attack',
			onWin: () => {
				if (player.baseAttack <= 3) {
					player.baseAttack = 0;
					return;
				}
				player.baseAttack -= 3;
			}
		},
		{
			//2
			label: 'Lose 3 Base Defense',
			onWin: () => {
				if (player.baseDefense <= 3) {
					player.baseDefense = 0;
					return;
				}
				player.baseDefense -= 3;
			}
		},
		{
			//3 TODO - add when shadow realm is implemented
			label: 'Go to the shadow realm',
			onWin: () => {}
		},
		{
			//4
			label: 'Lose 1 gold',
			onWin: () => (player.gold -= 1)
		},
		{
			//5
			label: 'Spin Loot Wheel',
			onWin: () => generateLootWheel(player.name)
		},
		{
			//6
			label: 'Give someone 5 HP',
			onWin: () => {
				generateRandomPlayerWheel(`${playerName} Gives 5 Hp To`, (winner) => {
					//only give as much hp as the winner can take
					let hpAmount = 5;
					if (player.hp < 5) hpAmount = player.hp;
					player.hp -= hpAmount;
					winner.hp += hpAmount;
				});
			}
		},
		{
			//7
			label: 'Lose 3 Base Attack',
			onWin: () => {
				const amount = player.baseAttack < 3 ? player.baseAttack : 3;
				player.baseAttack -= amount;
			}
		},
		{
			//8
			label: 'Lose 3 Base Defense',
			onWin: () => {
				const amount = player.baseDefense < 3 ? player.baseDefense : 3;
				player.baseAttack -= amount;
			}
		},
		{
			//9
			label: 'Lose 1 gold',
			onWin: () => (player.gold -= 1)
		},
		{
			//10
			label: 'Send Someone to the Shadow Realm'
		}
	];

	addCustomWheel(`Lose Wheel - ${player.name}`, wheel);
}
