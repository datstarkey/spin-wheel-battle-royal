import { addAuditTrail } from '$lib/stores/gameStore.svelte';
import type { StatusEffect } from './statusTypes';

export const overthinking: StatusEffect = {
	name: 'Overthinking',
	description: '"What if I made a mistake? What if everyone hates me? What if-"',
	image:
		'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiM0NDQiLz48dGV4dCB4PSI1MCIgeT0iNjAiIGZvbnQtc2l6ZT0iNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmYiPvCfmLDwn5KtPC90ZXh0Pjwvc3ZnPg==',
	allowMultiple: false,
	classLock: ['intern'],

	onApply(player) {
		// Massive debuffs from self-doubt
		player.attackMultipliers['Overthinking'] = 0.7; // 30% less attack
		player.defenseMultipliers['Overthinking'] = 0.7; // 30% less defense
		player.addStatModifier('Overthinking', 'movement', -1); // Paralyzed by indecision
		addAuditTrail(
			`${player.name} is overthinking everything! -30% ATK, -30% DEF, -1 Movement`
		);
	},

	onRemove(player) {
		delete player.attackMultipliers['Overthinking'];
		delete player.defenseMultipliers['Overthinking'];
		player.removeStatModifier('Overthinking', 'movement');
	},

	onTurnStart(player) {
		// Spiral deeper into doubt
		addAuditTrail(
			`${player.name}: "But what if I'm wrong? I should double-check everything again..."`
		);
	}
};
