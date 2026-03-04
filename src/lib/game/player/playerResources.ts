import type { Player } from './player.svelte';

export function getResource(player: Player, key: string): number {
	return player.resources[key] ?? 0;
}

export function setResource(
	player: Player,
	key: string,
	value: number,
	min?: number,
	max?: number
): number {
	if (min !== undefined && value < min) value = min;
	if (max !== undefined && value > max) value = max;
	player.resources[key] = value;
	return value;
}

export function addResource(
	player: Player,
	key: string,
	amount: number,
	min?: number,
	max?: number
): number {
	const current = getResource(player, key);
	return setResource(player, key, current + amount, min, max);
}
