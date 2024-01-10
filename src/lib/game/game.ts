import { Player } from './player';

export class Game {
	players: Player[] = [];
	started: boolean = false;

	playerOrder: Record<number, Player> = {};
	currentTurn: number = 0;

	globalHpReduction: number = 1;

	currentWinnerWheel?: string;
	currentLoserWheel?: string;
}
