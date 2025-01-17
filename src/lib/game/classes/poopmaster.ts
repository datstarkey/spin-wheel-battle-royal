import { addCustomWheel } from '$lib/stores/gameStore.svelte';
import type { WheelBase } from '../wheels/wheels';
import type { ClassBase } from './classType';

export const Poopmaster: ClassBase = {
	hp: 10,
	attack: 8,
	defense: 12,
	name: 'PoopMaster',
	onWinAbility: 'Shit on one of their items deleting it',
	attackRange: 1,

	//Refactor this at some point when im not lazy
	onAttackWin(player, attackingPlayer) {
		const wheelItems: WheelBase = [];
		if (attackingPlayer.gear.mainHand) {
			wheelItems.push({
				label: attackingPlayer.gear.mainHand,
				onWin() {
					attackingPlayer.gear.deleteItem('mainhand');
				}
			});
		}

		if (attackingPlayer.gear.offHand) {
			wheelItems.push({
				label: attackingPlayer.gear.offHand,
				onWin() {
					attackingPlayer.gear.deleteItem('offHand');
				}
			});
		}

		if (attackingPlayer.gear.chest) {
			wheelItems.push({
				label: attackingPlayer.gear.chest,
				onWin() {
					attackingPlayer.gear.deleteItem('chest');
				}
			});
		}

		if (attackingPlayer.gear.helm) {
			wheelItems.push({
				label: attackingPlayer.gear.helm,
				onWin() {
					attackingPlayer.gear.deleteItem('helm');
				}
			});
		}

		const wheel = wheelItems.concat(
			attackingPlayer.gear.consumables.map((x, index) => {
				return {
					label: x,
					onWin() {
						attackingPlayer.gear.deleteItem('consumables', index);
					}
				};
			})
		);

		addCustomWheel(`${player.name} poopmaster wheel`, wheel);
	}
};
