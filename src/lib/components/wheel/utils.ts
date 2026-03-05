import { classMap } from '$lib/game/classes/classType';
import type { Game } from '$lib/game/game.svelte';
import type { SpinWheelItem } from './types';

export function playerNameSpinItems(game: Game | null): SpinWheelItem[] {
	return (
		game?.players
			.filter((player) => !game?.started || !player.dead)
			.map((player) => ({ label: player.name })) ?? []
	);
}

export function classSpinItems(): SpinWheelItem[] {
	return Object.keys(classMap)
		.filter((x) => x != 'none')
		.map((x) => ({ label: x }));
}

export function shuffle<T>(array: T[]): T[] {
	let currentIndex = array.length,
		randomIndex;

	// While there remain elements to shuffle.
	while (currentIndex > 0) {
		// Pick a remaining element.
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}

	return array;
}
