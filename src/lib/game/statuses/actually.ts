import type { StatusEffect } from './statusTypes';

export const actually: StatusEffect = {
	name: 'Actually',
	description: '"ACTUALLY, I think you\'ll find that..." - Peak intellectual superiority achieved.',
	image:
		'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiM2NjMzZmYiLz48dGV4dCB4PSI1MCIgeT0iNjAiIGZvbnQtc2l6ZT0iNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmYiPvCfpJM8L3RleHQ+PC9zdmc+',
	allowMultiple: false,
	classLock: ['intern'],

	onApply(player) {
		// Peak performance from maximum confidence
		player.attackMultipliers['Actually'] = 1.5; // 50% more attack
		player.defenseMultipliers['Actually'] = 1.3; // 30% more defense
		player.addStatModifier('Actually', 'attackRange', 1); // Can correct people from further away
		player.game?.addAuditTrail(
			`${player.name} enters "ACTUALLY" mode! +50% ATK, +30% DEF, +1 Range. Peak performance achieved.`
		);
	},

	onRemove(player) {
		delete player.attackMultipliers['Actually'];
		delete player.defenseMultipliers['Actually'];
		player.removeStatModifier('Actually', 'attackRange');
		player.game?.addAuditTrail(
			`${player.name}'s "ACTUALLY" mode fades. Back to humble helpfulness.`
		);
	},

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onAttackWin(player, _defendingPlayer) {
		// Correcting people gives a small heal
		player.hp += 5;
		player.game?.addAuditTrail(
			`${player.name}: "As I was saying..." The satisfaction of being right heals 5 HP.`
		);
	},

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onDefendWin(player, _attackingPlayer) {
		// Successfully defending proves you were right
		player.game?.addAuditTrail(`${player.name}: "I told you so." The smugness is palpable.`);
	},

	onTurnStart(player) {
		player.game?.addAuditTrail(`${player.name} adjusts their glasses: "Well, ACTUALLY..."`);
	}
};
