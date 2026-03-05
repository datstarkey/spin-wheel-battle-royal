import { createContext } from 'svelte';
import { gameBoard, getValidMoves } from '$lib/game/board/board.svelte';
import type { Position } from '$lib/game/board/types';
import { positionsEqual } from '$lib/game/board/types';
import toast from '$lib/stores/toaster.svelte';
import { canPlayerMove } from './teleportStore.svelte';

type GameStoreInstance = ReturnType<typeof import('./gameStore.svelte').setGameStore>;
type SocketStoreInstance = ReturnType<
	typeof import('$lib/multiplayer/socketStore.svelte').setSocketStore
>;

class MovementStore {
	private gameStore: GameStoreInstance;
	private socketStore: SocketStoreInstance | null = null;

	constructor(gameStore: GameStoreInstance) {
		this.gameStore = gameStore;
	}

	setSocketStore(socketStore: SocketStoreInstance) {
		this.socketStore = socketStore;
	}

	private _isMovementMode = $state(false);

	// -----------------------------------------------------------
	// Reactive getters
	// -----------------------------------------------------------

	get isMovementMode() {
		return this._isMovementMode;
	}

	get hasMovedThisTurn() {
		return this.gameStore.game?.hasMoved ?? false;
	}

	// -----------------------------------------------------------
	// Movement mode
	// -----------------------------------------------------------

	enterMovementMode() {
		const game = this.gameStore.game;
		if (!game) return;
		if (game.hasMoved) {
			toast.error('You have already moved this turn!');
			return;
		}

		const currentPlayer = game.currentPlayer;
		if (!currentPlayer?.position) return;

		if (!canPlayerMove(currentPlayer)) {
			toast.error('You cannot move while in the Shadow Realm!');
			return;
		}

		this._isMovementMode = true;

		const canEnterShadowRealm =
			currentPlayer.inShadowRealm || currentPlayer.classType === 'shadeweaver';
		const excludeShadowRealm = !canEnterShadowRealm;
		const validMoves = getValidMoves(
			currentPlayer.position,
			currentPlayer.movement,
			excludeShadowRealm
		);
		gameBoard.highlightedMoves = validMoves;
	}

	exitMovementMode() {
		this._isMovementMode = false;
		gameBoard.clearHighlights();
	}

	moveCurrentPlayerTo(position: Position): boolean {
		const game = this.gameStore.game;
		if (!game || !this._isMovementMode) return false;

		const currentPlayer = game.currentPlayer;
		if (!currentPlayer?.position) return false;

		const isValidMove = gameBoard.highlightedMoves.some((p) => positionsEqual(p, position));
		if (!isValidMove) {
			toast.error('Invalid move!');
			return false;
		}

		this.socketStore?.move(position);
		this.exitMovementMode();

		return true;
	}

	resetMovementState() {
		this._isMovementMode = false;
		gameBoard.clearHighlights();
	}

	// -----------------------------------------------------------
	// Tile checks
	// -----------------------------------------------------------

	isCurrentPlayerOnShop(): boolean {
		const game = this.gameStore.game;
		if (!game) return false;
		const player = game.currentPlayer;
		if (!player?.position) return false;

		const tile = gameBoard.getPlayerTileType(player.name);
		return tile === 'shop';
	}

	isCurrentPlayerOnCasino(): boolean {
		const game = this.gameStore.game;
		if (!game) return false;
		const player = game.currentPlayer;
		if (!player?.position) return false;

		const tile = gameBoard.getPlayerTileType(player.name);
		return tile === 'casino';
	}

	getDistanceBetweenPlayers(player1Name: string, player2Name: string): number {
		const player1 = this.gameStore.getPlayerByName(player1Name);
		const player2 = this.gameStore.getPlayerByName(player2Name);

		const pos1 = player1?.position;
		const pos2 = player2?.position;

		if (!pos1 || !pos2) return Infinity;

		return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
	}

	isPlayerInAttackRange(targetName: string): boolean {
		const game = this.gameStore.game;
		if (!game) return false;
		const attacker = game.currentPlayer;
		if (!attacker) return false;

		if (attacker.inShadowRealm) {
			return true;
		}

		const target = this.gameStore.getPlayerByName(targetName);
		if (attacker.classType === 'shadeweaver' && target?.inShadowRealm) {
			return true;
		}

		const distance = this.getDistanceBetweenPlayers(attacker.name, targetName);
		return distance <= attacker.attackRange;
	}
}

const [get, set] = createContext<MovementStore>();

export function getMovementStore() {
	return get();
}

export function setMovementStore(gameStore: GameStoreInstance) {
	const store = new MovementStore(gameStore);
	set(store);
	return store;
}
