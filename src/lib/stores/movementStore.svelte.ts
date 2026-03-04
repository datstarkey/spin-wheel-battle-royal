import { gameBoard, getValidMoves, getPathDistance } from '$lib/game/board/board.svelte';
import { executeTileAction } from '$lib/game/board/tileActions';
import type { Position } from '$lib/game/board/types';
import { positionsEqual } from '$lib/game/board/types';
import { grantUnusedMovementMana } from '$lib/game/classes/magicman';
import toast from '$lib/stores/toaster.svelte';
import { addAuditTrail, currentGame, getPlayerByName } from './gameStore.svelte';
import { canPlayerMove } from './teleportStore.svelte';

// ============================================================================
// Movement State
// ============================================================================

/** Whether the current player is in movement mode */
let _isMovementMode = $state(false);

export function getIsMovementMode() {
	return _isMovementMode;
}

export function getHasMovedThisTurn() {
	return currentGame.value?.hasMoved ?? false;
}

/**
 * Enter movement mode - highlights valid moves for the current player
 */
export function enterMovementMode() {
	if (!currentGame.value) return;
	if (currentGame.value.hasMoved) {
		toast.error('You have already moved this turn!');
		return;
	}

	const currentPlayer = currentGame.value.currentPlayer;
	if (!currentPlayer?.position) return;

	// Check if player can move (shadow realm restriction)
	if (!canPlayerMove(currentPlayer)) {
		toast.error('You cannot move while in the Shadow Realm!');
		return;
	}

	_isMovementMode = true;

	// Calculate and highlight valid moves based on player's movement stat
	// Players not in shadow realm cannot move onto shadow realm tiles (except Shadeweaver)
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

/**
 * Exit movement mode - clears highlights
 */
export function exitMovementMode() {
	_isMovementMode = false;
	gameBoard.clearHighlights();
}

/**
 * Attempt to move the current player to a position
 */
export function moveCurrentPlayerTo(position: Position): boolean {
	if (!currentGame.value || !_isMovementMode) return false;

	const currentPlayer = currentGame.value.currentPlayer;
	if (!currentPlayer?.position) return false;

	// Check if the position is a valid move
	const isValidMove = gameBoard.highlightedMoves.some((p) => positionsEqual(p, position));
	if (!isValidMove) {
		toast.error('Invalid move!');
		return false;
	}

	// Calculate tiles moved (path distance) before moving
	const oldPos = { ...currentPlayer.position };
	const tilesMovedThisTurn = getPathDistance(oldPos, position, currentPlayer.movement);

	// Move the player
	currentPlayer.position = { ...position };

	// Update the game board
	gameBoard.setPlayerPosition(currentPlayer.name, position);

	// Log the move
	addAuditTrail(
		`${currentPlayer.name} moved from (${oldPos.x}, ${oldPos.y}) to (${position.x}, ${position.y})`
	);

	// Mark as moved and exit movement mode
	currentGame.value.hasMoved = true;
	exitMovementMode();

	// Grant unused movement mana for Magic Man
	if (currentPlayer.classType === 'magicman' && tilesMovedThisTurn >= 0) {
		const unusedMovement = currentPlayer.movement - tilesMovedThisTurn;
		if (unusedMovement > 0) {
			grantUnusedMovementMana(currentPlayer, unusedMovement);
		}
	}

	// Execute tile action at the new position (treasure chests, shops, etc.)
	executeTileAction(currentPlayer, position);

	return true;
}

/**
 * Reset movement state for a new turn (only resets UI state, turn actions are reset in Game class)
 */
export function resetMovementState() {
	_isMovementMode = false;
	gameBoard.clearHighlights();
}

// ============================================================================
// Tile Checks
// ============================================================================

/**
 * Check if the current player is on a shop tile
 */
export function isCurrentPlayerOnShop(): boolean {
	if (!currentGame.value) return false;
	const player = currentGame.value.currentPlayer;
	if (!player?.position) return false;

	const tile = gameBoard.getPlayerTileType(player.name);
	return tile === 'shop';
}

/**
 * Check if the current player is on a casino tile
 */
export function isCurrentPlayerOnCasino(): boolean {
	if (!currentGame.value) return false;
	const player = currentGame.value.currentPlayer;
	if (!player?.position) return false;

	const tile = gameBoard.getPlayerTileType(player.name);
	return tile === 'casino';
}

/**
 * Get the Manhattan distance between two players
 */
export function getDistanceBetweenPlayers(player1Name: string, player2Name: string): number {
	const player1 = getPlayerByName(player1Name);
	const player2 = getPlayerByName(player2Name);

	const pos1 = player1?.position;
	const pos2 = player2?.position;

	if (!pos1 || !pos2) return Infinity;

	return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

/**
 * Check if a target player is within attack range of the current player
 * In the Shadow Realm, any player can attack any other player (no range limit)
 * Shadeweaver can attack anyone in the Shadow Realm from anywhere (infinite range)
 */
export function isPlayerInAttackRange(targetName: string): boolean {
	if (!currentGame.value) return false;
	const attacker = currentGame.value.currentPlayer;
	if (!attacker) return false;

	// In the Shadow Realm, any player can attack any other player
	if (attacker.inShadowRealm) {
		return true;
	}

	// Shadeweaver can attack anyone in the Shadow Realm from anywhere
	const target = getPlayerByName(targetName);
	if (attacker.classType === 'shadeweaver' && target?.inShadowRealm) {
		return true;
	}

	const distance = getDistanceBetweenPlayers(attacker.name, targetName);
	return distance <= attacker.attackRange;
}
