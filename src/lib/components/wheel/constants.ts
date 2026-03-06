import { localStorageStore } from '$lib/stores/localStorageStore.svelte';

/** Shared wheel color palette for SpinWheel and SlotReel */
export const WHEEL_COLORS = [
	'#b91c1c', // primary-700 crimson
	'#1e293b', // surface-800 dark
	'#3b82f6', // secondary-500 blue
	'#a855f7', // tertiary-500 purple
	'#f59e0b', // warning-500 gold
	'#10b981' // success-500 emerald
];

/** Shared quick-mode toggle persisted in localStorage */
export const quickMode = localStorageStore<boolean>('wheel-quick-mode', false);
