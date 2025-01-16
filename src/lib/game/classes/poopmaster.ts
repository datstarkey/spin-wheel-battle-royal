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
	onWin(player, attackingPlayer) {
		const wheelItems: WheelBase = [];
		if (attackingPlayer.gear.mainHand) {
			wheelItems.push({
				label: attackingPlayer.gear.mainHand.name,
				onWin() {
					attackingPlayer.gear.deleteItem(attackingPlayer.gear.mainHand!, 'mainhand');
				}
			});
		}

		if (attackingPlayer.gear.offHand) {
			wheelItems.push({
				label: attackingPlayer.gear.offHand.name,
				onWin() {
					attackingPlayer.gear.deleteItem(attackingPlayer.gear.offHand!, 'offHand');
				}
			});
		}

		if (attackingPlayer.gear.chest) {
			wheelItems.push({
				label: attackingPlayer.gear.chest.name,
				onWin() {
					attackingPlayer.gear.deleteItem(attackingPlayer.gear.chest!, 'chest');
				}
			});
		}

		if (attackingPlayer.gear.helm) {
			wheelItems.push({
				label: attackingPlayer.gear.helm.name,
				onWin() {
					attackingPlayer.gear.deleteItem(attackingPlayer.gear.helm!, 'helm');
				}
			});
		}

		const wheel = wheelItems.concat(
			attackingPlayer.gear.consumables.map((x) => {
				return {
					label: x.name,
					onWin() {
						attackingPlayer.gear.deleteItem(x, 'consumables');
					}
				};
			})
		);

		addCustomWheel(`${player.name} poopmaster wheel`, wheel);
	}
};
