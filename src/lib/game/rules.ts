/**
 * Turn rules shared by the client UI and the server validator, so the UI never offers an
 * action the server will reject (and vice versa).
 */
import { getTileAt, getValidMoves } from './board/board.svelte';
import { canPlayerMove } from './board/teleportUtils';
import { getManhattanDistance, type Position, type TileType } from './board/types';
import type { Player } from './player/player.svelte';

export function getPlayerValidMoves(player: Player): Position[] {
	if (!player.position || !canPlayerMove(player)) return [];
	const canEnterShadowRealm = player.inShadowRealm || player.classType === 'shadeweaver';
	return getValidMoves(player.position, player.movement, !canEnterShadowRealm);
}

export function canAttackTarget(attacker: Player, target: Player): boolean {
	if (attacker === target || attacker.dead || target.dead) return false;

	const shadeweaverReach = attacker.classType === 'shadeweaver' && target.inShadowRealm;
	if (!shadeweaverReach && attacker.inShadowRealm !== target.inShadowRealm) return false;

	// Everyone in the shadow realm can reach each other; shadeweavers reach into it from anywhere
	if (attacker.inShadowRealm || shadeweaverReach) return true;

	if (!attacker.position || !target.position) return false;
	return getManhattanDistance(attacker.position, target.position) <= attacker.attackRange;
}

/** Combat wheel weights. Debuffs can push stats to 0 or below; every fighter keeps a sliver of a chance */
export function getCombatWeights(attacker: Player, defender: Player) {
	return {
		attackWeight: Math.max(1, attacker.attack),
		defenseWeight: Math.max(1, defender.defense)
	};
}

export function isPlayerOnTile(player: Player, type: TileType): boolean {
	return !!player.position && getTileAt(player.position)?.type === type;
}
