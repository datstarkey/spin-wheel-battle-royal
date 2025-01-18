import { hasPlayerAttacked } from '$lib/components/game/AttackPlayer.svelte';
import { addCustomWheel, getPlayerByName } from '$lib/stores/gameStore.svelte';
import toast from 'svelte-french-toast';
import { generateLootWheel } from './lootWheel';
import type { WheelBase } from './wheels';

export function generateButtonWheel(playerName: string) {
	const player = getPlayerByName(playerName);

	if (!player) {
		toast.error(`Could not generate win wheel, Player ${playerName} not found!`);
		return;
	}

	if (player.dead) return;

	const wheel: WheelBase = [
		{
			label: 'Rotate Players Clockwise',
			onWin: () => {}
		},
		{
			label: 'Rotate Players Counter-Clockwise',
			onWin: () => {}
		},
		{
			label: 'Attack Someone',
			onWin: () => {
				hasPlayerAttacked.value = false;
			}
		},
		{
			label: 'Spin Loot Wheel',
			onWin: () => {
				generateLootWheel(playerName);
			}
		},
		{
			label: 'Spin 2 Loot Wheels',
			onWin: () => {
				generateLootWheel(playerName);
				generateLootWheel(playerName, 2);
			}
		},
		{
			label: 'Spin 3 Loot Wheels',
			onWin: () => {
				generateLootWheel(playerName);
				generateLootWheel(playerName, 2);
				generateLootWheel(playerName, 3);
			}
		},
		{
			label: 'Spin 4 Loot Wheels',
			onWin: () => {
				generateLootWheel(playerName);
				generateLootWheel(playerName, 2);
				generateLootWheel(playerName, 3);
				generateLootWheel(playerName, 4);
			}
		},
		{
			label: 'Gain 5 Base Attack, Base Defense, HP and Gold',
			onWin: () => {
				player.baseAttack += 5;
				player.baseDefense += 5;
				player.hp += 5;
				player.gold += 5;
			}
		},
		{
			label: 'Gain 10 gold',
			onWin: () => {
				player.gold += 10;
			}
		}
	];

	addCustomWheel(`${player.name} Button Wheel`, wheel);
}
