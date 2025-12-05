/**
 * Game Board Module
 *
 * Exports all board-related types, data, and utilities.
 */

// Types
export type {
	TileType,
	Direction,
	Position,
	Tile,
	SpawnZone,
	TeleporterConfig,
	BoardConfig
} from './types';

export {
	COLOR_TO_TILE_TYPE,
	positionsEqual,
	getAdjacentPosition,
	getManhattanDistance,
	isInBounds
} from './types';

// Board data
export {
	BOARD_CONFIG,
	BOARD_WIDTH,
	BOARD_HEIGHT,
	TILES,
	SPAWN_ZONES,
	SHOPS,
	TELEPORTERS,
	SHADOW_REALM_TILES,
	BUTTON_TILE
} from './boardData';

// Board state and utilities
export {
	gameBoard,
	GameBoard,
	getTileAt,
	isWalkable,
	canMoveBetween,
	getValidMoves,
	getPlayersInAttackRange,
	getSpawnPointsForZone,
	getOuterTeleporters,
	getInnerTeleporter,
	isOuterTeleporter,
	isInnerTeleporter,
	getOtherOuterTeleporters
} from './board.svelte';

// Tile assets
export { TILE_SVGS, getTileSvg, TILE_NAMES, TILE_DESCRIPTIONS } from './tiles';
