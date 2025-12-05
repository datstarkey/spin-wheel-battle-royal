/**
 * Gameboard Type Definitions
 *
 * The board is a 48x48 tile grid parsed from the original Map.svg
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
	| 'button'; // Red center - triggers button wheel

export type Direction = 'north' | 'south' | 'east' | 'west';

export interface Position {
	x: number; // Column (0-47)
	y: number; // Row (0-47)
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
}

/**
 * Color hex codes from the original SVG mapped to tile types
 */
export const COLOR_TO_TILE_TYPE: Record<string, TileType> = {
	'#000000': 'blocked',
	'#249FDE': 'path', // Blue paths
	'#060608': 'path', // Path shadows (treat as path)
	'#DCDCDC': 'spawn_zone', // White corner areas
	'#DAE0EA': 'spawn_zone', // Light gray (also spawn zone)
	'#430067': 'shadow_realm', // Purple
	'#59C135': 'spawn_entry', // Green
	'#DBA463': 'spawn_point', // Brown/tan
	'#FFFC40': 'shop', // Yellow
	'#FFD541': 'shop', // Also yellow (variation)
	'#285CC4': 'teleporter_outer', // Blue teleporter
	'#DF3E23': 'button', // Red center
	'#B4202A': 'button', // Red shadow (also button)
	'#FA6A0A': 'path', // Orange arrows near center (walkable)
	'#8B93AF': 'path', // Gray details (walkable)
	'#FFFFFF': 'spawn_zone' // White details in spawn
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
