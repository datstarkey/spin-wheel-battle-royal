import type { GameContext } from './gameContext';
import type { Player } from './player/player.svelte';
import type { WheelBase } from './wheels/wheels';

interface CombatWheelOptions {
	auditLabelSuffix?: string;
}

export interface CombatWheelConfig {
	wheel: WheelBase;
	attackWeight: number;
	defenseWeight: number;
}

function cleanupCombatLifecycle(attacker: Player, defender: Player, ctx: GameContext) {
	attacker.onAttackEnd(defender, ctx);
	defender.onDefenseEnd(attacker, ctx);
}

export function createCombatWheel(
	attacker: Player,
	defender: Player,
	ctx: GameContext,
	options: CombatWheelOptions = {}
): CombatWheelConfig {
	const suffix = options.auditLabelSuffix ? ` ${options.auditLabelSuffix}` : '';
	attacker.onAttackStart(defender, ctx);
	defender.onDefenseStart(attacker, ctx);

	// Debuffs can push stats to 0 or below; every fighter keeps at least a sliver of a chance
	const attackWeight = Math.max(1, attacker.attack);
	const defenseWeight = Math.max(1, defender.defense);

	const wheel: WheelBase = [
		{
			label: attacker.name,
			weight: attackWeight,
			onWin: () => {
				try {
					ctx.addAuditTrail(
						`${attacker.name} (ATK ${attackWeight}) beat ${defender.name} (DEF ${defenseWeight})${suffix}`
					);
					attacker.onAttackWin(defender, ctx);
					defender.onDefendLose(attacker, ctx);
				} finally {
					cleanupCombatLifecycle(attacker, defender, ctx);
				}
			}
		},
		{
			label: defender.name,
			weight: defenseWeight,
			onWin: () => {
				try {
					ctx.addAuditTrail(
						`${attacker.name} (ATK ${attackWeight}) lost to ${defender.name} (DEF ${defenseWeight})${suffix}`
					);
					attacker.onAttackLose(defender, ctx);
					defender.onDefendWin(attacker, ctx);
				} finally {
					cleanupCombatLifecycle(attacker, defender, ctx);
				}
			}
		}
	];

	return {
		wheel,
		attackWeight,
		defenseWeight
	};
}
