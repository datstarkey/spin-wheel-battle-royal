import { addCustomWheel, getPlayerByName } from '$lib/stores/gameStore.svelte';
import { randomFromArray } from '$lib/utils/random';
import toast from 'svelte-french-toast';
import items from '../items/itemTypes';

export function generateLootWheel(playerName: string, index: number = 1) {
	const player = getPlayerByName(playerName);
	if (!player) {
		toast.error(`Could not generate win wheel, Player ${playerName} not found!`);
		return;
	}

	if (player.dead) return;

	const wheel = [
		{
			label: 'Get a random Consumable',
			onWin() {
				//Select all consumables that are not class locked or are locked to the players class
				const consumables = Object.entries(items.consumables)
					.filter((x) => !x[1].classLocks || x[1].classLocks.includes(player.classType))
					.map((x) => x[0]);

				player.assignItem(randomFromArray(consumables));
			}
		},
		{
			label: 'Get a random Helm',
			onWin() {
				//Select all helms that are not class locked or are locked to the players class
				const list = Object.entries(items.helm)
					.filter((x) => !x[1].classLocks || x[1].classLocks.includes(player.classType))
					.map((x) => x[0]);
				player.assignItem(randomFromArray(list));
			}
		},
		{
			label: 'Get a random Chest',
			onWin() {
				//Select all helms that are not class locked or are locked to the players class
				const list = Object.entries(items.chest)
					.filter((x) => !x[1].classLocks || x[1].classLocks.includes(player.classType))
					.map((x) => x[0]);

				player.assignItem(randomFromArray(list));
			}
		},
		{
			label: 'Get a random Main Hand',
			onWin() {
				//Select all helms that are not class locked or are locked to the players class
				const list = Object.entries(items.mainhand)
					.filter((x) => !x[1].classLocks || x[1].classLocks.includes(player.classType))
					.map((x) => x[0]);
				player.assignItem(randomFromArray(list));
			}
		},
		{
			label: 'Get a random Off Hand',
			onWin() {
				//Select all helms that are not class locked or are locked to the players class
				const list = Object.entries(items.offHand)
					.filter((x) => !x[1].classLocks || x[1].classLocks.includes(player.classType))
					.map((x) => x[0]);
				player.assignItem(randomFromArray(list));
			}
		},
		{
			label: '5 Gold',
			onWin() {
				player.gold += 5;
			}
		},
		{
			label: '5 Gold',
			onWin() {
				player.gold += 5;
			}
		},
		{
			label: '10 Gold',
			onWin() {
				player.gold += 10;
			}
		},
		{
			label: '10 Gold',
			onWin() {
				player.gold += 10;
			}
		},
		{
			label: '20 Gold',
			onWin() {
				player.gold += 20;
			}
		}
	];

	addCustomWheel(`Loot Wheel for ${player.name} - ${index}`, wheel);
}
