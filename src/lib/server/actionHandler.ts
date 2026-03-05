import { setServerGameContext } from '$lib/game/serverContext';
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
import items, { getItemByType } from '$lib/game/items/itemTypes';
import type {
	CombatState,
	GameAction,
	GameStateDelta,
	PendingWheelPayload
} from '$lib/multiplayer/types';
import { generateButtonWheel } from '$lib/game/wheels/buttonWheel';
import { generateCasinoWheel } from '$lib/game/wheels/casinoWheel';
import { generateLootWheel } from '$lib/game/wheels/lootWheel';
import {
	generateMinorSpellWheel,
	generateMajorSpellWheel,
	generateUltimateSpellWheel
} from '$lib/game/wheels/spellWheels';
import { createServerGameContext } from './serverGameContext';
import type { GameRoom } from './gameRooms';

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

/**
 * Generate a delta by comparing two serialized game states.
 * Returns null if there are no changes.
 */
function generateDelta(
	beforeJson: string,
	afterJson: string,
	version: number
): GameStateDelta | null {
	if (beforeJson === afterJson) return null;

	const before = JSON.parse(beforeJson);
	const after = JSON.parse(afterJson);

	const delta: GameStateDelta = { version };
	let hasChanges = false;

	// Diff top-level game fields (excluding players and auditTrail which are handled separately)
	const gameFields = [
		'started',
		'globalHpReduction',
		'globalTurnCount',
		'turnsThisRound',
		'_currentTurn',
		'playerOrder',
		'shopCostModifier',
		'shopConsumableCostModifier',
		'shopRerollCost',
		'hasTurnStarted',
		'skippedNextTurns',
		'hasMoved',
		'hasFought',
		'hasShopped',
		'hasUsedCasino'
	] as const;

	const gameDelta: Record<string, unknown> = {};
	for (const key of gameFields) {
		if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
			gameDelta[key] = after[key];
			hasChanges = true;
		}
	}

	// Check complex fields that change less frequently
	for (const key of [
		'customWheels',
		'itemCostModifiers',
		'shopItems',
		'lootedTreasures',
		'_shadowRealm'
	] as const) {
		if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
			gameDelta[key] = after[key];
			hasChanges = true;
		}
	}

	if (Object.keys(gameDelta).length > 0) delta.game = gameDelta;

	// Audit trail — only send new entries (append-only)
	if (after.auditTrail.length > before.auditTrail.length) {
		delta.auditTrailAppend = after.auditTrail.slice(before.auditTrail.length);
		hasChanges = true;
	}

	// Diff players by name — send full serialized player for any that changed
	const playerDelta: Record<string, unknown> = {};
	for (const afterPlayer of after.players) {
		const beforePlayer = before.players?.find((p: { name: string }) => p.name === afterPlayer.name);
		if (!beforePlayer || JSON.stringify(beforePlayer) !== JSON.stringify(afterPlayer)) {
			playerDelta[afterPlayer.name] = afterPlayer;
			hasChanges = true;
		}
	}
	if (Object.keys(playerDelta).length > 0) delta.players = playerDelta;

	return hasChanges ? delta : null;
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
	if (room.isDuplicateAction(playerName, action.actionId)) {
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
				const player = game.getPlayerByName(playerName);
				if (!player) return { success: false, error: 'Player not found' };
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

				const attacker = game.getPlayerByName(action.attackerName);
				const defender = game.getPlayerByName(action.defenderName);
				if (!attacker || !defender) return { success: false, error: 'Player not found' };
				if (attacker.dead) return { success: false, error: 'Attacker is dead' };
				if (defender.dead) return { success: false, error: 'Defender is dead' };

				// Range validation
				if (attacker.position && defender.position) {
					const distance = getManhattanDistance(attacker.position, defender.position);
					if (distance > attacker.attackRange)
						return { success: false, error: 'Target out of range' };
				}

				// Store combat wheel closures server-side (keyed for later resolution)
				const combatWheelKey = `combat-${attacker.name}-vs-${defender.name}-${Date.now()}`;
				const attackWheel = [
					{
						label: attacker.name,
						weight: attacker.attack,
						onWin: () => {
							game.addAuditTrail(
								`${attacker.name} (ATK ${attacker.attack}) beat ${defender.name} (DEF ${defender.defense})`
							);
							attacker.onAttackWin(defender);
							defender.onDefendLose(attacker);
						}
					},
					{
						label: defender.name,
						weight: defender.defense,
						onWin: () => {
							game.addAuditTrail(
								`${attacker.name} (ATK ${attacker.attack}) lost to ${defender.name} (DEF ${defender.defense})`
							);
							attacker.onAttackLose(defender);
							defender.onDefendWin(attacker);
						}
					}
				];
				room.pendingWheels.set(combatWheelKey, {
					items: attackWheel,
					forPlayerName: attacker.name,
					type: 'combat',
					shuffledOrder: generateShuffleOrder(attackWheel.length)
				});
				game.hasFought = true;

				// Return combat state for the battle UI
				// Also include as pendingWheels so clients receive shuffledOrder via room:wheel_pending
				const combatPw = room.pendingWheels.get(combatWheelKey)!;
				return {
					success: true,
					gameState: game.serialize(),
					combat: {
						attackerName: attacker.name,
						defenderName: defender.name,
						attackWeight: attacker.attack,
						defenseWeight: defender.defense,
						wheelKey: combatWheelKey
					},
					pendingWheels: [
						{
							key: combatWheelKey,
							items: combatPw.items.map((item) => ({
								label: item.label,
								weight: item.weight
							})),
							theme: combatPw.theme,
							forPlayerName: combatPw.forPlayerName,
							shuffledOrder: combatPw.shuffledOrder
						}
					]
				};
			}

			case 'SHOP_BUY': {
				const player = game.getPlayerByName(playerName);
				if (!player) return { success: false, error: 'Player not found' };
				if (game.hasShopped) return { success: false, error: 'Already shopped this turn' };
				if (!player.canBuyItem(action.item))
					return { success: false, error: 'Cannot buy this item' };
				player.buyItem(action.item);
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
				const caster = game.getPlayerByName(playerName);
				if (!caster) return { success: false, error: 'Player not found' };
				if (caster.classType !== 'magicman')
					return { success: false, error: 'Only Magic Man can cast spells' };

				const manaCosts = { minor: 25, major: 50, ultimate: 100 } as const;
				const cost = manaCosts[action.spellLevel];
				const mana = caster.resources['Mana'] ?? 0;
				if (mana < cost)
					return { success: false, error: `Not enough mana (need ${cost}, have ${mana})` };

				const target = action.targetName ? game.getPlayerByName(action.targetName) : undefined;
				switch (action.spellLevel) {
					case 'minor':
						generateMinorSpellWheel(playerName, ctx, target);
						break;
					case 'major':
						generateMajorSpellWheel(playerName, ctx, target);
						break;
					case 'ultimate':
						generateUltimateSpellWheel(playerName, ctx, target);
						break;
				}
				game.hasFought = true;
				break;
			}

			case 'USE_CONSUMABLE': {
				const player = game.getPlayerByName(playerName);
				if (!player) return { success: false, error: 'Player not found' };

				// Validate item is a consumable
				if (!(action.item in items.consumables))
					return { success: false, error: 'Item is not a consumable' };

				const consumableItem = action.item as import('$lib/game/items/itemTypes').Consumables;

				// Validate player owns the consumable
				if (!player.gear.consumables.includes(consumableItem))
					return { success: false, error: 'Player does not own this consumable' };

				player.gear.useConsumable(consumableItem);
				break;
			}

			case 'TELEPORT': {
				const player = game.getPlayerByName(playerName);
				if (!player) return { success: false, error: 'Player not found' };

				// Validate destination is a valid teleporter tile
				const destTile = getTileAt(action.destination);
				if (!destTile) return { success: false, error: 'Invalid teleport destination' };
				if (!isOuterTeleporter(action.destination) && !isInnerTeleporter(action.destination)) {
					return { success: false, error: 'Destination is not a teleporter' };
				}

				player.position = action.destination;
				executeTileAction(player, action.destination, ctx);
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
				const player = game.getPlayerByName(action.playerName);
				if (!player) return { success: false, error: 'Player not found' };
				player.assignClass(action.classType);
				break;
			}

			case 'GM_SET_HP': {
				if (typeof action.hp !== 'number' || !isFinite(action.hp) || action.hp < 0)
					return { success: false, error: 'Invalid HP value' };
				const player = game.getPlayerByName(action.playerName);
				if (!player) return { success: false, error: 'Player not found' };
				player.hp = action.hp;
				break;
			}

			case 'GM_SET_GOLD': {
				if (typeof action.gold !== 'number' || !isFinite(action.gold) || action.gold < 0)
					return { success: false, error: 'Invalid gold value' };
				const player = game.getPlayerByName(action.playerName);
				if (!player) return { success: false, error: 'Player not found' };
				player.gold = action.gold;
				break;
			}

			case 'GM_SET_ATTACK': {
				if (typeof action.attack !== 'number' || !isFinite(action.attack) || action.attack < 0)
					return { success: false, error: 'Invalid attack value' };
				const player = game.getPlayerByName(action.playerName);
				if (!player) return { success: false, error: 'Player not found' };
				player.baseAttack = action.attack;
				break;
			}

			case 'GM_SET_DEFENSE': {
				if (typeof action.defense !== 'number' || !isFinite(action.defense) || action.defense < 0)
					return { success: false, error: 'Invalid defense value' };
				const player = game.getPlayerByName(action.playerName);
				if (!player) return { success: false, error: 'Player not found' };
				player.baseDefense = action.defense;
				break;
			}

			case 'GM_GIVE_ITEM': {
				const player = game.getPlayerByName(action.playerName);
				if (!player) return { success: false, error: 'Player not found' };
				player.assignItem(action.item);
				break;
			}

			case 'GM_KILL_PLAYER': {
				const player = game.getPlayerByName(action.playerName);
				if (!player) return { success: false, error: 'Player not found' };
				player.hp = 0;
				break;
			}

			case 'GM_REVIVE_PLAYER': {
				const player = game.getPlayerByName(action.playerName);
				if (!player) return { success: false, error: 'Player not found' };
				player.hp = player.maxHp;
				break;
			}

			case 'GM_REMOVE_ITEM': {
				const player = game.getPlayerByName(action.playerName);
				if (!player) return { success: false, error: 'Player not found' };
				const itemDef = getItemByType(action.item);
				if (!itemDef) return { success: false, error: 'Invalid item' };
				if (itemDef.type === 'consumables') {
					const idx = player.gear.consumables.indexOf(
						action.item as import('$lib/game/items/itemTypes').Consumables
					);
					if (idx < 0) return { success: false, error: 'Player does not have this consumable' };
					player.gear.deleteItem('consumables', idx);
				} else {
					player.gear.unequipItem(itemDef.type);
				}
				break;
			}

			case 'GM_ADD_WHEEL': {
				// GM can trigger any wheel type for a player
				switch (action.wheelType) {
					case 'loot':
						generateLootWheel(action.playerName, ctx);
						break;
					case 'button':
						generateButtonWheel(action.playerName, ctx);
						break;
					case 'casino':
						generateCasinoWheel(action.playerName, ctx);
						break;
				}
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

			newPendingWheels.push({
				key,
				items: wheel.items.map((item) => ({
					label: item.label,
					weight: item.weight
				})),
				theme: wheel.theme,
				forPlayerName: wheel.forPlayerName,
				shuffledOrder: wheel.shuffledOrder
			});
		}
	}

	room.touch();

	// Generate delta by comparing before/after state
	const afterState = game.serialize();
	room.stateVersion++;
	const delta = generateDelta(beforeState, afterState, room.stateVersion);

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
	const remaining = game.players.map((p) => p.name).filter((n) => !room.turnOrder.includes(n));

	if (remaining.length <= 1) {
		// Last player auto-assigned
		if (remaining.length === 1) {
			room.turnOrder.push(remaining[0]);
		}
		// Transition to class selection
		startClassSelection(room);
		return;
	}

	const wheelKey = `setup-turn-order-${position}`;
	const wheelItems = remaining.map((name) => ({
		label: name,
		onWin: () => {
			room.turnOrder.push(name);
			game.addAuditTrail(`${name} gets position #${room.turnOrder.length} in turn order`);

			// Queue next wheel
			createTurnOrderWheel(room, position + 1);
		}
	}));

	room.pendingWheels.set(wheelKey, {
		items: wheelItems,
		forPlayerName: room.gmName,
		shuffledOrder: generateShuffleOrder(wheelItems.length)
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
	const availableClasses = Object.entries(classMap)
		.filter(([key]) => key !== 'none' && !assignedSet.has(key))
		.map(([key, cls]) => ({
			key: key as ClassType,
			name: cls.name
		}));

	if (availableClasses.length <= 1) {
		// Auto-assign last class
		if (availableClasses.length === 1) {
			const player = game.getPlayerByName(currentPlayerName);
			if (player) {
				player.assignClass(availableClasses[0].key);
				room.assignedClasses.set(currentPlayerName, availableClasses[0].key);
				game.addAuditTrail(`${currentPlayerName} assigned class: ${availableClasses[0].name}`);
			}
		}
		// Continue to next player or finish
		createClassWheel(room, playerIndex + 1);
		return;
	}

	const wheelKey = `setup-class-${playerIndex}`;
	const wheelItems = availableClasses.map((cls) => ({
		label: cls.name,
		onWin: () => {
			const player = game.getPlayerByName(currentPlayerName);
			if (player) {
				player.assignClass(cls.key);
				room.assignedClasses.set(currentPlayerName, cls.key);
				game.addAuditTrail(`${currentPlayerName} chose class: ${cls.name}`);
			}

			// Queue next class wheel
			createClassWheel(room, playerIndex + 1);
		}
	}));

	room.pendingWheels.set(wheelKey, {
		items: wheelItems,
		forPlayerName: currentPlayerName,
		shuffledOrder: generateShuffleOrder(wheelItems.length)
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
