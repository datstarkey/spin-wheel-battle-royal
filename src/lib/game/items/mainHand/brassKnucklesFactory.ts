import type { Player } from '../../player/player.svelte';
import type { Item, ItemType } from '../itemTypes';

const BASE_NAME = 'Brass Knuckles';
const MODIFIER_SOURCE = 'Brass Knuckles';

/**
 * Re-derive the bonus from current defense. Called on equip changes and before every turn and
 * fight, so it keeps up with defense gains (e.g. Absolute Unit's +5 DEF per win).
 * `leavingSlot` is the slot being unequipped, which still holds its item when onUnequip runs.
 */
function refreshBrassKnuckles(player: Player, leavingSlot?: ItemType) {
	const equipped = [
		leavingSlot === 'mainhand' ? null : player.gear.mainHandItem,
		leavingSlot === 'offHand' ? null : player.gear.offHandItem
	].filter((item) => item?.name.startsWith(BASE_NAME)).length;

	if (equipped === 0) {
		player.removeStatModifier(MODIFIER_SOURCE, 'attack');
		return;
	}
	const bonus = Math.floor(player.defense * (equipped === 2 ? 0.75 : 0.5));
	if (player.activeModifiers.attack[MODIFIER_SOURCE] !== bonus) {
		player.addStatModifier(MODIFIER_SOURCE, 'attack', bonus);
	}
}

export function createBrassKnuckles(slot: 'mainhand' | 'offHand', label: string): Item {
	return {
		name: `${BASE_NAME} (${label})`,
		description:
			'Gain Attack equal to 50% of your Defense (75% if dual wielding). Updates as your Defense changes.',
		type: slot,
		baseCost: 3,
		image: '/Items/MainHandEquipables/BrassKnuckles.svg',
		maxAmount: 1,
		onEquip: (player: Player) => refreshBrassKnuckles(player),
		onUnequip: (player: Player, type: ItemType) => refreshBrassKnuckles(player, type),
		onTurnStart: (player: Player) => refreshBrassKnuckles(player),
		onAttackStart: (player: Player) => refreshBrassKnuckles(player),
		onDefenseStart: (player: Player) => refreshBrassKnuckles(player)
	};
}
