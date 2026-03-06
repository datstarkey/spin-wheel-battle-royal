import { Game } from '$lib/game/game.svelte';
import {
	getPathDistance,
	getValidMoves,
	getTileAt,
	isOuterTeleporter,
	isInnerTeleporter
} from '$lib/game/board/board.svelte';
import { getManhattanDistance } from '$lib/game/board/types';
import { executeTileAction } from '$lib/game/board/tileActions';
import { grantUnusedMovementMana } from '$lib/game/classes/magicman';
import { type ClassType } from '$lib/game/classes/classType';
import items, { getItemByType, type AllItems } from '$lib/game/items/itemTypes';
import type { Consumables } from '$lib/game/items/itemTypes';
import type { Player } from '$lib/game/player/player.svelte';
import type { ActionOf, GMWheelType, Role } from '$lib/multiplayer/types';
import { createCombatWheel } from '$lib/game/combat';
import { generateButtonWheel } from '$lib/game/wheels/buttonWheel';
import { generateCasinoWheel } from '$lib/game/wheels/casinoWheel';
import { generateGamblerWheel } from '$lib/game/wheels/gamblerWheel';
import { generateLootWheel } from '$lib/game/wheels/lootWheel';
import { generateShadowRealmWheel } from '$lib/game/wheels/shadowRealm';
import {
	generateMajorSpellWheel,
	generateMinorSpellWheel,
	generateUltimateSpellWheel
} from '$lib/game/wheels/spellWheels';
import type { ActionResult } from './actionHandler';
import type { GameRoom } from './gameRooms';
import { toPendingWheelPayload } from './pendingWheelPayload';
import type { ServerGameContext } from './serverGameContext';
import { startTurnOrderSetup } from './setupFlow';
import { generateShuffleOrder } from './wheelUtils';

type GMNumericAction = Extract<
	ActionOf<'GM_SET_HP' | 'GM_SET_GOLD' | 'GM_SET_ATTACK' | 'GM_SET_DEFENSE'>,
	{ type: 'GM_SET_HP' | 'GM_SET_GOLD' | 'GM_SET_ATTACK' | 'GM_SET_DEFENSE' }
>;
type GMSimplePlayerAction = Extract<
	ActionOf<
		'GM_SET_CLASS' | 'GM_GIVE_ITEM' | 'GM_KILL_PLAYER' | 'GM_REVIVE_PLAYER' | 'GM_REMOVE_ITEM'
	>,
	{
		type:
			| 'GM_SET_CLASS'
			| 'GM_GIVE_ITEM'
			| 'GM_KILL_PLAYER'
			| 'GM_REVIVE_PLAYER'
			| 'GM_REMOVE_ITEM';
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

function collectNewPendingWheels(room: GameRoom, existingWheelKeys: Set<string>) {
	const newPendingWheels = [];
	for (const [key, wheel] of room.pendingWheels) {
		if (existingWheelKeys.has(key)) continue;

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
	existingWheelKeys: Set<string>;
}): ActionResult {
	const { room, game, beforeState, existingWheelKeys } = params;
	const pendingWheels = collectNewPendingWheels(room, existingWheelKeys);

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

function removeItemFromPlayer(player: Player, item: AllItems): ActionResult | undefined {
	const itemDef = getItemByType(item);
	if (!itemDef) return { success: false, error: 'Invalid item' };
	if (itemDef.type === 'consumables') {
		const idx = player.gear.consumables.indexOf(item as Consumables);
		if (idx < 0) return { success: false, error: 'Player does not have this consumable' };
		player.gear.deleteItem('consumables', idx);
		return;
	}

	player.gear.unequipItem(itemDef.type);
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

export function handleGMNumericAction(
	game: Game,
	action: GMNumericAction
): ActionResult | undefined {
	const player = game.getPlayerByName(action.playerName);
	if (!player) return getPlayerNotFoundResult();

	switch (action.type) {
		case 'GM_SET_HP':
			if (!isValidNonNegativeNumber(action.hp)) {
				return { success: false, error: 'Invalid HP value' };
			}
			player.hp = action.hp;
			return;
		case 'GM_SET_GOLD':
			if (!isValidNonNegativeNumber(action.gold)) {
				return { success: false, error: 'Invalid gold value' };
			}
			player.gold = action.gold;
			return;
		case 'GM_SET_ATTACK':
			if (!isValidNonNegativeNumber(action.attack)) {
				return { success: false, error: 'Invalid attack value' };
			}
			player.baseAttack = action.attack;
			return;
		case 'GM_SET_DEFENSE':
			if (!isValidNonNegativeNumber(action.defense)) {
				return { success: false, error: 'Invalid defense value' };
			}
			player.baseDefense = action.defense;
			return;
	}
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
				player.hp = player.maxHp;
			});
		case 'GM_REMOVE_ITEM':
			return withPlayer(game, action.playerName, (player) =>
				removeItemFromPlayer(player, action.item)
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

		const validMoves = getValidMoves(player.position, player.movement, !player.inShadowRealm);
		const isValid = validMoves.some((position) => {
			return position.x === action.position.x && position.y === action.position.y;
		});
		if (!isValid) return { success: false, error: 'Invalid move' };

		const oldPos = player.position;
		player.position = { ...action.position };
		game.hasMoved = true;

		game.addAuditTrail(
			`${player.name} moved from (${oldPos.x}, ${oldPos.y}) to (${action.position.x}, ${action.position.y})`
		);

		if (player.classType === 'magicman') {
			const tilesMovedThisTurn = getPathDistance(oldPos, action.position, player.movement);
			const unusedMovement = player.movement - tilesMovedThisTurn;
			if (unusedMovement > 0) {
				grantUnusedMovementMana(player, unusedMovement);
			}
		}

		executeTileAction(player, action.position, ctx);
	});
}

export function handleShopBuyAction(
	game: Game,
	playerName: string,
	action: ActionOf<'SHOP_BUY'>
): ActionMutationResult {
	return withPlayer(game, playerName, (player) => {
		if (game.hasShopped) return { success: false, error: 'Already shopped this turn' };
		if (!player.canBuyItem(action.item)) return { success: false, error: 'Cannot buy this item' };
		player.buyItem(action.item);
	});
}

export function handleCasinoAction(
	playerName: string,
	ctx: ServerGameContext
): ActionMutationResult {
	if (ctx.getHasUsedCasinoThisTurn())
		return { success: false, error: 'Already used casino this turn' };
	generateCasinoWheel(playerName, ctx);
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
			if (attacker.dead) return { success: false, error: 'Attacker is dead' };
			if (defender.dead) return { success: false, error: 'Defender is dead' };

			if (attacker.position && defender.position) {
				const distance = getManhattanDistance(attacker.position, defender.position);
				if (distance > attacker.attackRange) {
					return { success: false, error: 'Target out of range' };
				}
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

		const cost = spellManaCosts[action.spellLevel];
		const mana = caster.resources['Mana'] ?? 0;
		if (mana < cost)
			return { success: false, error: `Not enough mana (need ${cost}, have ${mana})` };

		const target = action.targetName ? game.getPlayerByName(action.targetName) : undefined;
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
		const destTile = getTileAt(action.destination);
		if (!destTile) return { success: false, error: 'Invalid teleport destination' };
		if (!isOuterTeleporter(action.destination) && !isInnerTeleporter(action.destination)) {
			return { success: false, error: 'Destination is not a teleporter' };
		}

		player.position = action.destination;
		executeTileAction(player, action.destination, ctx);
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

	if (pendingWheel.chosenIndex !== undefined && action.selectedIndex !== pendingWheel.chosenIndex) {
		return { success: false, error: 'Selected index does not match server-chosen result' };
	}

	const selectedItem = pendingWheel.items[action.selectedIndex];
	if (!selectedItem) return { success: false, error: 'Invalid wheel index' };

	selectedItem.onWin?.();
	room.pendingWheels.delete(action.wheelKey);
}

export function handleGMStartGameAction(room: GameRoom, game: Game): ActionResult | undefined {
	if (game.players.length < 2) {
		return { success: false, error: 'Need at least 2 players to start' };
	}

	room.phase = 'turn_order';
	room.turnOrder = [];
	startTurnOrderSetup(room, assignClassToPlayer);
}
