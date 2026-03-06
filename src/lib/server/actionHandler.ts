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
import { SPAWN_ZONES } from '$lib/game/board/boardData';
import { executeTileAction } from '$lib/game/board/tileActions';
import { grantUnusedMovementMana } from '$lib/game/classes/magicman';
import { classMap, type ClassType } from '$lib/game/classes/classType';
import items, { getItemByType, type AllItems } from '$lib/game/items/itemTypes';
import type {
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

/** Pick a random index weighted by item weights (default weight = 1) */
export function weightedRandomIndex(items: { weight?: number }[]): number {
	const weights = items.map((item) => item.weight ?? 1);
	const totalWeight = weights.reduce((sum, w) => sum + w, 0);
	let random = Math.random() * totalWeight;
	for (let i = 0; i < weights.length; i++) {
		random -= weights[i];
		if (random <= 0) return i;
	}
	return weights.length - 1;
}

/** Generate a Fisher-Yates shuffled array of indices [0..length-1] */
export function generateShuffleOrder(length: number): number[] {
	const order = Array.from({ length }, (_, i) => i);
	for (let i = order.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[order[i], order[j]] = [order[j], order[i]];
	}
	return order;
}

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
type SpellCastAction = Extract<GameAction, { type: 'SPELL_CAST' }>;

interface SetupWheelOption<T> {
	value: T;
	label: string;
}

type ActionMutationResult = ActionResult | void;

const gmWheelGenerators: Record<
	GMWheelType,
	(playerName: string, ctx: ReturnType<typeof createServerGameContext>) => void
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
	(playerName: string, ctx: ReturnType<typeof createServerGameContext>, target?: Player) => void
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

function queueSetupWheelStep<T>(params: {
	room: GameRoom;
	keyPrefix: string;
	index: number;
	forPlayerName: string;
	options: SetupWheelOption<T>[];
	onSelect: (option: T) => void;
	onAutoSelect?: (option: T) => void;
	onAdvance: () => void;
}) {
	const { room, keyPrefix, index, forPlayerName, options, onSelect, onAutoSelect, onAdvance } =
		params;

	if (options.length <= 1) {
		if (options.length === 1) {
			(onAutoSelect ?? onSelect)(options[0].value);
		}
		onAdvance();
		return;
	}

	const wheelKey = `${keyPrefix}-${index}`;
	const wheelItems = options.map((option) => ({
		label: option.label,
		onWin: () => {
			onSelect(option.value);
			onAdvance();
		}
	}));

	room.pendingWheels.set(wheelKey, {
		items: wheelItems,
		forPlayerName,
		shuffledOrder: generateShuffleOrder(wheelItems.length)
	});
}

/**
 * Process a game action from a client.
 * Validates permissions and executes the action on the room's game.
 */
export function handleAction(room: GameRoom, playerName: string, action: GameAction): ActionResult {
	const role = room.getPlayerRole(playerName);
	if (!role) {
		return { success: false, error: 'Not in this room' };
	}

	// Dedup check — reject duplicate action IDs
	const actionId = action.actionId ?? crypto.randomUUID();
	if (room.isDuplicateAction(playerName, actionId)) {
		return { success: false, error: 'Duplicate action' };
	}

	// GM actions require GM role
	if (action.type.startsWith('GM_') && role !== 'gm') {
		return { success: false, error: 'Only the GM can perform this action' };
	}

	// Spectators cannot perform game actions
	if (role === 'spectator' && !action.type.startsWith('GM_')) {
		return { success: false, error: 'Spectators cannot perform actions' };
	}

	// Player actions require it to be their turn (except wheel spins and GM actions)
	if (role === 'player' && !action.type.startsWith('GM_') && action.type !== 'WHEEL_SPIN_RESULT') {
		const currentPlayer = room.game.currentPlayer;
		if (!currentPlayer || currentPlayer.name !== playerName) {
			return { success: false, error: 'Not your turn' };
		}
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
		switch (action.type) {
			case 'MOVE': {
				const result = withPlayer(game, playerName, (player) => {
					if (game.hasMoved) return { success: false, error: 'Already moved this turn' };
					if (!player.position) return { success: false, error: 'Player has no position' };

					// Validate the move is reachable
					const validMoves = getValidMoves(player.position, player.movement, !player.inShadowRealm);
					const isValid = validMoves.some(
						(p) => p.x === action.position.x && p.y === action.position.y
					);
					if (!isValid) return { success: false, error: 'Invalid move' };

					const oldPos = player.position;
					player.position = { ...action.position };
					game.hasMoved = true;

					if (oldPos) {
						game.addAuditTrail(
							`${player.name} moved from (${oldPos.x}, ${oldPos.y}) to (${action.position.x}, ${action.position.y})`
						);
					}

					// Grant unused movement mana for Magic Man
					if (player.classType === 'magicman' && oldPos) {
						const tilesMovedThisTurn = getPathDistance(oldPos, action.position, player.movement);
						const unusedMovement = player.movement - tilesMovedThisTurn;
						if (unusedMovement > 0) {
							grantUnusedMovementMana(player, unusedMovement);
						}
					}

					// Execute tile action at new position
					executeTileAction(player, action.position, ctx);
				});
				if (result) return result;
				break;
			}

			case 'FINISH_TURN': {
				game.finishTurn();
				break;
			}

			case 'ATTACK_RESOLVE': {
				if (action.attackerName !== playerName)
					return { success: false, error: 'Cannot attack as another player' };
				if (game.hasFought) return { success: false, error: 'Already fought this turn' };

				const result = withPlayers(
					game,
					[action.attackerName, action.defenderName],
					(attacker, defender) => {
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
					}
				);
				if (result) return result;
				break;
			}

			case 'SHOP_BUY': {
				const result = withPlayer(game, playerName, (player) => {
					if (game.hasShopped) return { success: false, error: 'Already shopped this turn' };
					if (!player.canBuyItem(action.item))
						return { success: false, error: 'Cannot buy this item' };
					player.buyItem(action.item);
				});
				if (result) return result;
				break;
			}

			case 'SHOP_REROLL': {
				const success = game.rerollShopItems();
				if (!success) return { success: false, error: 'Cannot afford reroll' };
				break;
			}

			case 'CASINO': {
				if (ctx.getHasUsedCasinoThisTurn())
					return { success: false, error: 'Already used casino this turn' };
				generateCasinoWheel(playerName, ctx);
				break;
			}

			case 'SPELL_CAST': {
				const result = withPlayer(game, playerName, (caster) => {
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
				if (result) return result;
				break;
			}

			case 'USE_CONSUMABLE': {
				const result = withPlayer(game, playerName, (player) => {
					// Validate item is a consumable
					if (!(action.item in items.consumables))
						return { success: false, error: 'Item is not a consumable' };

					const consumableItem = action.item as import('$lib/game/items/itemTypes').Consumables;

					// Validate player owns the consumable
					if (!player.gear.consumables.includes(consumableItem))
						return { success: false, error: 'Player does not own this consumable' };

					player.gear.useConsumable(consumableItem);
				});
				if (result) return result;
				break;
			}

			case 'TELEPORT': {
				const result = withPlayer(game, playerName, (player) => {
					// Validate destination is a valid teleporter tile
					const destTile = getTileAt(action.destination);
					if (!destTile) return { success: false, error: 'Invalid teleport destination' };
					if (!isOuterTeleporter(action.destination) && !isInnerTeleporter(action.destination)) {
						return { success: false, error: 'Destination is not a teleporter' };
					}

					player.position = action.destination;
					executeTileAction(player, action.destination, ctx);
				});
				if (result) return result;
				break;
			}

			case 'WHEEL_SPIN_RESULT': {
				const pendingWheel = room.pendingWheels.get(action.wheelKey);
				if (!pendingWheel) return { success: false, error: 'Wheel not found or already spun' };

				// Only the assigned player (or GM) can spin this wheel ('*' = anyone)
				if (pendingWheel.forPlayerName !== playerName && role !== 'gm') {
					return { success: false, error: 'Not your wheel to spin' };
				}

				// If the server already picked a winner (via request_spin), validate it matches
				if (
					pendingWheel.chosenIndex !== undefined &&
					action.selectedIndex !== pendingWheel.chosenIndex
				) {
					return { success: false, error: 'Selected index does not match server-chosen result' };
				}

				const selectedItem = pendingWheel.items[action.selectedIndex];
				if (!selectedItem) return { success: false, error: 'Invalid wheel index' };

				// Execute the closure server-side
				selectedItem.onWin?.();
				room.pendingWheels.delete(action.wheelKey);
				break;
			}

			// GM Actions
			case 'GM_START_GAME': {
				if (game.players.length < 2) {
					return { success: false, error: 'Need at least 2 players to start' };
				}

				// Begin turn order phase with first wheel
				room.phase = 'turn_order';
				room.turnOrder = [];
				createTurnOrderWheel(room, 0);
				break;
			}

			case 'GM_REMOVE_PLAYER': {
				room.removeGamePlayer(action.playerName);
				break;
			}

			case 'GM_SET_CLASS': {
				const result = handleGMSimplePlayerAction(game, action);
				if (result) return result;
				break;
			}

			case 'GM_SET_HP':
			case 'GM_SET_GOLD':
			case 'GM_SET_ATTACK':
			case 'GM_SET_DEFENSE': {
				const result = handleGMNumericAction(game, action);
				if (result) return result;
				break;
			}

			case 'GM_GIVE_ITEM': {
				const result = handleGMSimplePlayerAction(game, action);
				if (result) return result;
				break;
			}

			case 'GM_KILL_PLAYER': {
				const result = handleGMSimplePlayerAction(game, action);
				if (result) return result;
				break;
			}

			case 'GM_REVIVE_PLAYER': {
				const result = handleGMSimplePlayerAction(game, action);
				if (result) return result;
				break;
			}

			case 'GM_REMOVE_ITEM': {
				const result = handleGMSimplePlayerAction(game, action);
				if (result) return result;
				break;
			}

			case 'GM_ADD_WHEEL': {
				gmWheelGenerators[action.wheelType](action.playerName, ctx);
				break;
			}

			default:
				return { success: false, error: `Unknown action type: ${(action as GameAction).type}` };
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		return { success: false, error: message };
	}

	// Collect new pending wheels (ones that didn't exist before the action)
	const newPendingWheels: PendingWheelPayload[] = [];
	for (const [key, wheel] of room.pendingWheels) {
		if (!wheelKeysBefore.has(key)) {
			// Generate shuffled order if not already set
			if (!wheel.shuffledOrder) {
				wheel.shuffledOrder = generateShuffleOrder(wheel.items.length);
			}

			newPendingWheels.push(toPendingWheelPayload(key, wheel));
		}
	}

	room.touch();

	// Generate delta by comparing before/after state
	const afterState = game.serialize();
	room.stateVersion++;
	const delta = Game.generateDelta(beforeState, afterState, room.stateVersion);

	return {
		success: true,
		gameState: afterState,
		delta: delta ?? undefined,
		pendingWheels: newPendingWheels.length > 0 ? newPendingWheels : undefined
	};
}

// ============================================================================
// Turn Order Wheel Chain
// ============================================================================

function createTurnOrderWheel(room: GameRoom, position: number) {
	const game = room.game;
	const remainingOptions = game.players
		.map((player) => player.name)
		.filter((name) => !room.turnOrder.includes(name))
		.map((name) => ({ value: name, label: name }));

	if (remainingOptions.length === 0) {
		startClassSelection(room);
		return;
	}

	queueSetupWheelStep({
		room,
		keyPrefix: 'setup-turn-order',
		index: position,
		forPlayerName: room.gmName,
		options: remainingOptions,
		onSelect: (name) => {
			room.turnOrder.push(name);
			game.addAuditTrail(`${name} gets position #${room.turnOrder.length} in turn order`);
		},
		onAutoSelect: (name) => {
			room.turnOrder.push(name);
		},
		onAdvance: () => {
			createTurnOrderWheel(room, position + 1);
		}
	});
}

// ============================================================================
// Class Selection Wheel Chain
// ============================================================================

function startClassSelection(room: GameRoom) {
	room.phase = 'class_selection';
	room.assignedClasses.clear();

	// Reorder game players to match turn order
	const orderedPlayers = room.turnOrder
		.map((name) => room.game.players.find((p) => p.name === name))
		.filter(Boolean) as import('$lib/game/player/player.svelte').Player[];
	room.game.players.splice(0, room.game.players.length, ...orderedPlayers);

	room.game.addAuditTrail(`Turn order: ${room.turnOrder.join(', ')}`);

	// Create first class wheel
	createClassWheel(room, 0);
}

function createClassWheel(room: GameRoom, playerIndex: number) {
	if (playerIndex >= room.turnOrder.length) {
		// All classes assigned — start the actual game
		startGameAfterSetup(room);
		return;
	}

	const currentPlayerName = room.turnOrder[playerIndex];
	const game = room.game;

	// Available classes (exclude 'none' and already-assigned)
	const assignedSet = new Set(room.assignedClasses.values());
	const availableClasses: SetupWheelOption<{ key: ClassType; name: string }>[] = Object.entries(
		classMap
	)
		.filter(([key]) => key !== 'none' && !assignedSet.has(key))
		.map(([key, cls]) => ({
			value: {
				key: key as ClassType,
				name: cls.name
			},
			label: cls.name
		}));

	queueSetupWheelStep({
		room,
		keyPrefix: 'setup-class',
		index: playerIndex,
		forPlayerName: currentPlayerName,
		options: availableClasses,
		onSelect: (cls) => {
			room.assignedClasses.set(currentPlayerName, cls.key);
			assignClassToPlayer(
				game,
				currentPlayerName,
				cls.key,
				`${currentPlayerName} chose class: ${cls.name}`
			);
		},
		onAutoSelect: (cls) => {
			room.assignedClasses.set(currentPlayerName, cls.key);
			assignClassToPlayer(
				game,
				currentPlayerName,
				cls.key,
				`${currentPlayerName} assigned class: ${cls.name}`
			);
		},
		onAdvance: () => {
			createClassWheel(room, playerIndex + 1);
		}
	});
}

// ============================================================================
// Start Game After Setup
// ============================================================================

function startGameAfterSetup(room: GameRoom) {
	const game = room.game;

	// Assign spawn positions
	const allSpawns = SPAWN_ZONES.flatMap((z) => z.spawnPoints);
	const usedPositions = new Set<string>();
	for (const p of game.players) {
		if (p.position) usedPositions.add(`${p.position.x},${p.position.y}`);
	}
	for (const p of game.players) {
		if (!p.position) {
			const free = allSpawns.filter((sp) => !usedPositions.has(`${sp.x},${sp.y}`));
			const spawn =
				free.length > 0
					? free[Math.floor(Math.random() * free.length)]
					: allSpawns[Math.floor(Math.random() * allSpawns.length)];
			if (spawn) {
				p.position = { ...spawn };
				usedPositions.add(`${spawn.x},${spawn.y}`);
				game.addAuditTrail(`${p.name} spawned at (${spawn.x}, ${spawn.y})`);
			}
		}
	}

	// Copy turn order into game.playerOrder
	const playerOrder: Record<number, string> = {};
	for (let i = 0; i < room.turnOrder.length; i++) {
		playerOrder[i] = room.turnOrder[i];
	}
	game.playerOrder = playerOrder;

	game.started = true;
	game.startTurn();
	game.addAuditTrail('Game started!');
	room.phase = 'playing';
}
