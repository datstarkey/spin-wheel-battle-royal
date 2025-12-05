import { addAuditTrail, addCustomWheel } from '$lib/stores/gameStore.svelte';
import type { Player } from '../player/player.svelte';
import type { WheelBase } from '../wheels/wheels';
import type { ClassBase } from './classType';

const poopMasterMultiplier = 'PoopReduction';
const poopMasterMultiplierValue = 0.8;

// Resource key for tracking destroyed items
export const POOP_PILE_RESOURCE = 'PoopPile';

// Helper to increment poop pile
function addToPoopPile(player: Player, amount: number = 1) {
	player.resources[POOP_PILE_RESOURCE] ??= 0;
	player.resources[POOP_PILE_RESOURCE] += amount;
	addAuditTrail(
		`${player.name}'s Poop Pile grows to ${player.resources[POOP_PILE_RESOURCE]}! (+${amount * 2} ATK)`
	);
}

export const Poopmaster: ClassBase = {
	hp: 100,
	attack: 8,
	defense: 10,
	name: 'PoopMaster',
	description:
		'A chaotic disruptor who destroys enemy items. Gets +2 ATK for each item destroyed (Poop Pile). Reduces attacker damage by 20%.',
	onWinAbility: 'Shit on one of their items (or steal gold if they have none)',
	attackRange: 1,

	// Passive: +2 ATK per item destroyed
	getBonusAttack(player) {
		const poopPile = player.resources[POOP_PILE_RESOURCE] ?? 0;
		return poopPile * 2;
	},

	onAttackWin(player, defendingPlayer) {
		const wheelItems: WheelBase = [];

		if (defendingPlayer.gear.mainHand) {
			wheelItems.push({
				label: defendingPlayer.gear.mainHand,
				onWin() {
					addAuditTrail(
						`${player.name} has shit on ${defendingPlayer.name}'s ${defendingPlayer.gear.mainHand}!`
					);
					defendingPlayer.gear.deleteItem('mainhand');
					addToPoopPile(player);
				}
			});
		}

		if (defendingPlayer.gear.offHand) {
			wheelItems.push({
				label: defendingPlayer.gear.offHand,
				onWin() {
					addAuditTrail(
						`${player.name} has shit on ${defendingPlayer.name}'s ${defendingPlayer.gear.offHand}!`
					);
					defendingPlayer.gear.deleteItem('offHand');
					addToPoopPile(player);
				}
			});
		}

		if (defendingPlayer.gear.chest) {
			wheelItems.push({
				label: defendingPlayer.gear.chest,
				onWin() {
					addAuditTrail(
						`${player.name} has shit on ${defendingPlayer.name}'s ${defendingPlayer.gear.chest}!`
					);
					defendingPlayer.gear.deleteItem('chest');
					addToPoopPile(player);
				}
			});
		}

		if (defendingPlayer.gear.helm) {
			wheelItems.push({
				label: defendingPlayer.gear.helm,
				onWin() {
					addAuditTrail(
						`${player.name} has shit on ${defendingPlayer.name}'s ${defendingPlayer.gear.helm}!`
					);
					defendingPlayer.gear.deleteItem('helm');
					addToPoopPile(player);
				}
			});
		}

		if (wheelItems.length) {
			const wheel = wheelItems.concat(
				defendingPlayer.gear.consumables.map((x, index) => {
					return {
						label: x,
						onWin() {
							addAuditTrail(`${player.name} has shit on ${defendingPlayer.name}'s ${x}!`);
							defendingPlayer.gear.deleteItem('consumables', index);
							addToPoopPile(player);
						}
					};
				})
			);

			addCustomWheel(`${player.name}'s Poop Wheel`, wheel);
		} else {
			// Fallback: If enemy has no items, steal some gold instead
			const stolenGold = Math.min(5, defendingPlayer.gold);
			if (stolenGold > 0) {
				defendingPlayer.gold -= stolenGold;
				player.gold += stolenGold;
				addAuditTrail(
					`${defendingPlayer.name} has no items to shit on! ${player.name} steals ${stolenGold} gold instead.`
				);
			} else {
				// Enemy is broke AND has no items - pity bonus
				addToPoopPile(player);
				addAuditTrail(
					`${defendingPlayer.name} is completely destitute! ${player.name} gains pity poop.`
				);
			}
		}
	},

	onDefenseStart(_player, attackingPlayer) {
		attackingPlayer.attackMultipliers[poopMasterMultiplier] = poopMasterMultiplierValue;
	},

	onDefenseEnd(_player, attackingPlayer) {
		delete attackingPlayer.attackMultipliers[poopMasterMultiplier];
	}
};
