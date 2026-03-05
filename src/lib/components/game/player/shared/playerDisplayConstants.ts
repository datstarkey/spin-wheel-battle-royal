/** HP thresholds for color transitions on HP bars */
export const HP_CRITICAL = 5;
export const HP_WARNING = 10;

/** SWEnergy max value for progress bar */
export const SWENERGY_MAX = 10;

/** Equipment slot display configuration */
export const EQUIPMENT_SLOTS = [
	{ key: 'mainHand', icon: 'mdi:sword', colorClass: 'text-primary-400', label: 'Main Hand' },
	{
		key: 'offHand',
		icon: 'mdi:shield-half-full',
		colorClass: 'text-secondary-400',
		label: 'Off Hand'
	},
	{
		key: 'helm',
		icon: 'game-icons:crested-helmet',
		colorClass: 'text-tertiary-400',
		label: 'Helm'
	},
	{ key: 'chest', icon: 'mdi:tshirt-crew', colorClass: 'text-warning-400', label: 'Chest' }
] as const;

/** Get HP bar color class based on current HP */
export function getHpColorClass(hp: number): string {
	if (hp <= HP_CRITICAL) return 'from-error-600 to-error-500';
	if (hp <= HP_WARNING) return 'from-warning-600 to-warning-500';
	return 'from-success-600 to-success-500';
}

/** Get HP bar glow class based on current HP */
export function getHpGlowClass(hp: number): string {
	if (hp <= HP_CRITICAL) return 'animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]';
	if (hp <= HP_WARNING) return 'shadow-[0_0_10px_rgba(234,179,8,0.4)]';
	return 'shadow-[0_0_10px_rgba(34,197,94,0.4)]';
}
