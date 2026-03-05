export interface AuditEventStyle {
	type: string;
	icon: string;
	colorClass: string;
	bgClass: string;
}

const DEFAULT_EVENT: AuditEventStyle = {
	type: 'info',
	icon: '\u2022',
	colorClass: 'text-surface-300',
	bgClass: 'bg-surface-500/10 border-surface-500/30'
};

/** Rules tested in order; first match wins. */
const rules: { test: (msg: string) => boolean; result: AuditEventStyle }[] = [
	// Victory / Game End
	{
		test: (m) => m.includes('wins the game') || m.includes('has won'),
		result: {
			type: 'victory',
			icon: '\uD83D\uDC51',
			colorClass: 'text-warning-400',
			bgClass: 'bg-warning-500/10 border-warning-500/30'
		}
	},
	{
		test: (m) => m === 'game started!',
		result: {
			type: 'game-start',
			icon: '\uD83C\uDFAE',
			colorClass: 'text-success-400',
			bgClass: 'bg-success-500/10 border-success-500/30'
		}
	},
	// Death
	{
		test: (m) => m.includes('is dead'),
		result: {
			type: 'death',
			icon: '\uD83D\uDC80',
			colorClass: 'text-error-400',
			bgClass: 'bg-error-500/10 border-error-500/30'
		}
	},
	// Combat - special abilities (more specific first)
	{
		test: (m) => m.includes('2 tapped') || m.includes('2 tap'),
		result: {
			type: 'gorf',
			icon: '\uD83D\uDD2B',
			colorClass: 'text-error-400',
			bgClass: 'bg-error-500/10 border-error-500/30'
		}
	},
	{
		test: (m) => m.includes('shit on') || m.includes('no items to shit'),
		result: {
			type: 'poop',
			icon: '\uD83D\uDCA9',
			colorClass: 'text-warning-600',
			bgClass: 'bg-warning-500/10 border-warning-500/30'
		}
	},
	{
		test: (m) => m.includes('shivved') || m.includes('shiv'),
		result: {
			type: 'shiv',
			icon: '\uD83D\uDDE1\uFE0F',
			colorClass: 'text-error-400',
			bgClass: 'bg-error-500/10 border-error-500/30'
		}
	},
	// Combat - general
	{
		test: (m) => m.includes('beat') || m.includes('attacks'),
		result: {
			type: 'attack',
			icon: '\u2694\uFE0F',
			colorClass: 'text-primary-400',
			bgClass: 'bg-primary-500/10 border-primary-500/30'
		}
	},
	{
		test: (m) => m.includes('lost to'),
		result: {
			type: 'defend',
			icon: '\uD83D\uDEE1\uFE0F',
			colorClass: 'text-secondary-400',
			bgClass: 'bg-secondary-500/10 border-secondary-500/30'
		}
	},
	// Damage tracking
	{
		test: (m) => m.includes('took') && m.includes('damage'),
		result: {
			type: 'damage',
			icon: '\uD83D\uDCA5',
			colorClass: 'text-error-400',
			bgClass: 'bg-error-500/10 border-error-500/30'
		}
	},
	{
		test: (m) => m.includes('healed') && m.includes('hp'),
		result: {
			type: 'heal',
			icon: '\uD83D\uDC9A',
			colorClass: 'text-success-400',
			bgClass: 'bg-success-500/10 border-success-500/30'
		}
	},
	{
		test: (m) => m.includes('transfers') && m.includes('hp'),
		result: {
			type: 'hp-transfer',
			icon: '\uD83D\uDC94',
			colorClass: 'text-warning-400',
			bgClass: 'bg-warning-500/10 border-warning-500/30'
		}
	},
	// Shadow Realm
	{
		test: (m) => m.includes('shadow realm') || m.includes('swaps places'),
		result: {
			type: 'shadow',
			icon: '\uD83C\uDF11',
			colorClass: 'text-tertiary-400',
			bgClass: 'bg-tertiary-500/10 border-tertiary-500/30'
		}
	},
	{
		test: (m) => m.includes('returns to spawn') || m.includes('escaped'),
		result: {
			type: 'escape',
			icon: '\uD83C\uDFC3',
			colorClass: 'text-success-400',
			bgClass: 'bg-success-500/10 border-success-500/30'
		}
	},
	// Gold / Shop
	{
		test: (m) => m.includes('gold') || m.includes('buys') || m.includes('shop costs'),
		result: {
			type: 'gold',
			icon: '\uD83D\uDCB0',
			colorClass: 'text-warning-400',
			bgClass: 'bg-warning-500/10 border-warning-500/30'
		}
	},
	// Casino
	{
		test: (m) => m.includes('casino'),
		result: {
			type: 'casino',
			icon: '\uD83C\uDFB0',
			colorClass: 'text-warning-400',
			bgClass: 'bg-warning-500/10 border-warning-500/30'
		}
	},
	// Health
	{
		test: (m) => m.includes('hp') || m.includes('heals') || m.includes('healing'),
		result: {
			type: 'health',
			icon: '\u2764\uFE0F',
			colorClass: 'text-success-400',
			bgClass: 'bg-success-500/10 border-success-500/30'
		}
	},
	// Movement / Teleport
	{
		test: (m) => m.includes('rotated'),
		result: {
			type: 'rotate',
			icon: '\uD83D\uDD04',
			colorClass: 'text-secondary-400',
			bgClass: 'bg-secondary-500/10 border-secondary-500/30'
		}
	},
	{
		test: (m) =>
			m.includes('moved') ||
			m.includes('movement') ||
			m.includes('teleport') ||
			m.includes('stepped on'),
		result: {
			type: 'move',
			icon: '\u27A1\uFE0F',
			colorClass: 'text-success-400',
			bgClass: 'bg-success-500/10 border-success-500/30'
		}
	},
	{
		test: (m) => m.includes('arrived at'),
		result: {
			type: 'arrive',
			icon: '\uD83D\uDCCD',
			colorClass: 'text-secondary-400',
			bgClass: 'bg-secondary-500/10 border-secondary-500/30'
		}
	},
	// Spawn
	{
		test: (m) => m.includes('spawned'),
		result: {
			type: 'spawn',
			icon: '\u2728',
			colorClass: 'text-tertiary-400',
			bgClass: 'bg-tertiary-500/10 border-tertiary-500/30'
		}
	},
	// Turn management
	{
		test: (m) => m.includes('starts their turn'),
		result: {
			type: 'turn-start',
			icon: '\u25B6',
			colorClass: 'text-primary-400',
			bgClass: 'bg-primary-500/10 border-primary-500/30'
		}
	},
	{
		test: (m) => m.includes('finishes their turn'),
		result: {
			type: 'turn-end',
			icon: '\u25A0',
			colorClass: 'text-surface-400',
			bgClass: 'bg-surface-500/10 border-surface-500/30'
		}
	},
	{
		test: (m) => m.includes('another turn'),
		result: {
			type: 'extra-turn',
			icon: '\uD83D\uDD01',
			colorClass: 'text-primary-400',
			bgClass: 'bg-primary-500/10 border-primary-500/30'
		}
	},
	{
		test: (m) => m.includes('skipped') || m.includes('will be skipped'),
		result: {
			type: 'skip',
			icon: '\u23ED',
			colorClass: 'text-warning-400',
			bgClass: 'bg-warning-500/10 border-warning-500/30'
		}
	},
	{
		test: (m) => m.includes('turn manually set'),
		result: {
			type: 'admin',
			icon: '\u2699\uFE0F',
			colorClass: 'text-surface-400',
			bgClass: 'bg-surface-500/10 border-surface-500/30'
		}
	},
	// Stats changes
	{
		test: (m) => m.includes('attack range'),
		result: {
			type: 'range',
			icon: '\uD83C\uDFAF',
			colorClass: 'text-primary-400',
			bgClass: 'bg-primary-500/10 border-primary-500/30'
		}
	},
	{
		test: (m) => m.includes('attack') && (m.includes('base') || m.includes('bonus')),
		result: {
			type: 'attack-stat',
			icon: '\u2694\uFE0F',
			colorClass: 'text-primary-400',
			bgClass: 'bg-primary-500/10 border-primary-500/30'
		}
	},
	{
		test: (m) => m.includes('defense') && (m.includes('base') || m.includes('bonus')),
		result: {
			type: 'defense-stat',
			icon: '\uD83D\uDEE1\uFE0F',
			colorClass: 'text-secondary-400',
			bgClass: 'bg-secondary-500/10 border-secondary-500/30'
		}
	},
	// Status effects
	{
		test: (m) => m.includes('no longer has'),
		result: {
			type: 'status-remove',
			icon: '\u2716\uFE0F',
			colorClass: 'text-surface-400',
			bgClass: 'bg-surface-500/10 border-surface-500/30'
		}
	},
	{
		test: (m) => m.includes('now has') && !m.includes('gold') && !m.includes('hp'),
		result: {
			type: 'status-add',
			icon: '\u26A1',
			colorClass: 'text-tertiary-400',
			bgClass: 'bg-tertiary-500/10 border-tertiary-500/30'
		}
	},
	// Items
	{
		test: (m) => m.includes('uses') || m.includes('was given'),
		result: {
			type: 'item',
			icon: '\uD83D\uDCE6',
			colorClass: 'text-secondary-400',
			bgClass: 'bg-secondary-500/10 border-secondary-500/30'
		}
	},
	{
		test: (m) => m.includes('gains') || m.includes('loses'),
		result: {
			type: 'stat-change',
			icon: '\uD83D\uDCCA',
			colorClass: 'text-secondary-400',
			bgClass: 'bg-secondary-500/10 border-secondary-500/30'
		}
	},
	// Button
	{
		test: (m) => m.includes('button'),
		result: {
			type: 'event',
			icon: '\uD83D\uDD34',
			colorClass: 'text-error-400',
			bgClass: 'bg-error-500/10 border-error-500/30'
		}
	},
	// Global game settings
	{
		test: (m) => m.includes('global'),
		result: {
			type: 'global',
			icon: '\uD83C\uDF10',
			colorClass: 'text-surface-400',
			bgClass: 'bg-surface-500/10 border-surface-500/30'
		}
	}
];

/** Classify an audit trail message for display styling. */
export function getEventType(message: string): AuditEventStyle {
	const lower = message.toLowerCase();
	for (const rule of rules) {
		if (rule.test(lower)) return rule.result;
	}
	return DEFAULT_EVENT;
}
