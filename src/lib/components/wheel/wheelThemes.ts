import type { WheelTheme } from './types';

export interface WheelThemeConfig {
	icon: string;
	title: string;
	subtitle: string;
	/** Accent for glows, gems and the result banner */
	accent: string;
}

export const WHEEL_THEMES: Record<WheelTheme, WheelThemeConfig> = {
	win: {
		icon: 'mdi:trophy',
		title: 'Victory spoils',
		subtitle: 'Claim your reward',
		accent: '#eab308'
	},
	lose: {
		icon: 'mdi:skull',
		title: "Fate's penalty",
		subtitle: 'Accept your consequence',
		accent: '#dc2626'
	},
	loot: {
		icon: 'mdi:treasure-chest',
		title: 'Treasure vault',
		subtitle: 'Fortune awaits',
		accent: '#f59e0b'
	},
	casino: {
		icon: 'mdi:slot-machine',
		title: 'High roller',
		subtitle: 'Test your luck',
		accent: '#10b981'
	},
	shadow: {
		icon: 'mdi:ghost',
		title: 'The Shadow Realm',
		subtitle: 'The void speaks',
		accent: '#a855f7'
	},
	gambler: {
		icon: 'mdi:cards-playing',
		title: "Gambler's fate",
		subtitle: 'All in or nothing',
		accent: '#f59e0b'
	},
	damage: {
		icon: 'mdi:sword-cross',
		title: 'Damage dealt',
		subtitle: 'Pain awaits',
		accent: '#ef4444'
	},
	button: {
		icon: 'mdi:gesture-tap-button',
		title: 'Mystery button',
		subtitle: 'What will happen?',
		accent: '#3b82f6'
	},
	magic: {
		icon: 'mdi:wizard-hat',
		title: 'Arcane wheel',
		subtitle: 'Channel your power',
		accent: '#8b5cf6'
	},
	default: {
		icon: 'mdi:star-four-points',
		title: 'Wheel of fate',
		subtitle: 'Destiny awaits',
		accent: '#dc2626'
	}
};

/** Older generators don't pass a theme; fall back to recognising it from the wheel key */
export function themeFromKey(key: string): WheelTheme {
	const lowerKey = key.toLowerCase();
	const match = (
		[
			['win wheel', 'win'],
			['lose wheel', 'lose'],
			['loot', 'loot'],
			['casino', 'casino'],
			['shadow', 'shadow'],
			['gambler', 'gambler'],
			['damage', 'damage'],
			['button', 'button'],
			['spell', 'magic']
		] as const
	).find(([needle]) => lowerKey.includes(needle));
	return match?.[1] ?? 'default';
}
