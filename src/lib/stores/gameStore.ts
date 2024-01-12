import { Game } from '$lib/game/game';
import { Player } from '$lib/game/player/player';
import { get } from 'svelte/store';
import { localStorageStore } from './localStorageStore';
import toast from 'svelte-french-toast';
import type { WheelBase } from '$lib/game/wheels/wheels';

export const currentGame = localStorageStore<Game | null>('currentGame', null);

export function refresh() {
	currentGame.update((game) => game);
}

export function getGlobalHpReduction() {
	return get(currentGame)?.globalHpReduction ?? 0;
}

export function increaseGlobalHpReduction(amount: number = 0) {
	currentGame.update((game) => {
		if (!game) return game;
		if (amount == 0) {
			game.globalHpReduction *= 2;
		} else {
			game.globalHpReduction += amount;
		}

		toast.success(`Global HP reduction is now ${game.globalHpReduction}`);
		return game;
	});
}

function gameHasStarted() {
	if (get(currentGame)?.started) {
		toast.error("Can't modify game after it has started!");
		return true;
	}
	return false;
}

export function resetGame() {
	currentGame.set(new Game());
}

export function addPlayer(name: string) {
	currentGame.update((game) => {
		if (game?.started) {
			gameHasStarted();
			return game;
		}
		game ??= new Game();
		game.players.push(new Player(name));
		return game;
	});
}

export function removePlayer(player: Player) {
	currentGame.update((game) => {
		if (game?.started) {
			gameHasStarted();
			return game;
		}
		game?.players.splice(game.players.indexOf(player), 1);
		return game;
	});
}

/**
 * Returns the reference to the player with the given name
 * @param name The name of the player to get
 * @returns
 */

export function getPlayerByName(name?: string): Player | undefined {
	return get(currentGame)?.players.find((player) => player.name === name);
}

export function startGame() {
	currentGame.update((game) => {
		if (!game) return game;
		game.started = true;
		toast.success('Game started!');
		return game;
	});
}

/**
 * @description Adds a custom wheel to the game, which will have to be spun before the game can continue
 * @param key The key to use to reference the wheel
 * @param wheel The wheel to add
 */
export function addCustomWheel(key: string, wheel: WheelBase) {
	currentGame.update((game) => {
		if (!game) return game;
		game.customWheels.set(key, wheel);
		return game;
	});
}

export function removeCustomWheel(key: string) {
	currentGame.update((game) => {
		if (!game) return game;
		game.customWheels.delete(key);
		return game;
	});
}
