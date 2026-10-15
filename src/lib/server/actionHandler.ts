import { setServerGameContext } from '#lib/game/serverContext.js';
import { Game } from '#lib/game/game.svelte.js';
import type {
	ActionOf,
	ActionType,
	CombatState,
	GameAction,
	GameStateDelta,
	PendingWheelPayload
} from '#lib/multiplayer/types.js';
import {
	type ActionMutationResult,
	buildActionSuccessResult,
	gmWheelGenerators,
	handleCasinoAction,
	handleAttackResolveAction,
	handleGMEditAction,
	handleGMSimplePlayerAction,
	handleGMStartGameAction,
	handleMoveAction,
	handleShopBuyAction,
	handleShopRerollAction,
	handleSpellCastAction,
	handleTeleportAction,
	handleUseConsumableAction,
	handleWheelSpinResultAction
} from './actionExecutors';
import { createServerGameContext } from './serverGameContext';
import type { GameRoom } from './gameRooms';
import type { ServerGameContext } from './serverGameContext';

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

interface ActionAccessResult {
	ok: boolean;
	result?: ActionResult;
	role?: ReturnType<GameRoom['getPlayerRole']>;
}

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
	/** The GM may perform this turn action on anyone's turn (e.g. skipping an AFK player) */
	gmOverride?: boolean;
	allowSpectator?: boolean;
	execute: (params: ActionExecutionContext<T>) => ActionMutationResult;
}

type ActionRegistry = { [K in ActionType]: ActionHandlerDefinition<K> };

function defineActionHandler<T extends ActionType>(
	handler: ActionHandlerDefinition<T>
): ActionHandlerDefinition<T> {
	return handler;
}

function validateActionAccess(
	room: GameRoom,
	playerName: string,
	handler: Pick<
		ActionHandlerDefinition<ActionType>,
		'gmOnly' | 'requiresTurn' | 'gmOverride' | 'allowSpectator'
	>
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

	if (handler.requiresTurn) {
		const { game } = room;
		if (!game.started || game.winnerName) {
			return { ok: false, result: { success: false, error: 'Game is not in progress' } };
		}
		const isTurnOwner = game.currentPlayer?.name === playerName;
		if (!isTurnOwner && !(handler.gmOverride && role === 'gm')) {
			return { ok: false, result: { success: false, error: 'Not your turn' } };
		}
	}

	return { ok: true, role };
}

const actionRegistry = {
	MOVE: defineActionHandler({
		requiresTurn: true,
		execute: ({ game, playerName, action, ctx }) => handleMoveAction(game, playerName, action, ctx)
	}),
	FINISH_TURN: defineActionHandler({
		requiresTurn: true,
		gmOverride: true,
		execute: ({ room, game }) => {
			// Outstanding wheels belong to this turn; resolving them after it ends hits the wrong player
			if (room.pendingWheels.size > 0) {
				return { success: false, error: 'Resolve the pending wheels first' };
			}
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
		execute: ({ game, playerName, action }) => handleShopBuyAction(game, playerName, action)
	}),
	SHOP_REROLL: defineActionHandler({
		requiresTurn: true,
		execute: ({ game, playerName }) => handleShopRerollAction(game, playerName)
	}),
	CASINO: defineActionHandler({
		requiresTurn: true,
		execute: ({ game, playerName, ctx }) => handleCasinoAction(game, playerName, ctx)
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
			if (room.phase !== 'waiting') {
				return { success: false, error: 'Players can only be removed before the game starts' };
			}
			room.removeGamePlayer(action.playerName);
		}
	}),
	GM_SET_STAT: defineActionHandler({
		gmOnly: true,
		execute: ({ game, action }) => handleGMEditAction(game, action)
	}),
	GM_SET_RESOURCE: defineActionHandler({
		gmOnly: true,
		execute: ({ game, action }) => handleGMEditAction(game, action)
	}),
	GM_SET_SHADOW_REALM: defineActionHandler({
		gmOnly: true,
		execute: ({ game, action }) => handleGMEditAction(game, action)
	}),
	GM_ADD_STATUS: defineActionHandler({
		gmOnly: true,
		execute: ({ game, action }) => handleGMEditAction(game, action)
	}),
	GM_REMOVE_STATUS: defineActionHandler({
		gmOnly: true,
		execute: ({ game, action }) => handleGMEditAction(game, action)
	}),
	GM_REMOVE_MODIFIER: defineActionHandler({
		gmOnly: true,
		execute: ({ game, action }) => handleGMEditAction(game, action)
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

	// Track wheel objects (not keys — a follow-up wheel may reuse its parent's key)
	const wheelsBefore = new Set(room.pendingWheels.values());

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
		// The action may have half-mutated the game; still broadcast so clients match the server
		console.error(`[action] ${action.type} by ${playerName} threw:`, err);
		const message = err instanceof Error ? err.message : 'Unknown error';
		try {
			return {
				...buildActionSuccessResult({ room, game, beforeState, existingWheels: wheelsBefore }),
				success: false,
				error: message
			};
		} catch {
			return { success: false, error: message };
		}
	}

	return buildActionSuccessResult({
		room,
		game,
		beforeState,
		existingWheels: wheelsBefore
	});
}
