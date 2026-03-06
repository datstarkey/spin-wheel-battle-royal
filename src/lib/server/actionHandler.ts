import { setServerGameContext } from '$lib/game/serverContext';
import { Game } from '$lib/game/game.svelte';
import type { Player } from '$lib/game/player/player.svelte';
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
import type {
	ActionOf,
	ActionType,
	CombatState,
	GameAction,
	GameStateDelta,
	GMWheelType,
	PendingWheelPayload
} from '$lib/multiplayer/types';
import { generateButtonWheel } from '$lib/game/wheels/buttonWheel';
import { generateCasinoWheel } from '$lib/game/wheels/casinoWheel';
import { generateGamblerWheel } from '$lib/game/wheels/gamblerWheel';
import { generateLootWheel } from '$lib/game/wheels/lootWheel';
import { generateShadowRealmWheel } from '$lib/game/wheels/shadowRealm';
import {
	generateMinorSpellWheel,
	generateMajorSpellWheel,
	generateUltimateSpellWheel
} from '$lib/game/wheels/spellWheels';
import { createCombatWheel } from '$lib/game/combat';
import { createServerGameContext } from './serverGameContext';
import type { GameRoom } from './gameRooms';
import { toPendingWheelPayload } from './pendingWheelPayload';
import { startTurnOrderSetup } from './setupFlow';
import { generateShuffleOrder } from './wheelUtils';

export interface ActionResult {
	success: boolean;
	error?: string;
	/** Serialized game state to broadcast */
	gameState?: string;
	/** Incremental delta for efficient state sync */
	delta?: GameStateDelta;
	/** New pending wheels to send to clients */
	pendingWheels?: PendingWheelPayload[];
	/** Combat started — broadcast to all clients for battle UI */
	combat?: CombatState;
}

type GMNumericAction = Extract<
	GameAction,
	{ type: 'GM_SET_HP' | 'GM_SET_GOLD' | 'GM_SET_ATTACK' | 'GM_SET_DEFENSE' }
>;
type GMSimplePlayerAction = Extract<
	GameAction,
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

interface ActionAccessResult {
	ok: boolean;
	result?: ActionResult;
	role?: ReturnType<GameRoom['getPlayerRole']>;
}

type ActionMutationResult = ActionResult | void;
type ServerGameContext = ReturnType<typeof createServerGameContext>;

interface ActionExecutionContext<T extends ActionType> {
	room: GameRoom;
	game: Game;
	playerName: string;
	role: NonNullable<ActionAccessResult['role']>;
	action: ActionOf<T>;
	ctx: ServerGameContext;
}

interface ActionHandlerDefinition<T extends ActionType> {
	gmOnly?: boolean;
	requiresTurn?: boolean;
	allowSpectator?: boolean;
	execute: (params: ActionExecutionContext<T>) => ActionMutationResult;
}

type ActionRegistry = { [K in ActionType]: ActionHandlerDefinition<K> };

const gmWheelGenerators: Record<GMWheelType, (playerName: string, ctx: ServerGameContext) => void> =
	{
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

function defineActionHandler<T extends ActionType>(
	handler: ActionHandlerDefinition<T>
): ActionHandlerDefinition<T> {
	return handler;
}

function getPlayerNotFoundResult(): ActionResult {
	return { success: false, error: 'Player not found' };
}

function validateActionAccess(
	room: GameRoom,
	playerName: string,
	handler: Pick<ActionHandlerDefinition<ActionType>, 'gmOnly' | 'requiresTurn' | 'allowSpectator'>
): ActionAccessResult {
	const role = room.getPlayerRole(playerName);
	if (!role) {
		return {
			ok: false,
			result: { success: false, error: 'Not in this room' }
		};
	}

	if (handler.gmOnly && role !== 'gm') {
		return {
			ok: false,
			result: { success: false, error: 'Only the GM can perform this action' }
		};
	}

	if (role === 'spectator' && !handler.allowSpectator) {
		return {
			ok: false,
			result: { success: false, error: 'Spectators cannot perform actions' }
		};
	}

	if (role === 'player' && handler.requiresTurn) {
		const currentPlayer = room.game.currentPlayer;
		if (!currentPlayer || currentPlayer.name !== playerName) {
			return {
				ok: false,
				result: { success: false, error: 'Not your turn' }
			};
		}
	}

	return { ok: true, role };
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

function handleGMNumericAction(game: Game, action: GMNumericAction): ActionResult | undefined {
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

function removeItemFromPlayer(player: Player, item: AllItems): ActionResult | undefined {
	const itemDef = getItemByType(item);
	if (!itemDef) return { success: false, error: 'Invalid item' };
	if (itemDef.type === 'consumables') {
		const idx = player.gear.consumables.indexOf(
			item as import('$lib/game/items/itemTypes').Consumables
		);
		if (idx < 0) return { success: false, error: 'Player does not have this consumable' };
		player.gear.deleteItem('consumables', idx);
		return;
	}

	player.gear.unequipItem(itemDef.type);
}

function assignClassToPlayer(
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

function handleGMSimplePlayerAction(
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

function collectNewPendingWheels(
	room: GameRoom,
	existingWheelKeys: Set<string>
): PendingWheelPayload[] {
	const newPendingWheels: PendingWheelPayload[] = [];
	for (const [key, wheel] of room.pendingWheels) {
		if (existingWheelKeys.has(key)) continue;

		if (!wheel.shuffledOrder) {
			wheel.shuffledOrder = generateShuffleOrder(wheel.items.length);
		}

		newPendingWheels.push(toPendingWheelPayload(key, wheel));
	}

	return newPendingWheels;
}

function buildActionSuccessResult(params: {
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

function handleMoveAction(
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

function handleAttackResolveAction(
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
			room.pendingWheels.set(combatWheelKey, {
				items: combatWheel.wheel,
				forPlayerName: attacker.name,
				type: 'combat',
				shuffledOrder: generateShuffleOrder(combatWheel.wheel.length)
			});
			game.hasFought = true;

			const combatPw = room.pendingWheels.get(combatWheelKey)!;
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
				pendingWheels: [toPendingWheelPayload(combatWheelKey, combatPw)]
			};
		}) ?? getPlayerNotFoundResult()
	);
}

function handleSpellCastAction(
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

function handleUseConsumableAction(
	game: Game,
	playerName: string,
	action: UseConsumableAction
): ActionMutationResult {
	return withPlayer(game, playerName, (player) => {
		if (!(action.item in items.consumables))
			return { success: false, error: 'Item is not a consumable' };

		const consumableItem = action.item as import('$lib/game/items/itemTypes').Consumables;
		if (!player.gear.consumables.includes(consumableItem))
			return { success: false, error: 'Player does not own this consumable' };

		player.gear.useConsumable(consumableItem);
	});
}

function handleTeleportAction(
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

function handleWheelSpinResultAction(
	room: GameRoom,
	playerName: string,
	role: NonNullable<ActionAccessResult['role']>,
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

function handleGMStartGameAction(room: GameRoom, game: Game): ActionResult | undefined {
	if (game.players.length < 2) {
		return { success: false, error: 'Need at least 2 players to start' };
	}

	room.phase = 'turn_order';
	room.turnOrder = [];
	startTurnOrderSetup(room, assignClassToPlayer);
}

const actionRegistry = {
	MOVE: defineActionHandler({
		requiresTurn: true,
		execute: ({ game, playerName, action, ctx }) => handleMoveAction(game, playerName, action, ctx)
	}),
	FINISH_TURN: defineActionHandler({
		requiresTurn: true,
		execute: ({ game }) => {
			game.finishTurn();
		}
	}),
	ATTACK_RESOLVE: defineActionHandler({
		requiresTurn: true,
		execute: ({ room, game, playerName, action, ctx }) =>
			handleAttackResolveAction(room, game, playerName, action, ctx)
	}),
	SHOP_BUY: defineActionHandler({
		requiresTurn: true,
		execute: ({ game, playerName, action }) =>
			withPlayer(game, playerName, (player) => {
				if (game.hasShopped) return { success: false, error: 'Already shopped this turn' };
				if (!player.canBuyItem(action.item))
					return { success: false, error: 'Cannot buy this item' };
				player.buyItem(action.item);
			})
	}),
	SHOP_REROLL: defineActionHandler({
		requiresTurn: true,
		execute: ({ game }) => {
			const success = game.rerollShopItems();
			if (!success) return { success: false, error: 'Cannot afford reroll' };
		}
	}),
	CASINO: defineActionHandler({
		requiresTurn: true,
		execute: ({ playerName, ctx }) => {
			if (ctx.getHasUsedCasinoThisTurn())
				return { success: false, error: 'Already used casino this turn' };
			generateCasinoWheel(playerName, ctx);
		}
	}),
	SPELL_CAST: defineActionHandler({
		requiresTurn: true,
		execute: ({ game, playerName, action, ctx }) =>
			handleSpellCastAction(game, playerName, action, ctx)
	}),
	USE_CONSUMABLE: defineActionHandler({
		requiresTurn: true,
		execute: ({ game, playerName, action }) => handleUseConsumableAction(game, playerName, action)
	}),
	TELEPORT: defineActionHandler({
		requiresTurn: true,
		execute: ({ game, playerName, action, ctx }) =>
			handleTeleportAction(game, playerName, action, ctx)
	}),
	WHEEL_SPIN_RESULT: defineActionHandler({
		execute: ({ room, playerName, role, action }) =>
			handleWheelSpinResultAction(room, playerName, role, action)
	}),
	GM_SET_CLASS: defineActionHandler({
		gmOnly: true,
		execute: ({ game, action }) => handleGMSimplePlayerAction(game, action)
	}),
	GM_START_GAME: defineActionHandler({
		gmOnly: true,
		execute: ({ room, game }) => handleGMStartGameAction(room, game)
	}),
	GM_REMOVE_PLAYER: defineActionHandler({
		gmOnly: true,
		execute: ({ room, action }) => {
			room.removeGamePlayer(action.playerName);
		}
	}),
	GM_SET_HP: defineActionHandler({
		gmOnly: true,
		execute: ({ game, action }) => handleGMNumericAction(game, action)
	}),
	GM_SET_GOLD: defineActionHandler({
		gmOnly: true,
		execute: ({ game, action }) => handleGMNumericAction(game, action)
	}),
	GM_SET_ATTACK: defineActionHandler({
		gmOnly: true,
		execute: ({ game, action }) => handleGMNumericAction(game, action)
	}),
	GM_SET_DEFENSE: defineActionHandler({
		gmOnly: true,
		execute: ({ game, action }) => handleGMNumericAction(game, action)
	}),
	GM_GIVE_ITEM: defineActionHandler({
		gmOnly: true,
		execute: ({ game, action }) => handleGMSimplePlayerAction(game, action)
	}),
	GM_REMOVE_ITEM: defineActionHandler({
		gmOnly: true,
		execute: ({ game, action }) => handleGMSimplePlayerAction(game, action)
	}),
	GM_ADD_WHEEL: defineActionHandler({
		gmOnly: true,
		execute: ({ action, ctx }) => {
			gmWheelGenerators[action.wheelType](action.playerName, ctx);
		}
	}),
	GM_KILL_PLAYER: defineActionHandler({
		gmOnly: true,
		execute: ({ game, action }) => handleGMSimplePlayerAction(game, action)
	}),
	GM_REVIVE_PLAYER: defineActionHandler({
		gmOnly: true,
		execute: ({ game, action }) => handleGMSimplePlayerAction(game, action)
	})
} satisfies ActionRegistry;

/**
 * Process a game action from a client.
 * Validates permissions and executes the action on the room's game.
 */
export function handleAction(room: GameRoom, playerName: string, action: GameAction): ActionResult {
	const handler = actionRegistry[action.type];
	const access = validateActionAccess(room, playerName, handler);
	if (!access.ok) return access.result!;
	const role = access.role!;

	// Dedup check — reject duplicate action IDs
	const actionId = action.actionId ?? crypto.randomUUID();
	if (room.isDuplicateAction(playerName, actionId)) {
		return { success: false, error: 'Duplicate action' };
	}

	const game = room.game;
	const ctx = createServerGameContext(room, playerName);

	// Set the active context so Player/tileActions/class code can access it
	setServerGameContext(ctx);

	// Track wheel keys before action to detect new wheels
	const wheelKeysBefore = new Set(room.pendingWheels.keys());

	// Snapshot state before action for delta generation
	const beforeState = game.serialize();

	try {
		const execute = handler.execute as (
			params: ActionExecutionContext<ActionType>
		) => ActionMutationResult;
		const result = execute({
			room,
			game,
			playerName,
			role,
			action,
			ctx
		});
		if (result) {
			return result;
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		return { success: false, error: message };
	}

	return buildActionSuccessResult({
		room,
		game,
		beforeState,
		existingWheelKeys: wheelKeysBefore
	});
}
