import { SPAWN_ZONES } from '$lib/game/board/boardData';
import { classMap, type ClassType } from '$lib/game/classes/classType';
import type { Game } from '$lib/game/game.svelte';
import type { Player } from '$lib/game/player/player.svelte';
import type { GameRoom } from './gameRooms';
import { generateShuffleOrder } from './wheelUtils';

interface SetupWheelOption<T> {
	value: T;
	label: string;
}

type AssignClassToPlayer = (
	game: Game,
	playerName: string,
	classType: ClassType,
	auditMessage?: string
) => void;

function queueSetupWheelStep<T>(params: {
	room: GameRoom;
	keyPrefix: string;
	index: number;
	forPlayerName: string;
	options: SetupWheelOption<T>[];
	onSelect: (option: T) => void;
	onAdvance: () => void;
}) {
	const { room, keyPrefix, index, forPlayerName, options, onSelect, onAdvance } = params;

	if (options.length <= 1) {
		if (options.length === 1) {
			onSelect(options[0].value);
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

function applyClassAssignment(
	room: GameRoom,
	game: Game,
	playerName: string,
	cls: { key: ClassType; name: string },
	verb: string,
	assignClassToPlayer: AssignClassToPlayer
) {
	room.assignedClasses.set(playerName, cls.key);
	assignClassToPlayer(game, playerName, cls.key, `${playerName} ${verb} class: ${cls.name}`);
}

function startClassSelection(room: GameRoom, assignClassToPlayer: AssignClassToPlayer) {
	room.phase = 'class_selection';
	room.assignedClasses.clear();

	// Reorder game players to match turn order
	const orderedPlayers = room.turnOrder
		.map((name) => room.game.players.find((player) => player.name === name))
		.filter(Boolean) as Player[];
	room.game.players.splice(0, room.game.players.length, ...orderedPlayers);

	room.game.addAuditTrail(`Turn order: ${room.turnOrder.join(', ')}`);

	createClassWheel(room, assignClassToPlayer, 0);
}

function createClassWheel(
	room: GameRoom,
	assignClassToPlayer: AssignClassToPlayer,
	playerIndex: number
) {
	if (playerIndex >= room.turnOrder.length) {
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
			applyClassAssignment(room, game, currentPlayerName, cls, 'chose', assignClassToPlayer);
		},
		onAdvance: () => {
			createClassWheel(room, assignClassToPlayer, playerIndex + 1);
		}
	});
}

function startGameAfterSetup(room: GameRoom) {
	const game = room.game;

	// Assign spawn positions
	const allSpawns = SPAWN_ZONES.flatMap((zone) => zone.spawnPoints);
	const usedPositions = new Set<string>();
	for (const player of game.players) {
		if (player.position) usedPositions.add(`${player.position.x},${player.position.y}`);
	}
	for (const player of game.players) {
		if (!player.position) {
			const freeSpawns = allSpawns.filter((spawn) => !usedPositions.has(`${spawn.x},${spawn.y}`));
			const spawn =
				freeSpawns.length > 0
					? freeSpawns[Math.floor(Math.random() * freeSpawns.length)]
					: allSpawns[Math.floor(Math.random() * allSpawns.length)];
			if (spawn) {
				player.position = { ...spawn };
				usedPositions.add(`${spawn.x},${spawn.y}`);
				game.addAuditTrail(`${player.name} spawned at (${spawn.x}, ${spawn.y})`);
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

export function startTurnOrderSetup(room: GameRoom, assignClassToPlayer: AssignClassToPlayer) {
	const game = room.game;
	const remainingOptions = game.players
		.map((player) => player.name)
		.filter((name) => !room.turnOrder.includes(name))
		.map((name) => ({ value: name, label: name }));

	if (remainingOptions.length === 0) {
		startClassSelection(room, assignClassToPlayer);
		return;
	}

	queueSetupWheelStep({
		room,
		keyPrefix: 'setup-turn-order',
		index: room.turnOrder.length,
		forPlayerName: room.gmName,
		options: remainingOptions,
		onSelect: (name) => {
			room.turnOrder.push(name);
			game.addAuditTrail(`${name} gets position #${room.turnOrder.length} in turn order`);
		},
		onAdvance: () => {
			startTurnOrderSetup(room, assignClassToPlayer);
		}
	});
}
