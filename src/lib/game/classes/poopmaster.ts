import type { GameContext } from '../gameContext';
import type { Player } from '../player/player.svelte';
import { addResource, getResource } from '../player/playerResources';
import type { WheelBase } from '../wheels/wheels';
import type { ClassBase } from './classType';

const poopMasterMultiplier = 'PoopReduction';
const poopMasterMultiplierValue = 0.8;

// Resource key for tracking destroyed items
export const POOP_PILE_RESOURCE = 'PoopPile';

// Helper to increment poop pile
function addToPoopPile(player: Player, amount: number = 1) {
	const total = addResource(player, POOP_PILE_RESOURCE, amount);
	player.game?.addAuditTrail(`${player.name}'s Poop Pile grows to ${total}! (+${amount * 2} ATK)`);
}

export const Poopmaster: ClassBase = {
	hp: 100,
	attack: 8,
	defense: 10,
	name: 'PoopMaster',
	icon: '/Classes/Poopmaster.svg',
	description:
		'A chaotic disruptor who destroys enemy items. Gets +2 ATK for each item destroyed (Poop Pile). Reduces attacker damage by 20%. Destroys items on ANY combat win!',
	onWinAbility: 'Shit on one of their items (attack or defend win)',
	attackRange: 1,

	// Passive: +2 ATK per item destroyed
	getBonusAttack(player) {
		return getResource(player, POOP_PILE_RESOURCE) * 2;
	},

	onAttackWin(player, defendingPlayer, ctx) {
		buildItemDestructionWheel(player, defendingPlayer, 'has shit on', 'Poop Wheel', ctx);
	},

	onDefenseStart(_player, attackingPlayer, _ctx) {
		attackingPlayer.attackMultipliers[poopMasterMultiplier] = poopMasterMultiplierValue;
	},

	onDefenseEnd(_player, attackingPlayer, _ctx) {
		delete attackingPlayer.attackMultipliers[poopMasterMultiplier];
	},

	onDefendWin(player, attackingPlayer, ctx) {
		buildItemDestructionWheel(
			player,
			attackingPlayer,
			'revenge-poops on',
			'Revenge Poop Wheel',
			ctx
		);
	}
};

function buildItemDestructionWheel(
	pooper: Player,
	target: Player,
	verb: string,
	wheelName: string,
	ctx: GameContext
) {
	const wheelItems: WheelBase = [];
	const slots = ['mainHand', 'offHand', 'chest', 'helm'] as const;
	const deleteSlots = ['mainhand', 'offHand', 'chest', 'helm'] as const;

	for (let i = 0; i < slots.length; i++) {
		const itemName = target.gear[slots[i]];
		if (itemName) {
			wheelItems.push({
				label: itemName,
				onWin() {
					pooper.game?.addAuditTrail(`${pooper.name} ${verb} ${target.name}'s ${itemName}!`);
					target.gear.deleteItem(deleteSlots[i]);
					addToPoopPile(pooper);
				}
			});
		}
	}

	if (wheelItems.length) {
		const wheel = wheelItems.concat(
			target.gear.consumables.map((x, index) => ({
				label: x,
				onWin() {
					pooper.game?.addAuditTrail(`${pooper.name} ${verb} ${target.name}'s ${x}!`);
					target.gear.deleteItem('consumables', index);
					addToPoopPile(pooper);
				}
			}))
		);

		ctx.addCustomWheel(`${pooper.name}'s ${wheelName}`, wheel);
	} else {
		const stolenGold = Math.min(5, target.gold);
		if (stolenGold > 0) {
			target.gold -= stolenGold;
			pooper.gold += stolenGold;
			pooper.game?.addAuditTrail(
				`${target.name} has no items to shit on! ${pooper.name} steals ${stolenGold} gold.`
			);
		} else {
			addToPoopPile(pooper);
			pooper.game?.addAuditTrail(
				`${target.name} is completely destitute! ${pooper.name} gains pity poop.`
			);
		}
	}
}
