import { addAuditTrail } from '$lib/stores/gameStore.svelte';
import type { Player } from '../player/player.svelte';
import { generateRandomPlayerWheel } from '../wheels/randomPlayerWheel';
import { generateShadowRealmWheel } from '../wheels/shadowRealm';
import type { ClassBase } from './classType';

// Resource key for tracking Shade stacks
export const SHADE_RESOURCE = 'Shade';

// Helper to add Shade to a Shadeweaver
export function addShade(player: Player, amount: number = 1) {
	player.resources[SHADE_RESOURCE] ??= 0;
	player.resources[SHADE_RESOURCE] += amount;
	const totalShade = player.resources[SHADE_RESOURCE];
	addAuditTrail(
		`${player.name}'s Shade grows to ${totalShade}! (+${totalShade}% ATK/DEF)`
	);
}

export const Shadeweaver: ClassBase = {
	hp: 100,
	attack: 20,
	defense: 15,
	name: 'Shadeweaver',
	description:
		'Master of the Shadow Realm. Immune to the Shadow Realm wheel. Can freely move in/out of Shadow Realm tiles. Can attack anyone in the Shadow Realm from anywhere. Gains +1% ATK and DEF per Shade (earned when others spin the Shadow Realm wheel).',
	onWinAbility: 'Make someone spin the shadow realm wheel',
	attackRange: 1,

	// Passive: +1% ATK per Shade stack (based on base attack to avoid circular dependency)
	getBonusAttack(player) {
		const shade = player.resources[SHADE_RESOURCE] ?? 0;
		return Math.floor((shade / 100) * player.baseAttack);
	},

	// Passive: +1% DEF per Shade stack (based on base defense to avoid circular dependency)
	getBonusDefense(player) {
		const shade = player.resources[SHADE_RESOURCE] ?? 0;
		return Math.floor((shade / 100) * player.baseDefense);
	},

	onAttackWin: (player) => {
		generateRandomPlayerWheel(
			`${player.name} Makes someone roll the Shadow Realm Wheel`,
			(winner) => {
				generateShadowRealmWheel(winner.name);
			}
		);
	}
};
			
