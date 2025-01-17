import { classMap } from '$lib/game/classes/classType';
import { currentGame } from '$lib/stores/gameStore.svelte';
import type { SpinWheelItem } from './types';

export function playerNameSpinItems(): SpinWheelItem[] {
	return (
		currentGame.value?.players
			.filter((player) => !currentGame.value?.started || !player.dead)
			.map((player) => ({ label: player.name })) ?? []
	);
}

export function classSpinItems(): SpinWheelItem[] {
	return Object.keys(classMap)
		.filter((x) => x != 'none')
		.map((x) => ({ label: x }));
}

export function shuffle(array: SpinWheelItem[]) {
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
