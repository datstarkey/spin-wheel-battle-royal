import { Game } from '$lib/game/game.svelte';
import { Player } from '$lib/game/player/player.svelte';
import type { WheelBase } from '$lib/game/wheels/wheels';
import toast from 'svelte-french-toast';
import { localStorageStore } from './localStorageStore.svelte';

export const currentGame = localStorageStore<Game | null>('currentGame', null);

export function getGlobalHpReduction() {
	return currentGame.value?.globalHpReduction ?? 0;
}

export function increaseGlobalHpReduction(amount: number = 0) {
	if (!currentGame.value) return;
	if (amount == 0) {
		currentGame.value.globalHpReduction *= 2;
	} else {
		currentGame.value.globalHpReduction += amount;
	}

	toast.success(`Global HP reduction is now ${currentGame.value.globalHpReduction}`);
}

function gameHasStarted() {
	if (currentGame.value?.started) {
		toast.error("Can't modify game after it has started!");
		return true;
	}
	return false;
}

export function resetGame() {
	currentGame.value = new Game();
}

export function addPlayer(name: string) {
	if (currentGame.value?.started) {
		gameHasStarted();
		return;
	}
	currentGame.value?.players.push(new Player(name));
}

export function removePlayer(player: Player) {
	if (currentGame.value?.started) {
		gameHasStarted();
		return;
	}
	currentGame.value?.players.splice(currentGame.value?.players.indexOf(player), 1);
}

/**
 * Returns the reference to the player with the given name
 * @param name The name of the player to get
 * @returns
 */

export function getPlayerByName(name?: string): Player | undefined {
	return currentGame.value?.players.find((player) => player.name === name);
}

export function startGame() {
	if (!currentGame.value) return;
	currentGame.value.started = true;
	toast.success('Game started!');
}

/**
 * @description Adds a custom wheel to the game, which will have to be spun before the game can continue
 * @param key The key to use to reference the wheel
 * @param wheel The wheel to add
 */
export function addCustomWheel(key: string, wheel: WheelBase) {
	if (!currentGame.value) return;
	currentGame.value.customWheels.set(key, wheel);
}

export function removeCustomWheel(key: string) {
	if (!currentGame.value) return;
	currentGame.value.customWheels.delete(key);
}
