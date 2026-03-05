import { getServerGameContext } from '$lib/game/serverContext';
import type { Player } from '../player/player.svelte';
import { addResource } from '../player/playerResources';
import type { WheelBase } from '../wheels/wheels';
import type { ClassBase } from './classType';

export const Swenergy = 'Swenergy';

export const Swe: ClassBase = {
	hp: 100,
	attack: 15,
	defense: 15,
	attackRange: 1,
	name: 'Swe',
	icon: '/Classes/Swe.svg',
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

		getServerGameContext().addCustomWheel(`Swenergy for ${player.name}`, wheel);
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
	const value = addResource(player, Swenergy, amount, 0, 10);

	//if we hit 10, add swesupreme status
	if (value >= 10) {
		player.statuses.addStatus('Swesupreme');
	}
}

function reduceSwenergy(player: Player, amount: number) {
	const value = addResource(player, Swenergy, -amount, 0, 10);

	//if we hit 0, remove swesupreme status
	if (value <= 0 && player.statuses.hasStatus('Swesupreme')) {
		player.statuses.removeStatus('Swesupreme');
	}
}
