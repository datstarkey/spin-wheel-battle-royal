import type { GameContext } from '../gameContext';
import type { Player } from '../player/player.svelte';
import type { StatModifier } from '../serialization';
import type { StatusEffect } from './statusTypes';

export function createStatModifierStatus(
	config: Omit<StatusEffect, 'onApply' | 'onRemove'>,
	modifiers: StatModifier[]
): StatusEffect {
	return {
		...config,
		onApply: (player: Player, _ctx: GameContext) => {
			for (const { stat, value } of modifiers) {
				player.addStatModifier(config.name, stat, value);
			}
		},
		onRemove: (player: Player, _ctx: GameContext) => {
			for (const { stat } of modifiers) {
				player.removeStatModifier(config.name, stat);
			}
		}
	};
}
