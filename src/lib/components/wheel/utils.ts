import { currentGame } from '$lib/stores/gameStore';
import { get } from 'svelte/store';
import type { SpinWheelItem } from './types';
import { ClassType } from '$lib/game/classType';

export function playerNameSpinItems(): SpinWheelItem[] {
	const game = get(currentGame);
	if (!game) return [];
	return game.players.map((player) => ({ label: player.name }));
}

export function classSpinItems(): SpinWheelItem[] {
	return Object.keys(ClassType.Values)
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
