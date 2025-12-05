/**
 * Gameboard Type Definitions
 *
 * The board is a 24x24 logical tile grid parsed from the 480x480 Map.svg
 * Each logical tile = 20x20 pixels (2x2 visual tiles of 10x10 each)
 */

export type TileType =
	| 'blocked' // Black - cannot walk
	| 'path' // Blue - normal walkable
	| 'spawn_zone' // White corners - starting areas
	| 'spawn_point' // Brown - spawn markers within zones
	| 'spawn_entry' // Green - entry/exit from spawn zones
	| 'shop' // Yellow - triggers shop UI
	| 'shadow_realm' // Purple - sets player inShadowRealm
	| 'teleporter_outer' // Blue/purple - outer teleporters (entry/exit)
	| 'teleporter_inner' // Blue/purple - center teleporter (exit only)
	| 'button' // Red center - triggers button wheel
	| 'treasure'; // Blue with yellow outline - treasure chest

export type Direction = 'north' | 'south' | 'east' | 'west';

export interface Position {
	x: number; // Column (0-23)
	y: number; // Row (0-23)
}

export interface Tile {
	type: TileType;
	position: Position;
	walkable: boolean;
	/** Which directions can you exit this tile */
	connections: Direction[];
	/** For spawn tiles, which spawn zone (1-4, one per corner) */
	spawnZone?: number;
	/** For outer teleporters, which quadrant (1-4) */
	teleporterGroup?: number;
}

export interface SpawnZone {
	/** Zone ID 1-4 (top-left, top-right, bottom-left, bottom-right) */
	id: number;
	/** All tiles in this spawn zone */
	tiles: Position[];
	/** Green entry point tiles */
	entryPoints: Position[];
	/** Brown spawn point markers */
	spawnPoints: Position[];
}

export interface TeleporterConfig {
	/** The 4 outer teleporters - can enter and exit */
	outer: Position[];
	/** The inner/center teleporter - exit only */
	inner: Position;
}

export interface BoardConfig {
	/** Board dimensions */
	width: number;
	height: number;
	/** 2D grid of tiles */
	tiles: Tile[][];
	/** 4 corner spawn zones */
	spawnZones: SpawnZone[];
	/** Shop tile positions */
	shops: Position[];
	/** Teleporter configuration */
	teleporters: TeleporterConfig;
	/** Shadow realm tile positions */
	shadowRealmTiles: Position[];
	/** Center button position */
	buttonTile: Position;
	/** Treasure chest positions */
	treasureChests: Position[];
}

/**
 * Color hex codes from the original SVG mapped to tile types
 * Note: Uses lowercase hex codes for comparison
 */
export const COLOR_TO_TILE_TYPE: Record<string, TileType> = {
	'#000000': 'blocked',
	'#249fde': 'path', // Blue paths
	'#060608': 'blocked', // Path shadows - walls/dividers
	'#dcdcdc': 'spawn_zone', // White corner areas
	'#dae0ea': 'spawn_zone', // Light gray spawn
	'#430067': 'shadow_realm', // Purple
	'#59c135': 'spawn_entry', // Green
	'#dba463': 'spawn_point', // Brown/tan
	'#fffc40': 'shop', // Yellow
	'#ffd541': 'shop', // Also yellow
	'#285cc4': 'teleporter_outer', // Blue teleporter
	'#df3e23': 'button', // Red center
	'#b4202a': 'button', // Red shadow
	'#fa6a0a': 'path', // Orange arrows near center
	'#8b93af': 'blocked', // Gray details - structure
	'#ffffff': 'spawn_zone' // White details
};

/**
 * Helper to check if two positions are equal
 */
export function positionsEqual(a: Position, b: Position): boolean {
	return a.x === b.x && a.y === b.y;
}

/**
 * Helper to get adjacent position in a direction
 */
export function getAdjacentPosition(pos: Position, direction: Direction): Position {
	switch (direction) {
		case 'north':
			return { x: pos.x, y: pos.y - 1 };
		case 'south':
			return { x: pos.x, y: pos.y + 1 };
		case 'east':
			return { x: pos.x + 1, y: pos.y };
		case 'west':
			return { x: pos.x - 1, y: pos.y };
	}
}

/**
 * Helper to get Manhattan distance between two positions
 */
export function getManhattanDistance(a: Position, b: Position): number {
	return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Check if position is within board bounds
 */
export function isInBounds(pos: Position, width: number, height: number): boolean {
	return pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height;
}
