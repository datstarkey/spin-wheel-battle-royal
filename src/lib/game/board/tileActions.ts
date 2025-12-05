/**
 * Tile Actions
 *
 * Handles what happens when a player lands on different tile types.
 */

import type { Player } from '../player/player.svelte';
import type { Position, TileType } from './types';
import { getTileAt, isOuterTeleporter, getOtherOuterTeleporters, getInnerTeleporter } from './board.svelte';
import { generateButtonWheel } from '../wheels/buttonWheel';
import { generateCasinoWheel } from '../wheels/casinoWheel';
import { generateLootWheel } from '../wheels/lootWheel';
import { addAuditTrail, currentGame } from '$lib/stores/gameStore.svelte';

export interface TileActionResult {
	/** Whether the action was handled */
	handled: boolean;
	/** Whether to open a UI modal (e.g., shop, teleporter selection, casino) */
	openModal?: 'shop' | 'teleporter' | 'casino';
	/** For teleporter: available destinations */
	teleporterDestinations?: Position[];
	/** Message to display */
	message?: string;
}

/**
 * Execute tile action when a player lands on a tile
 */
export function executeTileAction(player: Player, position: Position): TileActionResult {
	const tile = getTileAt(position);
	if (!tile) {
		return { handled: false };
	}

	switch (tile.type) {
		case 'shop':
			return handleShopTile(player);

		case 'shadow_realm':
			return handleShadowRealmTile(player);

		case 'teleporter_outer':
			return handleOuterTeleporter(player, position);

		case 'teleporter_inner':
			return handleInnerTeleporter(player);

		case 'button':
			return handleButtonTile(player);

		case 'casino':
			return handleCasinoTile(player);

		case 'treasure':
			return handleTreasureTile(player, position);

		case 'spawn_entry':
			return handleSpawnEntry(player);

		default:
			return { handled: false };
	}
}

/**
 * Handle landing on a shop tile
 */
function handleShopTile(player: Player): TileActionResult {
	addAuditTrail(`${player.name} arrived at the shop!`);
	return {
		handled: true,
		openModal: 'shop',
		message: `${player.name} can buy items at the shop.`
	};
}

/**
 * Handle landing on a shadow realm tile
 */
function handleShadowRealmTile(player: Player): TileActionResult {
	if (!player.inShadowRealm) {
		player.inShadowRealm = true;
		addAuditTrail(`${player.name} has entered the Shadow Realm!`);
		return {
			handled: true,
			message: `${player.name} has entered the Shadow Realm! They must spin the Shadow Realm wheel each turn.`
		};
	}
	return { handled: false };
}

/**
 * Handle stepping on an outer teleporter
 */
function handleOuterTeleporter(player: Player, currentPosition: Position): TileActionResult {
	const destinations = getOtherOuterTeleporters(currentPosition);
	addAuditTrail(`${player.name} stepped on a teleporter!`);
	return {
		handled: true,
		openModal: 'teleporter',
		teleporterDestinations: destinations,
		message: `${player.name} can teleport to another location. Choose a destination.`
	};
}

/**
 * Handle being on the inner (center) teleporter - exit only
 */
function handleInnerTeleporter(player: Player): TileActionResult {
	// Inner teleporter is exit-only, so landing here doesn't trigger anything special
	// Players arrive here from outer teleporters
	addAuditTrail(`${player.name} arrived at the center teleporter.`);
	return {
		handled: true,
		message: `${player.name} teleported to the center!`
	};
}

/**
 * Handle landing on the button tile
 */
function handleButtonTile(player: Player): TileActionResult {
	addAuditTrail(`${player.name} pressed THE BUTTON!`);
	generateButtonWheel(player.name);
	return {
		handled: true,
		message: `${player.name} pressed THE BUTTON! Spin the Button Wheel!`
	};
}

/**
 * Handle landing on a casino tile
 */
function handleCasinoTile(player: Player): TileActionResult {
	addAuditTrail(`${player.name} entered the Casino!`);
	return {
		handled: true,
		openModal: 'casino',
		message: `${player.name} can gamble at the casino!`
	};
}

/**
 * Handle landing on a treasure chest tile
 */
function handleTreasureTile(player: Player, position: Position): TileActionResult {
	const game = currentGame.value;
	if (!game) {
		return { handled: false };
	}

	// Check if this treasure has already been looted
	if (game.isTreasureLooted(position.x, position.y)) {
		return {
			handled: true,
			message: `This treasure chest has already been looted.`
		};
	}

	// Mark the treasure as looted and generate the loot wheel
	game.lootTreasure(position.x, position.y);
	addAuditTrail(`${player.name} found a treasure chest!`);
	generateLootWheel(player.name);

	return {
		handled: true,
		message: `${player.name} found a treasure chest! Spin the Loot Wheel!`
	};
}

/**
 * Handle exiting spawn zone through spawn entry
 */
function handleSpawnEntry(player: Player): TileActionResult {
	// Check if player was in shadow realm and is now leaving
	if (player.inShadowRealm) {
		// Check if they're moving OUT of shadow realm area
		// This would need more context about where they came from
		// For now, just log the movement
	}
	return { handled: false };
}

/**
 * Check if player is leaving the shadow realm
 */
export function checkLeavingShadowRealm(player: Player, newPosition: Position): void {
	if (!player.inShadowRealm) return;

	const newTile = getTileAt(newPosition);
	if (newTile && newTile.type !== 'shadow_realm') {
		player.inShadowRealm = false;
		addAuditTrail(`${player.name} has escaped the Shadow Realm!`);
	}
}

/**
 * Teleport a player to a destination
 */
export function teleportPlayer(
	player: Player,
	destination: Position,
	setPosition: (playerId: string, pos: Position) => void
): void {
	setPosition(player.name, destination);
	addAuditTrail(`${player.name} teleported to (${destination.x}, ${destination.y})!`);

	// Execute tile action at destination (but not for teleporter to avoid loops)
	const destTile = getTileAt(destination);
	if (destTile && destTile.type !== 'teleporter_outer' && destTile.type !== 'teleporter_inner') {
		executeTileAction(player, destination);
	}
}
