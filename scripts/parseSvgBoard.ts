/**
 * SVG Board Parser
 *
 * Parses the Map.svg file and generates board data for the game.
 * Uses 10:1 pixel sampling - each 10x10 pixel region becomes 1 game tile.
 * This gives us a 48x48 tile grid from the 480x480 SVG.
 *
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
	| 'button'
	| 'treasure'
	| 'casino';

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
// Using lowercase for comparison
const COLOR_TO_TILE_TYPE: Record<string, TileType> = {
	'#000000': 'blocked',
	'#249fde': 'path', // Blue paths
	'#060608': 'blocked', // Path shadows/borders - dark borders are walls
	'#dcdcdc': 'blocked', // White corner areas - blocked for now
	'#dae0ea': 'blocked', // Light gray - blocked for now
	'#430067': 'shadow_realm', // Purple
	'#59c135': 'spawn_entry', // Green
	'#dba463': 'spawn_point', // Brown/tan
	'#fffc40': 'shop', // Yellow
	'#ffd541': 'shop', // Also yellow
	'#285cc4': 'teleporter_outer', // Blue teleporter
	'#df3e23': 'casino', // Orange/red casino
	'#b4202a': 'casino', // Red casino shadow
	'#fa6a0a': 'casino', // Orange casino
	'#8b93af': 'blocked', // Gray details - structural
	'#ffffff': 'blocked' // White details - blocked for now
};

// Colors that indicate a WALL/BARRIER (blocks connections)
const WALL_COLORS = [
	'#000000', // Pure black
	'#060608', // Dark path borders
];

// Colors that are walkable for path connection purposes
const PATH_COLORS = [
	'#249fde', // Blue paths
	'#430067', // Purple shadow realm
	'#59c135', // Green spawn entry
	'#dba463', // Brown spawn point
	'#fffc40', // Yellow shop
	'#ffd541', // Yellow shop alt
	'#285cc4', // Blue teleporter
	'#df3e23', // Orange/red casino
	'#b4202a', // Red casino shadow
	'#fa6a0a', // Orange casino
];

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
	'button',
	'treasure',
	'casino'
];

// Yellow colors that indicate treasure chest borders
const YELLOW_COLORS = ['#fffc40', '#ffd541'];

// SVG is 480x480 pixels
// Each "logical tile" (game tile) is 16x16 pixels
// This gives us a 30x30 logical tile grid for gameplay
const PIXELS_PER_LOGICAL_TILE = 16;
const SVG_WIDTH = 480;
const SVG_HEIGHT = 480;
const BOARD_WIDTH = SVG_WIDTH / PIXELS_PER_LOGICAL_TILE; // 30
const BOARD_HEIGHT = SVG_HEIGHT / PIXELS_PER_LOGICAL_TILE; // 30

/**
 * Parse the SVG and extract all pixel colors into a map
 */
function parseSvg(svgPath: string): Map<string, string> {
	const content = readFileSync(svgPath, 'utf-8');
	const pixelColors = new Map<string, string>();

	// Match all rect elements: <rect x="X" y="Y" width="1" height="1" fill="#XXXXXX" />
	const rectRegex =
		/<rect\s+x="(\d+)"\s+y="(\d+)"\s+width="1"\s+height="1"\s+fill="(#[0-9a-fA-F]{6})"\s*\/>/g;

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
 * Determine the dominant tile type for a 16x16 pixel region (logical tile)
 * by counting occurrences of each tile type
 */
function getDominantTileType(
	pixelColors: Map<string, string>,
	tileX: number,
	tileY: number
): TileType {
	const typeCounts = new Map<TileType, number>();
	let yellowPixelCount = 0;
	let pathPixelCount = 0;

	// Sample all pixels in the 16x16 region
	const startX = tileX * PIXELS_PER_LOGICAL_TILE;
	const startY = tileY * PIXELS_PER_LOGICAL_TILE;

	for (let py = 0; py < PIXELS_PER_LOGICAL_TILE; py++) {
		for (let px = 0; px < PIXELS_PER_LOGICAL_TILE; px++) {
			const color = pixelColors.get(`${startX + px},${startY + py}`) || '#000000';
			const tileType = COLOR_TO_TILE_TYPE[color] || 'blocked';
			typeCounts.set(tileType, (typeCounts.get(tileType) || 0) + 1);

			// Count yellow pixels (could be shop or treasure border)
			if (YELLOW_COLORS.includes(color)) {
				yellowPixelCount++;
			}
			// Count blue path pixels
			if (color === '#249fde') {
				pathPixelCount++;
			}
		}
	}

	// Total pixels in region
	const totalPixels = PIXELS_PER_LOGICAL_TILE * PIXELS_PER_LOGICAL_TILE; // 256

	// Distinguish between shop (mostly yellow) and treasure (yellow outline on path)
	// Shop tiles are nearly all yellow (>40% yellow pixels)
	// Treasure tiles have yellow outlines but are mostly path (<40% yellow, has both yellow and path)
	const yellowRatio = yellowPixelCount / totalPixels;
	const hasYellowBorder = yellowPixelCount > 0;
	const hasPathPixels = pathPixelCount > 0;

	// If mostly yellow (>40%), it's a shop
	if (yellowRatio > 0.4) {
		return 'shop';
	}

	// If has yellow border AND path pixels (but not mostly yellow), it's a treasure chest
	if (hasPathPixels && hasYellowBorder) {
		return 'treasure';
	}

	// Find the most common walkable type, or blocked if mostly blocked
	let dominant: TileType = 'blocked';
	let maxCount = 0;

	// Priority order for special tiles (they should win even with fewer pixels)
	const priorityTypes: TileType[] = [
		'button',
		'casino',
		'teleporter_outer',
		'shop',
		'shadow_realm',
		'spawn_entry',
		'spawn_point',
		'spawn_zone',
		'path'
	];

	// First check for special types with priority
	for (const type of priorityTypes) {
		const count = typeCounts.get(type) || 0;
		// If a special type has at least 15% coverage, it wins
		if (count >= totalPixels * 0.15) {
			return type;
		}
	}

	// Otherwise find the most common type
	for (const [type, count] of typeCounts) {
		if (count > maxCount) {
			maxCount = count;
			dominant = type;
		}
	}

	return dominant;
}


/**
 * Check if a pixel color is a wall/barrier
 */
function isWallColor(color: string): boolean {
	return WALL_COLORS.includes(color);
}

/**
 * Check if a pixel color represents a walkable path
 */
function isPathColor(color: string): boolean {
	return PATH_COLORS.includes(color);
}

/**
 * Calculate connections for a tile by checking edges for walls
 * Logic: If there's a wall (black) on the edge, no connection. Otherwise check if neighbor is walkable.
 */
function calculateConnections(
	pixelColors: Map<string, string>,
	tiles: (TileType | null)[][],
	x: number,
	y: number,
	debug: boolean = false
): Direction[] {
	const connections: Direction[] = [];
	const currentType = tiles[y]?.[x];

	if (!currentType || !WALKABLE_TYPES.includes(currentType)) {
		return [];
	}

	const startX = x * PIXELS_PER_LOGICAL_TILE;
	const startY = y * PIXELS_PER_LOGICAL_TILE;

	// Check the center 6 pixels of each edge (pixels 5-10 of 16)
	const CENTER_START = 5;
	const CENTER_END = 11;

	// Helper to check if an edge has NO walls (allows connection)
	// Returns true if the edge is clear (no wall pixels), false if blocked
	function checkEdgeClear(coords: { x: number; y: number }[], label: string): boolean {
		let wallCount = 0;
		let pathCount = 0;
		const colors: string[] = [];
		for (const coord of coords) {
			const color = pixelColors.get(`${coord.x},${coord.y}`) || '#000000';
			colors.push(color);
			if (isWallColor(color)) {
				wallCount++;
			}
			if (isPathColor(color)) {
				pathCount++;
			}
		}
		if (debug) {
			console.log(`    ${label}: ${colors.join(', ')} -> ${wallCount} walls, ${pathCount} path`);
		}
		// Edge is clear if there are no wall pixels AND at least some path pixels
		return wallCount === 0 && pathCount > 0;
	}

	// Check north edge - need clear path on BOTH our top edge AND neighbor's bottom edge
	const northTile = tiles[y - 1]?.[x];
	if (y > 0 && northTile && WALKABLE_TYPES.includes(northTile)) {
		const neighborStartY = (y - 1) * PIXELS_PER_LOGICAL_TILE;

		// Our top edge (y = startY)
		const ourEdge = [];
		for (let px = CENTER_START; px < CENTER_END; px++) {
			ourEdge.push({ x: startX + px, y: startY });
		}

		// Neighbor's bottom edge (y = neighborStartY + 15)
		const neighborEdge = [];
		for (let px = CENTER_START; px < CENTER_END; px++) {
			neighborEdge.push({ x: startX + px, y: neighborStartY + PIXELS_PER_LOGICAL_TILE - 1 });
		}

		if (debug) console.log(`  Checking NORTH (${x}, ${y-1}):`);
		const ourOk = checkEdgeClear(ourEdge, 'Our top edge');
		const neighborOk = checkEdgeClear(neighborEdge, 'Neighbor bottom edge');

		if (ourOk && neighborOk) connections.push('north');
	}

	// Check south edge - need clear path on BOTH our bottom edge AND neighbor's top edge
	const southTile = tiles[y + 1]?.[x];
	if (y < BOARD_HEIGHT - 1 && southTile && WALKABLE_TYPES.includes(southTile)) {
		const neighborStartY = (y + 1) * PIXELS_PER_LOGICAL_TILE;

		// Our bottom edge (y = startY + 15)
		const ourEdge = [];
		for (let px = CENTER_START; px < CENTER_END; px++) {
			ourEdge.push({ x: startX + px, y: startY + PIXELS_PER_LOGICAL_TILE - 1 });
		}

		// Neighbor's top edge (y = neighborStartY)
		const neighborEdge = [];
		for (let px = CENTER_START; px < CENTER_END; px++) {
			neighborEdge.push({ x: startX + px, y: neighborStartY });
		}

		if (debug) console.log(`  Checking SOUTH (${x}, ${y+1}):`);
		const ourOk = checkEdgeClear(ourEdge, 'Our bottom edge');
		const neighborOk = checkEdgeClear(neighborEdge, 'Neighbor top edge');

		if (ourOk && neighborOk) connections.push('south');
	}

	// Check west edge - need clear path on BOTH our left edge AND neighbor's right edge
	const westTile = tiles[y]?.[x - 1];
	if (x > 0 && westTile && WALKABLE_TYPES.includes(westTile)) {
		const neighborStartX = (x - 1) * PIXELS_PER_LOGICAL_TILE;

		// Our left edge (x = startX)
		const ourEdge = [];
		for (let py = CENTER_START; py < CENTER_END; py++) {
			ourEdge.push({ x: startX, y: startY + py });
		}

		// Neighbor's right edge (x = neighborStartX + 15)
		const neighborEdge = [];
		for (let py = CENTER_START; py < CENTER_END; py++) {
			neighborEdge.push({ x: neighborStartX + PIXELS_PER_LOGICAL_TILE - 1, y: startY + py });
		}

		if (debug) console.log(`  Checking WEST (${x-1}, ${y}):`);
		const ourOk = checkEdgeClear(ourEdge, 'Our left edge');
		const neighborOk = checkEdgeClear(neighborEdge, 'Neighbor right edge');

		if (ourOk && neighborOk) connections.push('west');
	}

	// Check east edge - need clear path on BOTH our right edge AND neighbor's left edge
	const eastTile = tiles[y]?.[x + 1];
	if (x < BOARD_WIDTH - 1 && eastTile && WALKABLE_TYPES.includes(eastTile)) {
		const neighborStartX = (x + 1) * PIXELS_PER_LOGICAL_TILE;

		// Our right edge (x = startX + 15)
		const ourEdge = [];
		for (let py = CENTER_START; py < CENTER_END; py++) {
			ourEdge.push({ x: startX + PIXELS_PER_LOGICAL_TILE - 1, y: startY + py });
		}

		// Neighbor's left edge (x = neighborStartX)
		const neighborEdge = [];
		for (let py = CENTER_START; py < CENTER_END; py++) {
			neighborEdge.push({ x: neighborStartX, y: startY + py });
		}

		if (debug) console.log(`  Checking EAST (${x+1}, ${y}):`);
		const ourOk = checkEdgeClear(ourEdge, 'Our right edge');
		const neighborOk = checkEdgeClear(neighborEdge, 'Neighbor left edge');

		if (ourOk && neighborOk) connections.push('east');
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
function getTeleporterGroup(x: number, y: number, type: TileType): number | undefined {
	if (!type.startsWith('teleporter')) {
		return undefined;
	}

	// Center area is roughly in the middle (around 240,240)
	const centerX = BOARD_WIDTH / 2;
	const centerY = BOARD_HEIGHT / 2;
	const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

	// If close to center (within ~50 pixels), it's the inner teleporter
	if (distFromCenter < 50) {
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

	// First pass: determine tile types by sampling 10x10 pixel regions
	const tileTypes: TileType[][] = [];
	for (let y = 0; y < BOARD_HEIGHT; y++) {
		tileTypes[y] = [];
		for (let x = 0; x < BOARD_WIDTH; x++) {
			// Get dominant tile type for this 10x10 region
			tileTypes[y][x] = getDominantTileType(pixelColors, x, y);
		}
	}

	// Second pass: create full tile objects with connections
	const tiles: Tile[][] = [];
	const shops: Position[] = [];
	const shadowRealmTiles: Position[] = [];
	const treasureChests: Position[] = [];
	const teleporterOuter: Position[] = [];
	let teleporterInner: Position = { x: 240, y: 240 }; // Default to center
	let buttonTile: Position = { x: 240, y: 240 };

	for (let y = 0; y < BOARD_HEIGHT; y++) {
		tiles[y] = [];
		for (let x = 0; x < BOARD_WIDTH; x++) {
			let type = tileTypes[y][x];
			const position = { x, y };
			const connections = calculateConnections(pixelColors, tileTypes, x, y);

			// If a tile has no connections, mark it as blocked (unreachable)
			// This handles spawn entries in corners surrounded by blocked tiles
			if (connections.length === 0 && type !== 'blocked') {
				type = 'blocked';
			}

			const walkable = WALKABLE_TYPES.includes(type);

			// Collect special tiles
			if (type === 'shop') {
				shops.push(position);
			} else if (type === 'shadow_realm') {
				shadowRealmTiles.push(position);
			} else if (type === 'button') {
				buttonTile = position;
			} else if (type === 'treasure') {
				treasureChests.push(position);
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
		buttonTile,
		treasureChests
	};

	// Write to boardData.ts
	const outputPath = join(__dirname, '../src/lib/game/board/boardData.ts');
	const output = `/**
 * Auto-generated board data from Map.svg
 * Generated on: ${new Date().toISOString()}
 *
 * DO NOT EDIT MANUALLY - regenerate using: npx tsx scripts/parseSvgBoard.ts
 *
 * Board is 480x480 tiles (1:1 pixel mapping from Map.svg)
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
export const TREASURE_CHESTS = BOARD_CONFIG.treasureChests;
`;

	writeFileSync(outputPath, output);
	console.log(`\nBoard data written to: ${outputPath}`);

	// Print summary
	console.log('\n=== Board Summary ===');
	console.log(`Dimensions: ${BOARD_WIDTH}x${BOARD_HEIGHT} tiles (1:1 pixel mapping)`);
	console.log(`Shops: ${shops.length} tiles`);
	console.log(`Treasure Chests: ${treasureChests.length} tiles`);
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
