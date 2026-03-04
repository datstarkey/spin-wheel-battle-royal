import type { Player } from '../player/player.svelte';
import type { StatType } from '../serialization';
import type { Item } from './itemTypes';

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
		onEquip: (player: Player) => {
			for (const { stat, value } of modifiers) {
				player.addStatModifier(config.name, stat, value);
			}
		},
		onUnequip: (player: Player) => {
			for (const { stat } of modifiers) {
				player.removeStatModifier(config.name, stat);
			}
		}
	};
}
