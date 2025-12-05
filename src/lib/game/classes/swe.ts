import { addCustomWheel } from '$lib/stores/gameStore.svelte';
import type { Player } from '../player/player.svelte';
import type { WheelBase } from '../wheels/wheels';
import type { ClassBase } from './classType';

export const Swenergy = 'Swenergy';

export const Swe: ClassBase = {
	hp: 100,
	attack: 15,
	defense: 15,
	attackRange: 1,
	name: 'Swe',
	description: 'Masters of Swenergy, gaining and utilizing it to become the Swe Supreme.',
	onWinAbility: 'Generate Swesupreme energy (spin swheel)',
	onAttackWin(player) {
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

	onTurnStart(player) {
		if (!player.statuses.hasStatus('Swesupreme')) {
			increaseSwenergy(player, 1);
		}
	},

	onTurnEnd(player) {
		if (player.statuses.hasStatus('Swesupreme')) {
			reduceSwenergy(player, 2);
		}
	}
};

function increaseSwenergy(player: Player, amount: number) {
	player.resources[Swenergy] ??= 0;
	player.resources[Swenergy] += amount;

	//if we go above 10, set to 10 and add swesupreme status
	if (player.resources[Swenergy] >= 10) {
		player.resources[Swenergy] = 10;
		player.statuses.addStatus('Swesupreme');
	}
}

function reduceSwenergy(player: Player, amount: number) {
	player.resources[Swenergy] ??= 0;
	player.resources[Swenergy] -= amount;

	//if we go below 0, set to zero and remove swesupreme status
	if (player.resources[Swenergy] <= 0) {
		player.resources[Swenergy] = 0;
		if (player.statuses.hasStatus('Swesupreme')) {
			player.statuses.removeStatus('Swesupreme');
		}
	}
}
