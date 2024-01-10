import { Game } from '$lib/game/game';
import { Player } from '$lib/game/player';
import { get } from 'svelte/store';
import { localStorageStore } from './localStorageStore';
import toast from 'svelte-french-toast';
import { ClassType, classMap } from '$lib/game/classType';

export const currentGame = localStorageStore<Game | null>('currentGame', null);

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

export function getPlayerByName(name: string): Player | undefined {
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

export function reducePlayerHp(playerName: string) {
	currentGame.update((game) => {
		if (!game) return game;
		const player = game.players.find((player) => player.name === playerName);
		if (!player) return game;
		if (!game.globalHpReduction || game.globalHpReduction < 1) game.globalHpReduction = 1;
		player.hp = player.hp - game.globalHpReduction;
		toast.error(`${playerName} lost ${game.globalHpReduction} HP!`);
		return game;
	});
}

export function increasePlayerGold(playerName: string, amount: number = 1) {
	currentGame.update((game) => {
		if (!game) return game;
		const player = game.players.find((player) => player.name === playerName);
		if (!player) return game;
		player.gold += amount;
		toast.success(`${playerName} gained ${amount} gold!`);
		return game;
	});
}

export function assignClassToPlayer(playerName: string, classType: ClassType) {
	currentGame.update((game) => {
		if (!game) return game;
		if (gameHasStarted()) return game;
		const player = game.players.find((player) => player.name === playerName);
		if (!player) return game;
		player.class = classType;

		player.hp = classMap[classType].hp;
		player.attack = classMap[classType].attack;
		player.defense = classMap[classType].defense;
		return game;
	});
}
