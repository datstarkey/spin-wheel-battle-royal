/**
 * SVG Board Parser
 *
 * Parses the Map.svg file and generates board data for the game.
 * Run with: npx tsx scripts/parseSvgBoard.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Tile type definitions (matching types.ts)
type TileType =
	| 'blocked'
	| 'path'
	| 'spawn_zone'
	| 'spawn_point'
	| 'spawn_entry'
	| 'shop'
	| 'shadow_realm'
	| 'teleporter_outer'
	| 'teleporter_inner'
	| 'button';

type Direction = 'north' | 'south' | 'east' | 'west';

interface Position {
	x: number;
	y: number;
}

interface Tile {
	type: TileType;
	position: Position;
	walkable: boolean;
	connections: Direction[];
	spawnZone?: number;
	teleporterGroup?: number;
}

// Color mapping - maps hex colors to tile types
const COLOR_TO_TILE_TYPE: Record<string, TileType> = {
	'#000000': 'blocked',
	'#249fde': 'path',
	'#060608': 'path', // Path shadows
	'#dcdcdc': 'spawn_zone',
	'#dae0ea': 'spawn_zone',
	'#430067': 'shadow_realm',
	'#59c135': 'spawn_entry',
	'#dba463': 'spawn_point',
	'#fffc40': 'shop',
	'#ffd541': 'shop',
	'#285cc4': 'teleporter_outer', // Will need manual adjustment for inner
	'#df3e23': 'button',
	'#b4202a': 'button',
	'#fa6a0a': 'path', // Orange arrows
	'#8b93af': 'path', // Gray details
	'#ffffff': 'spawn_zone'
};

// Tiles that players can walk on
const WALKABLE_TYPES: TileType[] = [
	'path',
	'spawn_zone',
	'spawn_point',
	'spawn_entry',
	'shop',
	'shadow_realm',
	'teleporter_outer',
	'teleporter_inner',
	'button'
];

// SVG dimensions
const SVG_WIDTH = 480;
const SVG_HEIGHT = 480;
const TILE_SIZE = 10; // Each game tile = 10x10 pixels
const BOARD_WIDTH = SVG_WIDTH / TILE_SIZE; // 48
const BOARD_HEIGHT = SVG_HEIGHT / TILE_SIZE; // 48

/**
 * Parse the SVG and extract pixel colors
 */
function parseSvg(svgPath: string): Map<string, string> {
	const content = readFileSync(svgPath, 'utf-8');
	const pixelColors = new Map<string, string>();

	// Match all rect elements: <rect x="X" y="Y" width="1" height="1" fill="#XXXXXX" />
	const rectRegex = /<rect\s+x="(\d+)"\s+y="(\d+)"\s+width="1"\s+height="1"\s+fill="(#[0-9a-fA-F]{6})"\s*\/>/g;

	let match;
	while ((match = rectRegex.exec(content)) !== null) {
		const x = parseInt(match[1], 10);
		const y = parseInt(match[2], 10);
		const color = match[3].toLowerCase();
		pixelColors.set(`${x},${y}`, color);
	}

	console.log(`Parsed ${pixelColors.size} pixels from SVG`);
	return pixelColors;
}

/**
 * Sample the dominant color for a tile (10x10 pixel area)
 */
function getTileColor(pixelColors: Map<string, string>, tileX: number, tileY: number): string {
	const colorCounts = new Map<string, number>();

	// Sample all pixels in the 10x10 area
	for (let py = 0; py < TILE_SIZE; py++) {
		for (let px = 0; px < TILE_SIZE; px++) {
			const pixelX = tileX * TILE_SIZE + px;
			const pixelY = tileY * TILE_SIZE + py;
			const color = pixelColors.get(`${pixelX},${pixelY}`) || '#000000';

			colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
		}
	}

	// Find the most common non-black color (unless all black)
	let dominantColor = '#000000';
	let maxCount = 0;

	for (const [color, count] of colorCounts) {
		// Prioritize non-black colors
		if (color !== '#000000' && count > maxCount) {
			dominantColor = color;
			maxCount = count;
		}
	}

	// If very few non-black pixels, treat as blocked
	if (maxCount < 20) {
		// Less than 20% coverage
		dominantColor = '#000000';
	}

	return dominantColor;
}

/**
 * Determine tile type from color
 */
function getTileType(color: string): TileType {
	return COLOR_TO_TILE_TYPE[color] || 'blocked';
}

/**
 * Calculate connections for a tile based on neighbors
 */
function calculateConnections(
	tiles: (TileType | null)[][],
	x: number,
	y: number
): Direction[] {
	const connections: Direction[] = [];
	const currentType = tiles[y]?.[x];

	if (!currentType || !WALKABLE_TYPES.includes(currentType)) {
		return [];
	}

	// Check each direction
	const directions: { dir: Direction; dx: number; dy: number }[] = [
		{ dir: 'north', dx: 0, dy: -1 },
		{ dir: 'south', dx: 0, dy: 1 },
		{ dir: 'east', dx: 1, dy: 0 },
		{ dir: 'west', dx: -1, dy: 0 }
	];

	for (const { dir, dx, dy } of directions) {
		const nx = x + dx;
		const ny = y + dy;

		if (nx >= 0 && nx < BOARD_WIDTH && ny >= 0 && ny < BOARD_HEIGHT) {
			const neighborType = tiles[ny]?.[nx];
			if (neighborType && WALKABLE_TYPES.includes(neighborType)) {
				connections.push(dir);
			}
		}
	}

	return connections;
}

/**
 * Determine spawn zone ID based on position (1-4 for corners)
 */
function getSpawnZone(x: number, y: number, type: TileType): number | undefined {
	if (!['spawn_zone', 'spawn_point', 'spawn_entry'].includes(type)) {
		return undefined;
	}

	// Corners: top-left=1, top-right=2, bottom-left=3, bottom-right=4
	const midX = BOARD_WIDTH / 2;
	const midY = BOARD_HEIGHT / 2;

	if (x < midX && y < midY) return 1; // Top-left
	if (x >= midX && y < midY) return 2; // Top-right
	if (x < midX && y >= midY) return 3; // Bottom-left
	return 4; // Bottom-right
}

/**
 * Determine teleporter group (1-4 for outer, 0 for inner)
 */
function getTeleporterGroup(
	x: number,
	y: number,
	type: TileType
): number | undefined {
	if (!type.startsWith('teleporter')) {
		return undefined;
	}

	// Center area is roughly in the middle
	const centerX = BOARD_WIDTH / 2;
	const centerY = BOARD_HEIGHT / 2;
	const distFromCenter = Math.sqrt(
		Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
	);

	// If close to center, it's the inner teleporter
	if (distFromCenter < 5) {
		return 0; // Inner teleporter
	}

	// Otherwise, determine quadrant for outer teleporter
	if (x < centerX && y < centerY) return 1;
	if (x >= centerX && y < centerY) return 2;
	if (x < centerX && y >= centerY) return 3;
	return 4;
}

/**
 * Main parsing function
 */
function generateBoardData() {
	const svgPath = join(__dirname, '../static/Map.svg');
	console.log(`Parsing SVG from: ${svgPath}`);

	const pixelColors = parseSvg(svgPath);

	// First pass: determine tile types
	const tileTypes: TileType[][] = [];
	for (let y = 0; y < BOARD_HEIGHT; y++) {
		tileTypes[y] = [];
		for (let x = 0; x < BOARD_WIDTH; x++) {
			const color = getTileColor(pixelColors, x, y);
			tileTypes[y][x] = getTileType(color);
		}
	}

	// Second pass: create full tile objects with connections
	const tiles: Tile[][] = [];
	const shops: Position[] = [];
	const shadowRealmTiles: Position[] = [];
	const teleporterOuter: Position[] = [];
	let teleporterInner: Position = { x: 24, y: 24 }; // Default to center
	let buttonTile: Position = { x: 24, y: 24 };

	for (let y = 0; y < BOARD_HEIGHT; y++) {
		tiles[y] = [];
		for (let x = 0; x < BOARD_WIDTH; x++) {
			let type = tileTypes[y][x];
			const position = { x, y };
			const walkable = WALKABLE_TYPES.includes(type);
			const connections = calculateConnections(tileTypes, x, y);

			// Collect special tiles
			if (type === 'shop') {
				shops.push(position);
			} else if (type === 'shadow_realm') {
				shadowRealmTiles.push(position);
			} else if (type === 'button') {
				buttonTile = position;
			}

			// Handle teleporter classification
			let teleporterGroup: number | undefined;
			if (type === 'teleporter_outer') {
				teleporterGroup = getTeleporterGroup(x, y, type);
				if (teleporterGroup === 0) {
					type = 'teleporter_inner';
					teleporterInner = position;
				} else {
					teleporterOuter.push(position);
				}
			}

			tiles[y][x] = {
				type,
				position,
				walkable,
				connections,
				spawnZone: getSpawnZone(x, y, type),
				teleporterGroup
			};
		}
	}

	// Collect spawn zones
	const spawnZones = [1, 2, 3, 4].map((id) => {
		const zoneTiles: Position[] = [];
		const entryPoints: Position[] = [];
		const spawnPoints: Position[] = [];

		for (let y = 0; y < BOARD_HEIGHT; y++) {
			for (let x = 0; x < BOARD_WIDTH; x++) {
				const tile = tiles[y][x];
				if (tile.spawnZone === id) {
					zoneTiles.push(tile.position);
					if (tile.type === 'spawn_entry') {
						entryPoints.push(tile.position);
					} else if (tile.type === 'spawn_point') {
						spawnPoints.push(tile.position);
					}
				}
			}
		}

		return { id, tiles: zoneTiles, entryPoints, spawnPoints };
	});

	// Generate output
	const boardConfig = {
		width: BOARD_WIDTH,
		height: BOARD_HEIGHT,
		tiles,
		spawnZones,
		shops,
		teleporters: {
			outer: teleporterOuter,
			inner: teleporterInner
		},
		shadowRealmTiles,
		buttonTile
	};

	// Write to boardData.ts
	const outputPath = join(__dirname, '../src/lib/game/board/boardData.ts');
	const output = `/**
 * Auto-generated board data from Map.svg
 * Generated on: ${new Date().toISOString()}
 *
 * DO NOT EDIT MANUALLY - regenerate using: npx tsx scripts/parseSvgBoard.ts
 */

import type { BoardConfig, Tile, SpawnZone, Position, TeleporterConfig } from './types';

export const BOARD_CONFIG: BoardConfig = ${JSON.stringify(boardConfig, null, '\t')};

// Convenience exports
export const BOARD_WIDTH = ${BOARD_WIDTH};
export const BOARD_HEIGHT = ${BOARD_HEIGHT};
export const TILES = BOARD_CONFIG.tiles;
export const SPAWN_ZONES = BOARD_CONFIG.spawnZones;
export const SHOPS = BOARD_CONFIG.shops;
export const TELEPORTERS = BOARD_CONFIG.teleporters;
export const SHADOW_REALM_TILES = BOARD_CONFIG.shadowRealmTiles;
export const BUTTON_TILE = BOARD_CONFIG.buttonTile;
`;

	writeFileSync(outputPath, output);
	console.log(`\nBoard data written to: ${outputPath}`);

	// Print summary
	console.log('\n=== Board Summary ===');
	console.log(`Dimensions: ${BOARD_WIDTH}x${BOARD_HEIGHT} tiles`);
	console.log(`Shops: ${shops.length} tiles`);
	console.log(`Shadow Realm: ${shadowRealmTiles.length} tiles`);
	console.log(`Outer Teleporters: ${teleporterOuter.length} tiles`);
	console.log(`Button at: (${buttonTile.x}, ${buttonTile.y})`);

	for (const zone of spawnZones) {
		console.log(
			`Spawn Zone ${zone.id}: ${zone.tiles.length} tiles, ${zone.entryPoints.length} entries, ${zone.spawnPoints.length} spawn points`
		);
	}

	// Count tile types
	const typeCounts = new Map<TileType, number>();
	for (let y = 0; y < BOARD_HEIGHT; y++) {
		for (let x = 0; x < BOARD_WIDTH; x++) {
			const type = tiles[y][x].type;
			typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
		}
	}

	console.log('\n=== Tile Type Counts ===');
	for (const [type, count] of typeCounts) {
		console.log(`${type}: ${count}`);
	}
}

generateBoardData();
