/**
 * Type-safe serialization schemas for game state
 * Provides validation to prevent corrupted saves from breaking the game
 */

import type { Position } from './board/types';
import type { ClassType } from './classes/classType';
import { classMap } from './classes/classType';
import type { AllItems, Chests, Consumables, Helms, MainHands, OffHands } from './items/itemTypes';
import items from './items/itemTypes';
import statusEffects, { type StatusType } from './statuses/statusTypes';

// ============================================================================
// Validation Helpers
// ============================================================================

function isString(value: unknown): value is string {
	return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
	return typeof value === 'number' && !isNaN(value);
}

function isBoolean(value: unknown): value is boolean {
	return typeof value === 'boolean';
}

function isArray(value: unknown): value is unknown[] {
	return Array.isArray(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isClassType(value: unknown): value is ClassType {
	return isString(value) && value in classMap;
}

function isStatusType(value: unknown): value is StatusType {
	return isString(value) && value in statusEffects;
}

function isMainHand(value: unknown): value is MainHands {
	return isString(value) && value in items.mainhand;
}

function isOffHand(value: unknown): value is OffHands | MainHands {
	return isString(value) && (value in items.offHand || value in items.mainhand);
}

function isHelm(value: unknown): value is Helms {
	return isString(value) && value in items.helm;
}

function isChest(value: unknown): value is Chests {
	return isString(value) && value in items.chest;
}

function isConsumable(value: unknown): value is Consumables {
	return isString(value) && value in items.consumables;
}

function isAllItems(value: unknown): value is AllItems {
	return isMainHand(value) || isOffHand(value) || isHelm(value) || isChest(value) || isConsumable(value);
}

// ============================================================================
// Serialized Data Types
// ============================================================================

export interface SerializedStatModifiers {
	attack: Record<string, number>;
	defense: Record<string, number>;
	movement: Record<string, number>;
	attackRange: Record<string, number>;
	hp: Record<string, number>;
}

export interface SerializedPlayerGear {
	playerName: string;
	mainHand: MainHands | null;
	offHand: OffHands | MainHands | null;
	helm: Helms | null;
	chest: Chests | null;
	consumables: Consumables[];
}

export interface SerializedStatusEffect {
	statusName: StatusType;
	duration: number | undefined;
}

export interface SerializedPlayerStatuses {
	playerName: string;
	statuses: SerializedStatusEffect[];
}

export interface SerializedPlayer {
	name: string;
	hp: number;
	maxHp: number;
	class: ClassType;
	dead: boolean;
	movement: number;
	bonusMovement: number;
	baseAttackRange: number;
	bonusAttackRange: number;
	inShadowRealm: boolean;
	bonusAttack: number;
	baseAttack: number;
	attackMultipliers: Record<string, number>;
	brassKnucklesMultiplier: number;
	baseDefense: number;
	bonusDefense: number;
	defenseMultipliers: Record<string, number>;
	gold: number;
	resources: Record<string, number>;
	gear: SerializedPlayerGear;
	statuses: SerializedPlayerStatuses;
	statModifiers: SerializedStatModifiers;
	position: Position | null;
}

export interface SerializedGame {
	players: SerializedPlayer[];
	started: boolean;
	globalHpReduction: number;
	customWheels: [string, unknown][];
	playerOrder: Record<number, string>;
	_currentTurn: number;
	_shadowRealm: SerializedPlayer[];
	itemCostModifiers: [AllItems, number][];
	auditTrail: string[];
	shopCostModifier: number;
	shopConsumableCostModifier: number;
	hasTurnStarted: boolean;
	skippedNextTurns: string[];
	hasMoved: boolean;
	hasFought: boolean;
	hasShopped: boolean;
	hasUsedCasino: boolean;
	lootedTreasures: string[];
}

// ============================================================================
// Validation Functions
// ============================================================================

function validateNumberRecord(data: unknown, defaultValue: Record<string, number> = {}): Record<string, number> {
	if (!isObject(data)) return defaultValue;
	const result: Record<string, number> = {};
	for (const [key, value] of Object.entries(data)) {
		if (isNumber(value)) {
			result[key] = value;
		}
	}
	return result;
}

function validateStatModifiers(data: unknown): SerializedStatModifiers {
	const defaults: SerializedStatModifiers = {
		attack: {},
		defense: {},
		movement: {},
		attackRange: {},
		hp: {}
	};

	if (!isObject(data)) return defaults;

	return {
		attack: validateNumberRecord(data.attack),
		defense: validateNumberRecord(data.defense),
		movement: validateNumberRecord(data.movement),
		attackRange: validateNumberRecord(data.attackRange),
		hp: validateNumberRecord(data.hp)
	};
}

export function validatePlayerGear(data: unknown): SerializedPlayerGear {
	const defaults: SerializedPlayerGear = {
		playerName: '',
		mainHand: null,
		offHand: null,
		helm: null,
		chest: null,
		consumables: []
	};

	if (!isObject(data)) return defaults;

	const consumables: Consumables[] = [];
	if (isArray(data.consumables)) {
		for (const item of data.consumables) {
			if (isConsumable(item)) {
				consumables.push(item);
			}
		}
	}

	return {
		playerName: isString(data.playerName) ? data.playerName : '',
		mainHand: isMainHand(data.mainHand) ? data.mainHand : null,
		offHand: isOffHand(data.offHand) ? data.offHand : null,
		helm: isHelm(data.helm) ? data.helm : null,
		chest: isChest(data.chest) ? data.chest : null,
		consumables
	};
}

export function validatePlayerStatuses(data: unknown): SerializedPlayerStatuses {
	const defaults: SerializedPlayerStatuses = {
		playerName: '',
		statuses: []
	};

	if (!isObject(data)) return defaults;

	const statuses: SerializedStatusEffect[] = [];
	if (isArray(data.statuses)) {
		for (const status of data.statuses) {
			if (isObject(status) && isStatusType(status.statusName)) {
				statuses.push({
					statusName: status.statusName,
					duration: isNumber(status.duration) ? status.duration : undefined
				});
			}
		}
	}

	return {
		playerName: isString(data.playerName) ? data.playerName : '',
		statuses
	};
}

export function validatePlayer(data: unknown): SerializedPlayer | null {
	if (!isObject(data)) return null;

	// Name is required
	if (!isString(data.name) || data.name.trim() === '') {
		console.error('Player validation failed: missing or invalid name');
		return null;
	}

	// Class must be valid
	const classType = isClassType(data.class) ? data.class : 'none';

	// Validate position
	let position: Position | null = null;
	if (isObject(data.position) && isNumber(data.position.x) && isNumber(data.position.y)) {
		position = { x: data.position.x, y: data.position.y };
	}

	// For maxHp, default to hp if not present (backwards compatibility)
	const hp = isNumber(data.hp) ? data.hp : 0;
	const maxHp = isNumber(data.maxHp) ? data.maxHp : hp;

	return {
		name: data.name,
		hp,
		maxHp,
		class: classType,
		dead: isBoolean(data.dead) ? data.dead : false,
		movement: isNumber(data.movement) ? data.movement : 1,
		bonusMovement: isNumber(data.bonusMovement) ? data.bonusMovement : 0,
		baseAttackRange: isNumber(data.baseAttackRange) ? data.baseAttackRange : 1,
		bonusAttackRange: isNumber(data.bonusAttackRange) ? data.bonusAttackRange : 0,
		inShadowRealm: isBoolean(data.inShadowRealm) ? data.inShadowRealm : false,
		bonusAttack: isNumber(data.bonusAttack) ? data.bonusAttack : 0,
		baseAttack: isNumber(data.baseAttack) ? data.baseAttack : 1,
		attackMultipliers: validateNumberRecord(data.attackMultipliers),
		brassKnucklesMultiplier: isNumber(data.brassKnucklesMultiplier) ? data.brassKnucklesMultiplier : 0,
		baseDefense: isNumber(data.baseDefense) ? data.baseDefense : 0,
		bonusDefense: isNumber(data.bonusDefense) ? data.bonusDefense : 0,
		// Handle both the typo (defenseMultiplier) and correct name (defenseMultipliers)
		defenseMultipliers: validateNumberRecord(data.defenseMultipliers ?? data.defenseMultiplier),
		gold: isNumber(data.gold) ? data.gold : 0,
		resources: validateNumberRecord(data.resources),
		gear: validatePlayerGear(data.gear),
		statuses: validatePlayerStatuses(data.statuses),
		statModifiers: validateStatModifiers(data.statModifiers),
		position
	};
}

export function validateGame(data: unknown): SerializedGame | null {
	if (!isObject(data)) {
		console.error('Game validation failed: data is not an object');
		return null;
	}

	// Validate players array
	const players: SerializedPlayer[] = [];
	if (isArray(data.players)) {
		for (const playerData of data.players) {
			const validated = validatePlayer(playerData);
			if (validated) {
				players.push(validated);
			}
		}
	}

	// Validate shadow realm players
	const shadowRealm: SerializedPlayer[] = [];
	if (isArray(data._shadowRealm)) {
		for (const playerData of data._shadowRealm) {
			const validated = validatePlayer(playerData);
			if (validated) {
				shadowRealm.push(validated);
			}
		}
	}

	// Validate item cost modifiers
	const itemCostModifiers: [AllItems, number][] = [];
	if (isArray(data.itemCostModifiers)) {
		for (const entry of data.itemCostModifiers) {
			if (isArray(entry) && entry.length === 2 && isAllItems(entry[0]) && isNumber(entry[1])) {
				itemCostModifiers.push([entry[0], entry[1]]);
			}
		}
	}

	// Validate player order
	const playerOrder: Record<number, string> = {};
	if (isObject(data.playerOrder)) {
		for (const [key, value] of Object.entries(data.playerOrder)) {
			const numKey = parseInt(key, 10);
			if (!isNaN(numKey) && isString(value)) {
				playerOrder[numKey] = value;
			}
		}
	}

	// Validate audit trail
	const auditTrail: string[] = [];
	if (isArray(data.auditTrail)) {
		for (const entry of data.auditTrail) {
			if (isString(entry)) {
				auditTrail.push(entry);
			}
		}
	}

	// Validate skipped turns
	const skippedNextTurns: string[] = [];
	if (isArray(data.skippedNextTurns)) {
		for (const entry of data.skippedNextTurns) {
			if (isString(entry)) {
				skippedNextTurns.push(entry);
			}
		}
	}

	// Validate custom wheels (keep as-is since wheel structure is complex)
	const customWheels: [string, unknown][] = [];
	if (isArray(data.customWheels)) {
		for (const entry of data.customWheels) {
			if (isArray(entry) && entry.length === 2 && isString(entry[0])) {
				customWheels.push([entry[0], entry[1]]);
			}
		}
	}

	// Validate looted treasures (defaults to empty array for existing saves)
	const lootedTreasures: string[] = [];
	if (isArray(data.lootedTreasures)) {
		for (const entry of data.lootedTreasures) {
			if (isString(entry)) {
				lootedTreasures.push(entry);
			}
		}
	}

	return {
		players,
		started: isBoolean(data.started) ? data.started : false,
		globalHpReduction: isNumber(data.globalHpReduction) ? data.globalHpReduction : 1,
		customWheels,
		playerOrder,
		_currentTurn: isNumber(data._currentTurn) ? data._currentTurn : 0,
		_shadowRealm: shadowRealm,
		itemCostModifiers,
		auditTrail,
		shopCostModifier: isNumber(data.shopCostModifier) ? data.shopCostModifier : 0,
		shopConsumableCostModifier: isNumber(data.shopConsumableCostModifier) ? data.shopConsumableCostModifier : 0,
		hasTurnStarted: isBoolean(data.hasTurnStarted) ? data.hasTurnStarted : false,
		skippedNextTurns,
		hasMoved: isBoolean(data.hasMoved) ? data.hasMoved : false,
		hasFought: isBoolean(data.hasFought) ? data.hasFought : false,
		hasShopped: isBoolean(data.hasShopped) ? data.hasShopped : false,
		hasUsedCasino: isBoolean(data.hasUsedCasino) ? data.hasUsedCasino : false,
		lootedTreasures
	};
}
