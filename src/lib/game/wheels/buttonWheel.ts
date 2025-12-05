import { addAuditTrail, addCustomWheel, currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
import toast from '$lib/stores/toaster.svelte';
import type { Position } from '../board/types';
import type { Player } from '../player/player.svelte';
import { generateLootWheel } from './lootWheel';
import type { WheelBase } from './wheels';

/**
 * Rotates all players around the board center.
 * Each player moves to the next player's position (and shadow realm status) in angular order.
 * @param clockwise - true for clockwise, false for counter-clockwise
 */
function rotatePlayersAroundCenter(clockwise: boolean) {
	if (!currentGame.value) return;

	const BOARD_CENTER: Position = { x: 12, y: 12 };

	// Get all alive players with positions
	const playersWithPositions = currentGame.value.alivePlayers.filter(
		(p): p is Player & { position: Position } => p.position !== null
	);

	if (playersWithPositions.length < 2) {
		toast.error('Need at least 2 players to rotate!');
		return;
	}

	// Calculate angle from center for each player and sort
	const playersWithAngles = playersWithPositions.map((player) => {
		const dx = player.position.x - BOARD_CENTER.x;
		const dy = player.position.y - BOARD_CENTER.y;
		const angle = Math.atan2(dy, dx);
		return { player, angle };
	});

	// Sort by angle (clockwise = descending, counter-clockwise = ascending)
	playersWithAngles.sort((a, b) => (clockwise ? b.angle - a.angle : a.angle - b.angle));

	// Store original states
	const originalStates = playersWithAngles.map(({ player }) => ({
		position: { ...player.position },
		inShadowRealm: player.inShadowRealm
	}));

	// Rotate: each player gets the next player's state
	const numPlayers = playersWithAngles.length;
	for (let i = 0; i < numPlayers; i++) {
		const nextIndex = (i + 1) % numPlayers;
		const player = playersWithAngles[i].player;
		const nextState = originalStates[nextIndex];

		player.position = nextState.position;
		player.inShadowRealm = nextState.inShadowRealm;
	}

	const direction = clockwise ? 'clockwise' : 'counter-clockwise';
	addAuditTrail(`All players rotated ${direction}!`);
}

export function generateButtonWheel(playerName: string) {
	const player = getPlayerByName(playerName);

	if (!player) {
		toast.error(`Could not generate win wheel, Player ${playerName} not found!`);
		return;
	}

	if (player.dead) return;

	const wheel: WheelBase = [
		{
			label: 'Rotate Players Clockwise',
			onWin: () => {
				rotatePlayersAroundCenter(true);
			}
		},
		{
			label: 'Rotate Players Counter-Clockwise',
			onWin: () => {
				rotatePlayersAroundCenter(false);
			}
		},
		{
			label: 'Attack Someone',
			onWin: () => {
				if (currentGame.value) currentGame.value.hasFought = false;
			}
		},
		{
			label: 'Spin Loot Wheel',
			onWin: () => {
				generateLootWheel(playerName);
			}
		},
		{
			label: 'Spin 2 Loot Wheels',
			onWin: () => {
				generateLootWheel(playerName);
				generateLootWheel(playerName, 2);
			}
		},
		{
			label: 'Spin 3 Loot Wheels',
			onWin: () => {
				generateLootWheel(playerName);
				generateLootWheel(playerName, 2);
				generateLootWheel(playerName, 3);
			}
		},
		{
			label: 'Spin 4 Loot Wheels',
			onWin: () => {
				generateLootWheel(playerName);
				generateLootWheel(playerName, 2);
				generateLootWheel(playerName, 3);
				generateLootWheel(playerName, 4);
			}
		},
		{
			label: 'Gain 5 Base Attack, Base Defense, HP and Gold',
			onWin: () => {
				player.baseAttack += 5;
				player.baseDefense += 5;
				player.hp += 5;
				player.gold += 5;
			}
		},
		{
			label: 'Gain 10 gold',
			onWin: () => {
				player.gold += 10;
			}
		}
	];

	addCustomWheel(`${player.name} Button Wheel`, wheel);
}
