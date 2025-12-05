import { addAuditTrail, addCustomWheel, currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
import toast from '$lib/stores/toaster.svelte';
import { getRandomSpawnPoint } from '../board/board.svelte';
import type { Position } from '../board/types';
import type { Player } from '../player/player.svelte';
import { generateLootWheel } from './lootWheel';
import type { WheelBase } from './wheels';

/**
 * Teleports a player to a random spawn point after pressing the button.
 */
function teleportToRandomSpawn(player: Player) {
	const spawnPoint = getRandomSpawnPoint();
	player.position = { ...spawnPoint };
	addAuditTrail(`${player.name} was teleported to spawn (${spawnPoint.x}, ${spawnPoint.y})!`);
}

/**
 * Rotates all players around the board center.
 * Each player moves to the next player's position (and shadow realm status) in angular order.
 * @param clockwise - true for clockwise, false for counter-clockwise
 */
/**
 * Generates a combat wheel between attacker and defender.
 * The wheel outcome determines who wins, then triggers appropriate event handlers.
 */
function generateCombatWheel(attacker: Player, defender: Player) {
	const wheel: WheelBase = [
		{
			label: attacker.name,
			weight: attacker.attack,
			onWin: () => {
				addAuditTrail(
					`${attacker.name} (ATK ${attacker.attack}) beat ${defender.name} (DEF ${defender.defense}) [Button Attack]`
				);
				attacker.onAttackWin(defender);
				defender.onDefendWin(attacker);
			}
		},
		{
			label: defender.name,
			weight: defender.defense,
			onWin: () => {
				addAuditTrail(
					`${attacker.name} (ATK ${attacker.attack}) lost to ${defender.name} (DEF ${defender.defense}) [Button Attack]`
				);
				attacker.onAttackLose(defender);
				defender.onDefendLose(attacker);
			}
		}
	];

	addCustomWheel(`${attacker.name} attacks ${defender.name}!`, wheel);
}

/**
 * Generates a wheel to select a random target for attack, then initiates combat.
 */
function generateAttackTargetWheel(attacker: Player) {
	if (!currentGame.value) return;

	// Get valid attack targets (alive, not self, respecting shadow realm rules)
	const targets = currentGame.value.alivePlayers.filter((p) => {
		if (p.name === attacker.name) return false;
		// Shadeweaver can attack anyone in shadow realm
		if (attacker.classType === 'shadeweaver' && p.inShadowRealm) return true;
		// In shadow realm, can attack anyone in shadow realm
		if (attacker.inShadowRealm && p.inShadowRealm) return true;
		// Normal: must share shadow realm status
		return !attacker.inShadowRealm && !p.inShadowRealm;
	});

	if (targets.length === 0) {
		toast.error('No valid attack targets!');
		return;
	}

	const wheel: WheelBase = targets.map((target) => ({
		label: target.name,
		onWin: () => {
			addAuditTrail(`${attacker.name} must attack ${target.name}!`);
			// Trigger combat wheel between attacker and target
			generateCombatWheel(attacker, target);
		}
	}));

	addCustomWheel(`${attacker.name} Attacks Who?`, wheel);
}

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
				teleportToRandomSpawn(player);
			}
		},
		{
			label: 'Rotate Players Counter-Clockwise',
			onWin: () => {
				rotatePlayersAroundCenter(false);
				teleportToRandomSpawn(player);
			}
		},
		{
			label: 'Attack Someone',
			onWin: () => {
				teleportToRandomSpawn(player);
				generateAttackTargetWheel(player);
			}
		},
		{
			label: 'Spin Loot Wheel',
			onWin: () => {
				generateLootWheel(playerName);
				teleportToRandomSpawn(player);
			}
		},
		{
			label: 'Spin 2 Loot Wheels',
			onWin: () => {
				generateLootWheel(playerName);
				generateLootWheel(playerName, 2);
				teleportToRandomSpawn(player);
			}
		},
		{
			label: 'Spin 3 Loot Wheels',
			onWin: () => {
				generateLootWheel(playerName);
				generateLootWheel(playerName, 2);
				generateLootWheel(playerName, 3);
				teleportToRandomSpawn(player);
			}
		},
		{
			label: 'Spin 4 Loot Wheels',
			onWin: () => {
				generateLootWheel(playerName);
				generateLootWheel(playerName, 2);
				generateLootWheel(playerName, 3);
				generateLootWheel(playerName, 4);
				teleportToRandomSpawn(player);
			}
		},
		{
			label: 'Gain 5 Base Attack, Base Defense, HP and Gold',
			onWin: () => {
				player.baseAttack += 5;
				player.baseDefense += 5;
				player.hp += 5;
				player.gold += 5;
				teleportToRandomSpawn(player);
			}
		},
		{
			label: 'Gain 10 gold',
			onWin: () => {
				player.gold += 10;
				teleportToRandomSpawn(player);
			}
		}
	];

	addCustomWheel(`${player.name} Button Wheel`, wheel, 'button');
}
