import toast from 'svelte-french-toast';
import type { Player } from '../player/player.svelte';
import type { WheelBase } from '../wheels/wheels';
import type { ClassBase } from './classType';
import { addCustomWheel } from '$lib/stores/gameStore.svelte';

export const Swe: ClassBase = {
	hp: 10,
	attack: 10,
	defense: 10,
	attackRange: 1,
	name: 'Swe',
	onWinAbility: 'Generate Swesupreme energy (spin swheel)',
	onWin(player) {
		const wheel: WheelBase = [];
		for (let index = 1; index < 10; index++) {
			wheel.push({
				label: `Gain ${index} Swenergy`,
				onWin() {
					increaseSwenergy(player, index);
				}
			});
		}
		wheel.push({
			label: 'Become the Swe Supreme',
			onWin() {
				increaseSwenergy(player, 10);
			}
		});

		addCustomWheel(`Swenergy for ${player.name}`, wheel);
	},

	onTurnEnd(player) {
		if (player.statuses.hasStatus("swesupreme")){
			reduceSwenergy(player, -4);
		}
		
		
	}
};

function increaseSwenergy(player: Player, amount: number) {
	player.resources['swenergy'] ??= 0;
	player.resources['swenergy'] += amount;

	//if we go above 10, set to 10 and add swesupreme status
	if (player.resources['swenergy'] >= 10) {
		toast.success(`${player.name} is now the Swe Supreme!`);
		player.statuses.addStatus('swesupreme');
	}
}

function reduceSwenergy(player: Player, amount: number) {
	player.resources['swenergy'] ??= 0;
	player.resources['swenergy'] -= amount;

	//if we go below 0, set to zero and remove swesupreme status
	if (player.resources['swenergy'] <= 0) {
		player.resources['swenergy'] = 0;
		if (player.statuses.hasStatus('swesupreme')) {
			toast.error(`${player.name} is no longer the Swe Supreme!`);
			player.statuses.removeStatus('swesupreme');
		}
	}
}
