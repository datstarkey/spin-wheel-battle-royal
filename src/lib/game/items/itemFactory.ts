import type { GameContext } from '../gameContext';
import type { Player } from '../player/player.svelte';
import type { StatType } from '../serialization';
import type { Item, ItemType } from './itemTypes';

interface StatModifier {
	stat: StatType;
	value: number;
}

export function createStatModifierItem(
	config: Omit<Item, 'onEquip' | 'onUnequip'>,
	modifiers: StatModifier[]
): Item {
	return {
		...config,
		onEquip: (player: Player, _type: ItemType, _ctx: GameContext) => {
			for (const { stat, value } of modifiers) {
				player.addStatModifier(config.name, stat, value);
			}
		},
		onUnequip: (player: Player, _type: ItemType, _ctx: GameContext) => {
			for (const { stat } of modifiers) {
				player.removeStatModifier(config.name, stat);
			}
		}
	};
}
