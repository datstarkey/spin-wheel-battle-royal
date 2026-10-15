import { createContext } from 'svelte';
import { gameBoard } from '#lib/game/board/board.svelte.js';
import type { Position } from '#lib/game/board/types.js';
import { positionsEqual } from '#lib/game/board/types.js';
import { getPlayerValidMoves } from '#lib/game/rules.js';
import toast from '#lib/stores/toaster.svelte.js';
import { canPlayerMove } from '#lib/game/board/teleportUtils.js';

type GameStoreInstance = ReturnType<typeof import('./gameStore.svelte').setGameStore>;
type SocketStoreInstance = ReturnType<
	typeof import('#lib/multiplayer/socketStore.svelte.js').setSocketStore
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

		const validMoves = getPlayerValidMoves(currentPlayer);
		gameBoard.highlightedMoves = validMoves;

		// Broadcast to spectators
		this.socketStore?.sendSpectatorHint({
			kind: 'movement_mode',
			playerName: currentPlayer.name,
			validMoves
		});
	}

	exitMovementMode() {
		this._isMovementMode = false;
		gameBoard.clearHighlights();

		// Broadcast cancel to spectators
		const playerName = this.gameStore.game?.currentPlayer?.name;
		if (playerName) {
			this.socketStore?.sendSpectatorHint({ kind: 'movement_cancel', playerName });
		}
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
