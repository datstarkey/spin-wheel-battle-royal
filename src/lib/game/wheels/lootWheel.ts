import { addCustomWheel, getPlayerByName } from '$lib/stores/gameStore';
import { randomFromArray } from '$lib/utils/random';
import toast from 'svelte-french-toast';
import items from '../items/itemTypes';

export function generateLootWheel(playerName: string) {
	const player = getPlayerByName(playerName);
	if (!player) {
		toast.error(`Could not generate win wheel, Player ${playerName} not found!`);
		return;
	}
	const wheel = [
		{
			label: 'Get a random Consumable',
			onWin() {
				//Select all consumables that are not class locked or are locked to the players class
				const consumables = Object.values(items.consumables).filter(
					(x) => !x.classLocks || x.classLocks.includes(player.class.name)
				);

				player.gear.addConsumable(randomFromArray(consumables));
			}
		},
		{
			label: 'Get a random Helm',
			onWin() {
				//Select all helms that are not class locked or are locked to the players class
				const list = Object.values(items.helm).filter(
					(x) => !x.classLocks || x.classLocks.includes(player.class.name)
				);
				player.gear.addHelm(randomFromArray(list));
			}
		},
		{
			label: 'Get a random Chest',
			onWin() {
				//Select all helms that are not class locked or are locked to the players class
				const list = Object.values(items.chest).filter(
					(x) => !x.classLocks || x.classLocks.includes(player.class.name)
				);
				player.gear.addChest(randomFromArray(list));
			}
		},
		{
			label: 'Get a random Main Hand',
			onWin() {
				//Select all helms that are not class locked or are locked to the players class
				const list = Object.values(items.mainhand).filter(
					(x) => !x.classLocks || x.classLocks.includes(player.class.name)
				);
				player.gear.addMainHand(randomFromArray(list));
			}
		},
		{
			label: 'Get a random Off Hand',
			onWin() {
				//Select all helms that are not class locked or are locked to the players class
				const list = Object.values(items.offHand).filter(
					(x) => !x.classLocks || x.classLocks.includes(player.class.name)
				);
				player.gear.addOffHand(randomFromArray(list));
			}
		},
		{
			label: '1 Gold',
			onWin() {
				player.gold += 1;
			}
		},
		{
			label: '1 Gold',
			onWin() {
				player.gold += 1;
			}
		},
		{
			label: '3 Gold',
			onWin() {
				player.gold += 3;
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
		}
	];

	addCustomWheel(`Loot Wheel for ${player.name}`, wheel);
}
