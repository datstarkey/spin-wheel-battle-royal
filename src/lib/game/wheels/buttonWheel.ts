import { getRandomSpawnPoint } from '../board/board.svelte';
import type { Position } from '../board/types';
import { requirePlayer, type GameContext } from '../gameContext';
import type { Player } from '../player/player.svelte';
import { generateLootWheel } from './lootWheel';
import type { WheelBase } from './wheels';

/**
 * Teleports a player to a random spawn point after pressing the button.
 */
function teleportToRandomSpawn(player: Player, ctx: GameContext) {
	const spawnPoint = getRandomSpawnPoint();
	player.position = { ...spawnPoint };
	ctx.addAuditTrail(`${player.name} was teleported to spawn (${spawnPoint.x}, ${spawnPoint.y})!`);
}

/**
 * Generates a combat wheel between attacker and defender.
 * The wheel outcome determines who wins, then triggers appropriate event handlers.
 */
function generateCombatWheel(attacker: Player, defender: Player, ctx: GameContext) {
	const wheel: WheelBase = [
		{
			label: attacker.name,
			weight: attacker.attack,
			onWin: () => {
				ctx.addAuditTrail(
					`${attacker.name} (ATK ${attacker.attack}) beat ${defender.name} (DEF ${defender.defense}) [Button Attack]`
				);
				attacker.onAttackWin(defender, ctx);
				defender.onDefendLose(attacker, ctx);
			}
		},
		{
			label: defender.name,
			weight: defender.defense,
			onWin: () => {
				ctx.addAuditTrail(
					`${attacker.name} (ATK ${attacker.attack}) lost to ${defender.name} (DEF ${defender.defense}) [Button Attack]`
				);
				attacker.onAttackLose(defender, ctx);
				defender.onDefendWin(attacker, ctx);
			}
		}
	];

	ctx.addCustomWheel(`${attacker.name} attacks ${defender.name}!`, wheel);
}

/**
 * Generates a wheel to select a random target for attack, then initiates combat.
 */
function generateAttackTargetWheel(attacker: Player, ctx: GameContext) {
	// Get valid attack targets (alive, not self, respecting shadow realm rules)
	const targets = ctx.getAlivePlayers().filter((p) => {
		if (p.name === attacker.name) return false;
		// Shadeweaver can attack anyone in shadow realm
		if (attacker.classType === 'shadeweaver' && p.inShadowRealm) return true;
		// In shadow realm, can attack anyone in shadow realm
		if (attacker.inShadowRealm && p.inShadowRealm) return true;
		// Normal: must share shadow realm status
		return !attacker.inShadowRealm && !p.inShadowRealm;
	});

	if (targets.length === 0) {
		ctx.addAuditTrail(`${attacker.name} found no valid attack targets!`);
		return;
	}

	const wheel: WheelBase = targets.map((target) => ({
		label: target.name,
		onWin: () => {
			ctx.addAuditTrail(`${attacker.name} must attack ${target.name}!`);
			// Trigger combat wheel between attacker and target
			generateCombatWheel(attacker, target, ctx);
		}
	}));

	ctx.addCustomWheel(`${attacker.name} Attacks Who?`, wheel);
}

/**
 * Rotates all players around the board center.
 * Each player moves to the next player's position (and shadow realm status) in angular order.
 * @param clockwise - true for clockwise, false for counter-clockwise
 */
function rotatePlayersAroundCenter(clockwise: boolean, ctx: GameContext) {
	const BOARD_CENTER: Position = { x: 12, y: 12 };

	// Get all alive players with positions
	const playersWithPositions = ctx
		.getAlivePlayers()
		.filter((p): p is Player & { position: Position } => p.position !== null);

	if (playersWithPositions.length < 2) {
		ctx.addAuditTrail('Need at least 2 players to rotate!');
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
	ctx.addAuditTrail(`All players rotated ${direction}!`);
}

export function generateButtonWheel(playerName: string, ctx: GameContext) {
	const player = requirePlayer(ctx, playerName, 'button wheel');
	if (!player || player.dead) return;

	const wheel: WheelBase = [
		{
			label: 'Rotate Players Clockwise',
			onWin: () => {
				teleportToRandomSpawn(player, ctx);
				rotatePlayersAroundCenter(true, ctx);
			}
		},
		{
			label: 'Rotate Players Counter-Clockwise',
			onWin: () => {
				teleportToRandomSpawn(player, ctx);
				rotatePlayersAroundCenter(false, ctx);
			}
		},
		{
			label: 'Attack Someone',
			onWin: () => {
				teleportToRandomSpawn(player, ctx);
				generateAttackTargetWheel(player, ctx);
			}
		},
		{
			label: 'Spin Loot Wheel',
			onWin: () => {
				generateLootWheel(playerName, ctx);
				teleportToRandomSpawn(player, ctx);
			}
		},
		{
			label: 'Spin 2 Loot Wheels',
			onWin: () => {
				generateLootWheel(playerName, ctx);
				generateLootWheel(playerName, ctx, 2);
				teleportToRandomSpawn(player, ctx);
			}
		},
		{
			label: 'Spin 3 Loot Wheels',
			onWin: () => {
				generateLootWheel(playerName, ctx);
				generateLootWheel(playerName, ctx, 2);
				generateLootWheel(playerName, ctx, 3);
				teleportToRandomSpawn(player, ctx);
			}
		},
		{
			label: 'Spin 4 Loot Wheels',
			onWin: () => {
				generateLootWheel(playerName, ctx);
				generateLootWheel(playerName, ctx, 2);
				generateLootWheel(playerName, ctx, 3);
				generateLootWheel(playerName, ctx, 4);
				teleportToRandomSpawn(player, ctx);
			}
		},
		{
			label: 'Gain 5 Base Attack, Base Defense, HP and Gold',
			onWin: () => {
				player.baseAttack += 5;
				player.baseDefense += 5;
				player.hp += 5;
				player.gold += 5;
				teleportToRandomSpawn(player, ctx);
			}
		},
		{
			label: 'Gain 10 gold',
			onWin: () => {
				player.gold += 10;
				teleportToRandomSpawn(player, ctx);
			}
		}
	];

	ctx.addCustomWheel(`${player.name} Button Wheel`, wheel, 'button');
}
