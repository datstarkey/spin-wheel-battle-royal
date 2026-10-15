import { Game } from '#lib/game/game.svelte.js';
import { getInnerTeleporter, getPathDistance } from '#lib/game/board/board.svelte.js';
import { positionsEqual } from '#lib/game/board/types.js';
import { executeTileAction } from '#lib/game/board/tileActions.js';
import { canAttackTarget, getPlayerValidMoves, isPlayerOnTile } from '#lib/game/rules.js';
import { breakRuneOfPower, grantUnusedMovementMana } from '#lib/game/classes/magicman.js';
import { type ClassType } from '#lib/game/classes/classType.js';
import items, { getItemByType, type AllItems } from '#lib/game/items/itemTypes.js';
import type { Consumables } from '#lib/game/items/itemTypes.js';
import type { Player } from '#lib/game/player/player.svelte.js';
import {
	GM_GAME_FLAGS,
	GM_GAME_NUMBERS,
	GM_STATS,
	type ActionOf,
	type GMGameValues,
	type GMStat,
	type GMWheelType,
	type Role
} from '#lib/multiplayer/types.js';
import { LUCKY_STREAK_RESOURCE, updateLuckyStreakMultipliers } from '#lib/game/classes/gambler.js';
import statusEffects from '#lib/game/statuses/statusTypes.js';
import { createCombatWheel } from '#lib/game/combat.js';
import { generateButtonWheel } from '#lib/game/wheels/buttonWheel.js';
import { generateCasinoWheel } from '#lib/game/wheels/casinoWheel.js';
import { generateGamblerWheel } from '#lib/game/wheels/gamblerWheel.js';
import { generateLootWheel } from '#lib/game/wheels/lootWheel.js';
import { generateShadowRealmWheel } from '#lib/game/wheels/shadowRealm.js';
import {
	generateMajorSpellWheel,
	generateMinorSpellWheel,
	generateUltimateSpellWheel
} from '#lib/game/wheels/spellWheels.js';
import type { ActionResult } from './actionHandler';
import type { GameRoom, PendingWheel } from './gameRooms';
import { toPendingWheelPayload } from './pendingWheelPayload';
import type { ServerGameContext } from './serverGameContext';
import { startTurnOrderSetup } from './setupFlow';
import { generateShuffleOrder, weightedRandomIndex } from './wheelUtils';

type GMEditAction = ActionOf<
	| 'GM_SET_STAT'
	| 'GM_SET_RESOURCE'
	| 'GM_SET_SHADOW_REALM'
	| 'GM_ADD_STATUS'
	| 'GM_REMOVE_STATUS'
	| 'GM_REMOVE_MODIFIER'
>;
type GMSimplePlayerAction = Extract<
	ActionOf<
		'GM_SET_CLASS' | 'GM_GIVE_ITEM' | 'GM_KILL_PLAYER' | 'GM_REVIVE_PLAYER' | 'GM_REMOVE_ITEM'
	>,
	{
		type:
			'GM_SET_CLASS' | 'GM_GIVE_ITEM' | 'GM_KILL_PLAYER' | 'GM_REVIVE_PLAYER' | 'GM_REMOVE_ITEM';
	}
>;
type MoveAction = ActionOf<'MOVE'>;
type AttackResolveAction = ActionOf<'ATTACK_RESOLVE'>;
type SpellCastAction = ActionOf<'SPELL_CAST'>;
type UseConsumableAction = ActionOf<'USE_CONSUMABLE'>;
type TeleportAction = ActionOf<'TELEPORT'>;
type WheelSpinResultAction = ActionOf<'WHEEL_SPIN_RESULT'>;

/**
 * Return type contract for action executors:
 * - `void`: success — `handleAction` builds the standard result with delta/state
 * - `{ success: false, ... }`: early error return
 * - `{ success: true, ... }`: custom success result (bypasses `buildActionSuccessResult`)
 */
export type ActionMutationResult = ActionResult | void;

export const gmWheelGenerators: Record<
	GMWheelType,
	(playerName: string, ctx: ServerGameContext) => void
> = {
	loot: generateLootWheel,
	button: generateButtonWheel,
	casino: generateCasinoWheel,
	shadow: generateShadowRealmWheel,
	gambler: generateGamblerWheel
};

const spellManaCosts: Record<SpellCastAction['spellLevel'], number> = {
	minor: 25,
	major: 50,
	ultimate: 100
};

const spellWheelGenerators: Record<
	SpellCastAction['spellLevel'],
	(playerName: string, ctx: ServerGameContext, target?: Player) => void
> = {
	minor: generateMinorSpellWheel,
	major: generateMajorSpellWheel,
	ultimate: generateUltimateSpellWheel
};

function getPlayerNotFoundResult(): ActionResult {
	return { success: false, error: 'Player not found' };
}

function withPlayer(
	game: Game,
	playerName: string,
	handler: (player: Player) => ActionMutationResult
): ActionMutationResult {
	const player = game.getPlayerByName(playerName);
	if (!player) return getPlayerNotFoundResult();
	return handler(player);
}

function withPlayers(
	game: Game,
	playerNames: [string, string],
	handler: (firstPlayer: Player, secondPlayer: Player) => ActionMutationResult
): ActionMutationResult {
	const [firstPlayerName, secondPlayerName] = playerNames;
	const firstPlayer = game.getPlayerByName(firstPlayerName);
	const secondPlayer = game.getPlayerByName(secondPlayerName);
	if (!firstPlayer || !secondPlayer) return getPlayerNotFoundResult();
	return handler(firstPlayer, secondPlayer);
}

function isValidNonNegativeNumber(value: number): boolean {
	return typeof value === 'number' && isFinite(value) && value >= 0;
}

function collectNewPendingWheels(room: GameRoom, existingWheels: Set<PendingWheel>) {
	const newPendingWheels = [];
	for (const [key, wheel] of room.pendingWheels) {
		if (existingWheels.has(wheel)) continue;

		if (!wheel.shuffledOrder) {
			wheel.shuffledOrder = generateShuffleOrder(wheel.items.length);
		}

		newPendingWheels.push(toPendingWheelPayload(key, wheel));
	}

	return newPendingWheels;
}

export function buildActionSuccessResult(params: {
	room: GameRoom;
	game: Game;
	beforeState: string;
	existingWheels: Set<PendingWheel>;
}): ActionResult {
	const { room, game, beforeState, existingWheels } = params;

	game.checkForWinner();
	// A player who died on their own turn forfeits the rest of it once their wheels resolve
	if (game.currentPlayer?.dead && room.pendingWheels.size === 0) game.finishTurn();

	const pendingWheels = collectNewPendingWheels(room, existingWheels);
	room.touch();

	const gameState = game.serialize();
	room.stateVersion++;
	const delta = Game.generateDelta(beforeState, gameState, room.stateVersion);

	return {
		success: true,
		gameState,
		delta: delta ?? undefined,
		pendingWheels: pendingWheels.length > 0 ? pendingWheels : undefined
	};
}

const EQUIPMENT_SLOTS = ['mainhand', 'offHand', 'helm', 'chest'] as const;

function removeItemFromPlayer(
	player: Player,
	item: AllItems,
	slot?: string
): ActionResult | undefined {
	const itemDef = getItemByType(item);
	if (!itemDef) return { success: false, error: 'Invalid item' };
	if (itemDef.type === 'consumables') {
		const idx = player.gear.consumables.indexOf(item as Consumables);
		if (idx < 0) return { success: false, error: 'Player does not have this consumable' };
		player.gear.deleteItem('consumables', idx);
		return;
	}

	// A main-hand item can sit in the off hand, so the caller says which slot to empty
	const target = EQUIPMENT_SLOTS.find((s) => s === slot) ?? itemDef.type;
	player.gear.unequipItem(target);
}

export function assignClassToPlayer(
	game: Game,
	playerName: string,
	classType: ClassType,
	auditMessage?: string
): ActionMutationResult {
	return withPlayer(game, playerName, (player) => {
		player.assignClass(classType);
		if (auditMessage) {
			game.addAuditTrail(auditMessage);
		}
	});
}

export function handleGMSetGameAction(game: Game, values: GMGameValues): ActionMutationResult {
	if (typeof values !== 'object' || values === null) {
		return { success: false, error: 'Invalid values' };
	}
	for (const [field, value] of Object.entries(values)) {
		const isNumber = (GM_GAME_NUMBERS as readonly string[]).includes(field);
		const isFlag = (GM_GAME_FLAGS as readonly string[]).includes(field);
		const valid = isNumber ? Number.isFinite(value) : isFlag && typeof value === 'boolean';
		if (!valid) return { success: false, error: `Invalid value for ${field}` };
	}
	Object.assign(game, values);
	game.addAuditTrail('The GM adjusted the game settings');
}

export function handleGMSetTurnAction(game: Game, playerName: string): ActionMutationResult {
	const slot = Object.entries(game.playerOrder).find(([, name]) => name === playerName)?.[0];
	if (slot === undefined) return getPlayerNotFoundResult();
	game.setTurnTo(Number(slot));
}

export function handleGMSkipTurnAction(
	game: Game,
	playerName: string,
	skip: boolean
): ActionMutationResult {
	return withPlayer(game, playerName, (player) => {
		if (skip) {
			game.skipNextTurn(player);
			game.addAuditTrail(`${playerName}'s next turn will be skipped`);
		} else {
			game.skippedNextTurns.delete(playerName);
		}
	});
}

/** Bonus stats may go negative (debuffs); everything else is a non-negative amount */
const SIGNED_GM_STATS: ReadonlySet<GMStat> = new Set(['bonusAttack', 'bonusDefense']);

export function handleGMEditAction(game: Game, action: GMEditAction): ActionMutationResult {
	return withPlayer(game, action.playerName, (player) => {
		switch (action.type) {
			case 'GM_SET_STAT': {
				const valid =
					GM_STATS.includes(action.stat) &&
					Number.isFinite(action.value) &&
					(SIGNED_GM_STATS.has(action.stat) || action.value >= 0);
				if (!valid) return { success: false, error: 'Invalid stat value' };
				player[action.stat] = Math.round(action.value);
				return;
			}
			case 'GM_SET_RESOURCE':
				// New keys are allowed: class resources (Mana, Swenergy) only exist once first initialised
				if (typeof action.resource !== 'string' || action.resource in Object.prototype) {
					return { success: false, error: 'Invalid resource' };
				}
				if (!isValidNonNegativeNumber(action.value)) {
					return { success: false, error: 'Invalid resource value' };
				}
				player.resources[action.resource] = Math.round(action.value);
				if (action.resource === LUCKY_STREAK_RESOURCE) updateLuckyStreakMultipliers(player);
				return;
			case 'GM_SET_SHADOW_REALM':
				if (action.inShadowRealm) game.addPlayerToShadowRealm(player);
				else game.removePlayerFromShadowRealm(player);
				return;
			case 'GM_ADD_STATUS':
				if (
					!Object.hasOwn(statusEffects, action.status) ||
					!player.statuses.canHaveStatus(action.status)
				) {
					return { success: false, error: 'Invalid status' };
				}
				player.statuses.addStatus(action.status);
				return;
			case 'GM_REMOVE_STATUS':
				player.statuses.removeStatus(action.status);
				return;
			case 'GM_REMOVE_MODIFIER':
				player.removeStatModifier(action.source, action.stat);
				return;
		}
	});
}

export function handleGMSimplePlayerAction(
	game: Game,
	action: GMSimplePlayerAction
): ActionMutationResult {
	switch (action.type) {
		case 'GM_SET_CLASS':
			return assignClassToPlayer(game, action.playerName, action.classType);
		case 'GM_GIVE_ITEM':
			return withPlayer(game, action.playerName, (player) => {
				player.assignItem(action.item);
			});
		case 'GM_KILL_PLAYER':
			return withPlayer(game, action.playerName, (player) => {
				player.hp = 0;
			});
		case 'GM_REVIVE_PLAYER':
			return withPlayer(game, action.playerName, (player) => {
				player.revive();
			});
		case 'GM_REMOVE_ITEM':
			return withPlayer(game, action.playerName, (player) =>
				removeItemFromPlayer(player, action.item, action.slot)
			);
	}
}

export function handleMoveAction(
	game: Game,
	playerName: string,
	action: MoveAction,
	ctx: ServerGameContext
): ActionMutationResult {
	return withPlayer(game, playerName, (player) => {
		if (game.hasMoved) return { success: false, error: 'Already moved this turn' };
		if (!player.position) return { success: false, error: 'Player has no position' };

		const isValid = getPlayerValidMoves(player).some((p) => positionsEqual(p, action.position));
		if (!isValid) return { success: false, error: 'Invalid move' };

		const oldPos = player.position;
		player.position = { ...action.position };
		game.hasMoved = true;

		game.addAuditTrail(
			`${player.name} moved from (${oldPos.x}, ${oldPos.y}) to (${action.position.x}, ${action.position.y})`
		);

		if (player.classType === 'magicman') {
			breakRuneOfPower(player, 'breaks as they step off it');
			const tilesMovedThisTurn = getPathDistance(oldPos, action.position, player.movement);
			const unusedMovement = player.movement - tilesMovedThisTurn;
			if (unusedMovement > 0) {
				grantUnusedMovementMana(player, unusedMovement);
			}
		}

		const tileResult = executeTileAction(player, action.position, ctx);
		if (tileResult.openModal === 'teleporter') {
			game.teleportDestinations = [
				...(tileResult.teleporterDestinations ?? []),
				getInnerTeleporter()
			];
		}
	});
}

function getShopError(game: Game, player: Player): string | undefined {
	if (player.inShadowRealm) return 'No shopping in the Shadow Realm';
	if (!isPlayerOnTile(player, 'shop')) return 'Must be on a shop tile';
	if (game.hasShopped) return 'Already shopped this turn';
}

export function handleShopBuyAction(
	game: Game,
	playerName: string,
	action: ActionOf<'SHOP_BUY'>
): ActionMutationResult {
	return withPlayer(game, playerName, (player) => {
		const error = getShopError(game, player);
		if (error) return { success: false, error };
		if (!game.shopItems.some(([key]) => key === action.item)) {
			return { success: false, error: 'Item is not in the shop' };
		}
		if (!player.canBuyItem(action.item)) return { success: false, error: 'Cannot buy this item' };
		player.buyItem(action.item);
	});
}

export function handleShopRerollAction(game: Game, playerName: string): ActionMutationResult {
	return withPlayer(game, playerName, (player) => {
		const error = getShopError(game, player);
		if (error) return { success: false, error };
		if (!game.rerollShopItems()) return { success: false, error: 'Cannot afford reroll' };
	});
}

export function handleCasinoAction(
	game: Game,
	playerName: string,
	ctx: ServerGameContext
): ActionMutationResult {
	return withPlayer(game, playerName, (player) => {
		if (player.inShadowRealm) return { success: false, error: 'No gambling in the Shadow Realm' };
		if (!isPlayerOnTile(player, 'casino'))
			return { success: false, error: 'Must be on a casino tile' };
		if (ctx.getHasUsedCasinoThisTurn())
			return { success: false, error: 'Already used casino this turn' };
		generateCasinoWheel(playerName, ctx);
	});
}

export function handleAttackResolveAction(
	room: GameRoom,
	game: Game,
	playerName: string,
	action: AttackResolveAction,
	ctx: ServerGameContext
): ActionResult {
	if (action.attackerName !== playerName) {
		return { success: false, error: 'Cannot attack as another player' };
	}
	if (game.hasFought) return { success: false, error: 'Already fought this turn' };

	return (
		withPlayers(game, [action.attackerName, action.defenderName], (attacker, defender) => {
			if (!canAttackTarget(attacker, defender)) {
				return { success: false, error: 'Target cannot be attacked' };
			}

			const combatWheelKey = `combat-${attacker.name}-vs-${defender.name}-${Date.now()}`;
			const combatWheel = createCombatWheel(attacker, defender, ctx);
			const pendingWheel = {
				items: combatWheel.wheel,
				forPlayerName: attacker.name,
				type: 'combat' as const,
				shuffledOrder: generateShuffleOrder(combatWheel.wheel.length)
			};
			room.pendingWheels.set(combatWheelKey, pendingWheel);
			game.hasFought = true;

			room.touch();
			room.stateVersion++;

			return {
				success: true,
				gameState: game.serialize(),
				combat: {
					attackerName: attacker.name,
					defenderName: defender.name,
					attackWeight: combatWheel.attackWeight,
					defenseWeight: combatWheel.defenseWeight,
					wheelKey: combatWheelKey
				},
				pendingWheels: [toPendingWheelPayload(combatWheelKey, pendingWheel)]
			};
		}) ?? getPlayerNotFoundResult()
	);
}

export function handleSpellCastAction(
	game: Game,
	playerName: string,
	action: SpellCastAction,
	ctx: ServerGameContext
): ActionMutationResult {
	return withPlayer(game, playerName, (caster) => {
		if (caster.classType !== 'magicman')
			return { success: false, error: 'Only Magic Man can cast spells' };
		if (game.hasFought) return { success: false, error: 'Already fought this turn' };

		const cost = spellManaCosts[action.spellLevel];
		const mana = caster.resources['Mana'] ?? 0;
		if (mana < cost)
			return { success: false, error: `Not enough mana (need ${cost}, have ${mana})` };

		const target = action.targetName ? game.getPlayerByName(action.targetName) : undefined;
		if (action.targetName && (!target || target.dead)) {
			return { success: false, error: 'Invalid spell target' };
		}
		spellWheelGenerators[action.spellLevel](playerName, ctx, target);
		game.hasFought = true;
	});
}

export function handleUseConsumableAction(
	game: Game,
	playerName: string,
	action: UseConsumableAction
): ActionMutationResult {
	return withPlayer(game, playerName, (player) => {
		if (!(action.item in items.consumables))
			return { success: false, error: 'Item is not a consumable' };

		const consumableItem = action.item as Consumables;
		if (!player.gear.consumables.includes(consumableItem))
			return { success: false, error: 'Player does not own this consumable' };

		player.gear.useConsumable(consumableItem);
	});
}

export function handleTeleportAction(
	game: Game,
	playerName: string,
	action: TeleportAction,
	ctx: ServerGameContext
): ActionMutationResult {
	return withPlayer(game, playerName, (player) => {
		const destination = game.teleportDestinations.find((p) =>
			positionsEqual(p, action.destination)
		);
		if (!destination) return { success: false, error: 'Not a teleport destination' };

		// No tile action on arrival: landing on another outer teleporter must not offer a second jump
		player.position = { ...destination };
		game.teleportDestinations = [];
		ctx.addAuditTrail(`${player.name} teleported to (${destination.x}, ${destination.y})`);
	});
}

export function handleWheelSpinResultAction(
	room: GameRoom,
	playerName: string,
	role: Role,
	action: WheelSpinResultAction
): ActionResult | undefined {
	const pendingWheel = room.pendingWheels.get(action.wheelKey);
	if (!pendingWheel) return { success: false, error: 'Wheel not found or already spun' };

	if (pendingWheel.forPlayerName !== playerName && role !== 'gm') {
		return { success: false, error: 'Not your wheel to spin' };
	}

	// The server always decides the outcome; it is only chosen here if nobody requested a spin
	const index = pendingWheel.chosenIndex ?? weightedRandomIndex(pendingWheel.items);

	// Delete first: onWin may queue a follow-up wheel under the same key
	room.pendingWheels.delete(action.wheelKey);
	pendingWheel.items[index]?.onWin?.();
}

export function handleGMStartGameAction(room: GameRoom, game: Game): ActionResult | undefined {
	if (room.phase !== 'waiting') {
		return { success: false, error: 'Game setup already in progress' };
	}
	if (game.players.length < 2) {
		return { success: false, error: 'Need at least 2 players to start' };
	}

	room.phase = 'turn_order';
	room.turnOrder = [];
	startTurnOrderSetup(room, assignClassToPlayer);
}
