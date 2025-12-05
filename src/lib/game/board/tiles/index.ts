/**
 * Tile SVG Exports
 *
 * Each tile type has a corresponding SVG file for rendering
 */

import type { TileType } from '../types';

// Import SVGs as components/URLs
import blockedSvg from './blocked.svg';
import pathSvg from './path.svg';
import spawnZoneSvg from './spawn_zone.svg';
import spawnPointSvg from './spawn_point.svg';
import spawnEntrySvg from './spawn_entry.svg';
import shopSvg from './shop.svg';
import shadowRealmSvg from './shadow_realm.svg';
import teleporterOuterSvg from './teleporter_outer.svg';
import teleporterInnerSvg from './teleporter_inner.svg';
import buttonSvg from './button.svg';

/**
 * Map of tile types to their SVG assets
 */
export const TILE_SVGS: Record<TileType, string> = {
	blocked: blockedSvg,
	path: pathSvg,
	spawn_zone: spawnZoneSvg,
	spawn_point: spawnPointSvg,
	spawn_entry: spawnEntrySvg,
	shop: shopSvg,
	shadow_realm: shadowRealmSvg,
	teleporter_outer: teleporterOuterSvg,
	teleporter_inner: teleporterInnerSvg,
	button: buttonSvg,
	treasure: pathSvg, // Uses path appearance with yellow border
	casino: shopSvg // Uses shop appearance with casino styling
};

/**
 * Get the SVG for a tile type
 */
export function getTileSvg(type: TileType): string {
	return TILE_SVGS[type];
}

/**
 * Tile display names for UI
 */
export const TILE_NAMES: Record<TileType, string> = {
	blocked: 'Blocked',
	path: 'Path',
	spawn_zone: 'Spawn Zone',
	spawn_point: 'Spawn Point',
	spawn_entry: 'Spawn Entry',
	shop: 'Shop',
	shadow_realm: 'Shadow Realm',
	teleporter_outer: 'Teleporter',
	teleporter_inner: 'Teleporter (Exit)',
	button: 'The Button',
	treasure: 'Treasure Chest',
	casino: 'Casino'
};

/**
 * Tile descriptions for tooltips
 */
export const TILE_DESCRIPTIONS: Record<TileType, string> = {
	blocked: 'Cannot walk here',
	path: 'A walkable path',
	spawn_zone: 'Player starting area',
	spawn_point: 'Spawn location marker',
	spawn_entry: 'Entry/exit from spawn zone',
	shop: 'Buy items here',
	shadow_realm: 'Enter the Shadow Realm...',
	teleporter_outer: 'Teleport to another location',
	teleporter_inner: 'Teleporter exit point only',
	button: 'Press for a special reward!',
	treasure: 'Open for random loot!',
	casino: 'Gamble for gold and prizes! (5g entry fee)'
};
