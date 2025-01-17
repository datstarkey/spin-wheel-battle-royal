import { addAuditTrail, addCustomWheel } from '$lib/stores/gameStore.svelte';
import type { WheelBase } from '../wheels/wheels';
import type { ClassBase } from './classType';

const poopMasterMultiplier = 'PoopReduction';
const poopMasterMultiplierValue = 0.8;
export const Poopmaster: ClassBase = {
	hp: 100,
	attack: 8,
	defense: 10,
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
					addAuditTrail(
						`${player.name} has shit on ${attackingPlayer.name} ${attackingPlayer.gear.mainHand}!`
					);
					attackingPlayer.gear.deleteItem('mainhand');
				}
			});
		}

		if (attackingPlayer.gear.offHand) {
			wheelItems.push({
				label: attackingPlayer.gear.offHand,
				onWin() {
					addAuditTrail(
						`${player.name} has shit on ${attackingPlayer.name} ${attackingPlayer.gear.offHand}!`
					);
					attackingPlayer.gear.deleteItem('offHand');
				}
			});
		}

		if (attackingPlayer.gear.chest) {
			wheelItems.push({
				label: attackingPlayer.gear.chest,
				onWin() {
					addAuditTrail(
						`${player.name} has shit on ${attackingPlayer.name} ${attackingPlayer.gear.chest}!`
					);
					attackingPlayer.gear.deleteItem('chest');
				}
			});
		}

		if (attackingPlayer.gear.helm) {
			wheelItems.push({
				label: attackingPlayer.gear.helm,
				onWin() {
					addAuditTrail(
						`${player.name} has shit on ${attackingPlayer.name} ${attackingPlayer.gear.helm}!`
					);
					attackingPlayer.gear.deleteItem('helm');
				}
			});
		}

		if (wheelItems.length) {
			const wheel = wheelItems.concat(
				attackingPlayer.gear.consumables.map((x, index) => {
					return {
						label: x,
						onWin() {
							addAuditTrail(`${player.name} has shit on their ${x}!`);
							attackingPlayer.gear.deleteItem('consumables', index);
						}
					};
				})
			);

			addCustomWheel(`${player.name} poopmaster wheel`, wheel);
		} else {
			addAuditTrail(`${player.name} has no items to shit on!`);
		}
	},
	onDefenseStart(player, attackingPlayer) {
		attackingPlayer.attackMultipliers[poopMasterMultiplier] = poopMasterMultiplierValue;
	},
	onDefenseEnd(player, attackingPlayer) {
		delete attackingPlayer.attackMultipliers[poopMasterMultiplier];
	}
};
