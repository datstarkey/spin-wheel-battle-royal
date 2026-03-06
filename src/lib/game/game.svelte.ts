import { shuffle } from '$lib/components/wheel/utils';
import type { GameStateDelta } from '$lib/multiplayer/types';
import toast from '$lib/stores/toaster.svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { GameContext } from './gameContext';
import items, { getItemByType, type AllItems, type Item } from './items/itemTypes';
import { Player } from './player/player.svelte';
import { getServerGameContext } from './serverContext';
import type { SerializedGame } from './serialization';
import { validateGame } from './serialization';
import type { CustomWheelConfig } from './wheels/wheels';

export class Game {
	private static readonly DELTA_SIMPLE_FIELDS = [
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

	private static readonly DELTA_COMPLEX_FIELDS = [
		'customWheels',
		'itemCostModifiers',
		'shopItems',
		'lootedTreasures',
		'_shadowRealm'
	] as const;

	players: Player[] = $state([]);

	alivePlayers = $derived(this.players.filter((player) => !player.dead));
	started = $state(false);

	winner = $state<Player | undefined>(undefined);

	globalHpReduction = $state(1);

	/**
	 * --------------------------------------------------------------------------
	 * Global Turn Counter & Movement Speed Scaling
	 * Every 5 global turns, all players gain +1 base movement (max +4 bonus = 5 total)
	 * Every 20 global turns, HP reduction doubles (infinitely)
	 */
	globalTurnCount = $state(0);
	/** Tracks how many individual player turns have been taken in the current round */
	private turnsThisRound = $state(0);
	static readonly TURNS_PER_MOVEMENT_INCREASE = 5;
	static readonly MAX_GLOBAL_MOVEMENT_BONUS = 4;
	static readonly TURNS_PER_HP_REDUCTION_INCREASE = 20;

	globalMovementBonus = $derived(
		Math.min(
			Math.floor(this.globalTurnCount / Game.TURNS_PER_MOVEMENT_INCREASE),
			Game.MAX_GLOBAL_MOVEMENT_BONUS
		)
	);

	customWheels = new SvelteMap<string, CustomWheelConfig>();

	itemCostModifiers = new SvelteMap<AllItems, number>();

	/**
	 * --------------------------------------------------------------------------
	 * Treasure Chests - tracks which treasure chests have been looted
	 * Stored as "x,y" strings for easy serialization
	 */
	lootedTreasures = new SvelteSet<string>();

	isTreasureLooted(x: number, y: number): boolean {
		return this.lootedTreasures.has(`${x},${y}`);
	}

	lootTreasure(x: number, y: number): boolean {
		const key = `${x},${y}`;
		if (this.lootedTreasures.has(key)) {
			return false; // Already looted
		}
		this.lootedTreasures.add(key);
		return true;
	}

	skippedNextTurns = new SvelteSet<string>();

	/**
	 * --------------------------------------------------------------------------
	 * Turn Action State - Tracks what the current player has done this turn
	 */
	hasMoved = $state(false);
	hasFought = $state(false);
	hasShopped = $state(false);
	hasUsedCasino = $state(false);

	/** Reset turn action state for a new turn */
	resetTurnActions() {
		this.hasMoved = false;
		this.hasFought = false;
		this.hasShopped = false;
		this.hasUsedCasino = false;
	}

	shopCostModifier = $state(0);
	shopConsumableCostModifier = $state(0);

	/**
	 * --------------------------------------------------------------------------
	 * Shop System - 4 random items from all categories
	 */
	static readonly SHOP_ITEM_COUNT = 4;
	static readonly INITIAL_REROLL_COST = 2;

	/** Current shop inventory as array of [itemKey, item, category] tuples */
	shopItems = $state<[string, Item, string][]>([]);
	shopRerollCost = $state(Game.INITIAL_REROLL_COST);

	/** Generate 4 random items from all categories */
	randomizeShopItems(resetCost: boolean = false) {
		// Collect all items with their category info
		const allItems: [string, Item, string][] = [];
		for (const [category, categoryItems] of Object.entries(items)) {
			for (const [key, item] of Object.entries(categoryItems)) {
				allItems.push([key, item as Item, category]);
			}
		}

		// Shuffle and pick 4 random items
		const shuffled = shuffle(allItems);
		this.shopItems = shuffled.slice(0, Game.SHOP_ITEM_COUNT);

		if (resetCost) {
			this.shopRerollCost = Game.INITIAL_REROLL_COST;
		}
	}

	rerollShopItems(): boolean {
		const player = this.currentPlayer;
		if (!player) return false;

		if (player.gold < this.shopRerollCost) {
			return false;
		}

		// Deduct gold
		player.gold -= this.shopRerollCost;

		// Get new random items
		const previousCost = this.shopRerollCost;
		this.randomizeShopItems();

		// Double the reroll cost
		this.shopRerollCost *= 2;

		this.addAuditTrail(`${player.name} rerolled shop for ${previousCost}g`);

		return true;
	}

	auditTrail = $state<string[]>([]);

	getItemCostModifier(item: AllItems): number {
		return this.itemCostModifiers.get(item) ?? 1;
	}

	increaseItemCostModifier(item: AllItems, amount: number = 1) {
		this.itemCostModifiers.set(item, this.getItemCostModifier(item) + amount);
	}

	getConsumableItemCostModifier(): number {
		return this.shopConsumableCostModifier;
	}

	getItemCost(item: AllItems): number {
		const modifier = this.getItemCostModifier(item);
		const actualItem = getItemByType(item);
		const baseCost = actualItem?.baseCost ?? 0;
		const isConsumable = actualItem?.type === 'consumables';
		if (isConsumable) return baseCost + this.getConsumableItemCostModifier() + modifier;
		return baseCost + modifier + this.shopCostModifier;
	}

	increaseGlobalHpReduction(amount: number = 0) {
		if (amount === 0) {
			this.globalHpReduction *= 2;
		} else {
			this.globalHpReduction += amount;
		}
		this.addAuditTrail(`Global HP reduction is now ${this.globalHpReduction}`);
	}

	addAuditTrail(message: string) {
		this.auditTrail.push(message);
		if (typeof window !== 'undefined') {
			toast.success(message);
		}
	}

	/**
	 * --------------------------------------------------------------------------
	 * Turns
	 */

	playerOrder: Record<number, string> = $state({});
	private _currentTurn = $state(0);

	private hasTurnStarted = $state(false);
	public get currentTurn(): number {
		return this._currentTurn;
	}
	public set currentTurn(value: number) {
		this._currentTurn = value;
	}

	public get playerOrderLength(): number {
		return Object.keys(this.playerOrder).length;
	}

	private incrementTurn() {
		this.currentTurn++;
		if (this.currentTurn >= Object.entries(this.playerOrder).length) {
			this.currentTurn = 0;
		}
	}

	get currentPlayer(): Player | undefined {
		if (!this.started) return undefined;
		if (this.playerOrderLength === 0) return undefined;

		const alivePlayers = this.alivePlayers;
		if (alivePlayers.length === 0) return undefined;

		const playerName = this.playerOrder[this.currentTurn];
		if (!playerName) return undefined;

		return this.getPlayerByName(playerName);
	}

	/** Check and declare a winner if only one player remains alive */
	private checkForWinner() {
		if (this.winner) return;
		const alivePlayers = this.alivePlayers;
		if (alivePlayers.length === 1) {
			this.winner = alivePlayers[0];
			this.addAuditTrail(`${alivePlayers[0].name} has won the game!`);
		}
	}

	/**
	 * Advances to the next alive player's turn.
	 * Uses iterative approach to avoid stack overflow from recursive calls.
	 */
	private advanceToNextAlivePlayer(): Player | undefined {
		const totalPlayers = Object.entries(this.playerOrder).length;
		if (totalPlayers === 0) return undefined;

		// Safety limit to prevent infinite loops
		for (let attempts = 0; attempts < totalPlayers; attempts++) {
			this.incrementTurn();
			const nextPlayer = this.getPlayerByName(this.playerOrder[this.currentTurn]);
			if (nextPlayer && !nextPlayer.dead) {
				return nextPlayer;
			}
		}

		// All players are dead
		return undefined;
	}

	/** Resolve ctx — use provided value or fall back to server singleton */
	private resolveCtx(ctx?: GameContext): GameContext {
		return ctx ?? getServerGameContext();
	}

	startTurn(ctx?: GameContext) {
		if (this.hasTurnStarted) return;

		const player = this.currentPlayer;
		if (!player) return;

		// Check for winner
		if (this.winner) {
			toast.success(`${this.winner.name} has won the game!`);
			return;
		}

		// Skip dead players iteratively (not recursively)
		if (player.dead) {
			const nextAlive = this.advanceToNextAlivePlayer();
			if (!nextAlive) {
				toast.error('No alive players remaining!');
				return;
			}
			// Don't recurse - just set up for the alive player and return
			// The UI should call startTurn again
			return;
		}

		// Skip players who have their turn skipped
		if (this.skippedNextTurns.has(player.name)) {
			this.skippedNextTurns.delete(player.name);
			this.addAuditTrail(`${player.name}'s turn was skipped!`);
			const nextAlive = this.advanceToNextAlivePlayer();
			if (!nextAlive) {
				toast.error('No alive players remaining!');
				return;
			}
			// Don't recurse - UI should call startTurn again
			return;
		}

		// Actually start the turn
		this.randomizeShopItems(true);
		player.onTurnStart(this.resolveCtx(ctx));
		this.addAuditTrail(`${player.name} starts their turn!`);
		this.hasTurnStarted = true;
	}

	gainAnotherTurn() {
		this.addAuditTrail(`${this.currentPlayer?.name} gets another turn`);
		this.hasTurnStarted = true;
		this.resetTurnActions();
	}

	finishTurn(ctx?: GameContext) {
		this.addAuditTrail(`${this.currentPlayer?.name} finishes their turn!`);

		const resolvedCtx = this.resolveCtx(ctx);
		this.currentPlayer?.onTurnEnd(resolvedCtx, {
			hasMoved: this.hasMoved,
			totalMovement: this.currentPlayer.movement
		});

		this.incrementTurn();
		this.hasTurnStarted = false;
		this.resetTurnActions();

		// Check for winner after turn ends
		this.checkForWinner();

		// Track turns this round and check for round completion
		// A round completes when all alive players have had a turn
		this.turnsThisRound++;
		const alivePlayerCount = this.alivePlayers.length;

		if (alivePlayerCount > 0 && this.turnsThisRound >= alivePlayerCount) {
			const previousBonus = this.globalMovementBonus;
			this.globalTurnCount++;
			this.turnsThisRound = 0; // Reset for next round
			this.addAuditTrail(`Round ${this.globalTurnCount} complete!`);

			// Check for movement speed increase (every 5 rounds, max +4)
			if (this.globalMovementBonus > previousBonus) {
				this.addAuditTrail(
					`Global movement speed increased! All players now have +${this.globalMovementBonus} movement`
				);
			}

			// Check for HP reduction increase (every 20 rounds, doubles infinitely)
			if (this.globalTurnCount % Game.TURNS_PER_HP_REDUCTION_INCREASE === 0) {
				this.increaseGlobalHpReduction();
			}
		}

		// Note: startTurn is called here but it's now safe because startTurn
		// no longer calls finishTurn recursively - it just returns early if needed
		this.startTurn(ctx);
	}

	skipNextTurn(player: Player) {
		this.skippedNextTurns.add(player.name);
	}

	/**
	 * --------------------------------------------------------------------------
	 * Shadow Realm
	 */
	private _shadowRealm: Player[] = $state([]);
	public get shadowRealm(): Player[] {
		return this._shadowRealm;
	}
	//Private so it can't be set outside of the class
	private set shadowRealm(value: Player[]) {
		this._shadowRealm = value;
	}

	isInShadowRealm(player: Player) {
		return this.shadowRealm.includes(player);
	}

	addPlayerToShadowRealm(player: Player) {
		//Don't add duplicates
		if (this.shadowRealm.includes(player)) {
			toast.error(`${player.name} is already in the Shadow Realm!`);
			return;
		}
		this.addAuditTrail(`${player.name} has been sent to the Shadow Realm!`);
		this.shadowRealm.push(player);
	}

	//Todo - Add Spawn location outside of shadow realm
	removePlayerFromShadowRealm(player: Player) {
		if (this._shadowRealm.includes(player)) {
			this._shadowRealm = this._shadowRealm.filter((p) => p !== player);
			this.addAuditTrail(`${player.name} has been removed from the Shadow Realm!`);
		}
	}

	/**
	 * --------------------------------------------------------------------------
	 * Functions
	 */
	getPlayerByName(name: string): Player | undefined {
		return this.players.find((player) => player.name === name);
	}

	private static normalizeCustomWheels(
		customWheels: SerializedGame['customWheels']
	): [string, CustomWheelConfig][] {
		return customWheels.map(([key, value]: [string, unknown]): [string, CustomWheelConfig] => {
			if (Array.isArray(value)) {
				return [key, { items: value }];
			}
			return [key, value as CustomWheelConfig];
		});
	}

	private toSerializedGame(): SerializedGame {
		return {
			players: this.players.map((player) => player.serialize()),
			started: this.started,
			globalHpReduction: this.globalHpReduction,
			globalTurnCount: this.globalTurnCount,
			turnsThisRound: this.turnsThisRound,
			customWheels: Array.from(this.customWheels.entries()),
			playerOrder: this.playerOrder,
			_currentTurn: this._currentTurn,
			_shadowRealm: this._shadowRealm,
			itemCostModifiers: Array.from(this.itemCostModifiers.entries()),
			auditTrail: this.auditTrail,
			shopCostModifier: this.shopCostModifier,
			shopConsumableCostModifier: this.shopConsumableCostModifier,
			shopItems: this.shopItems,
			shopRerollCost: this.shopRerollCost,
			hasTurnStarted: this.hasTurnStarted,
			skippedNextTurns: Array.from(this.skippedNextTurns),
			hasMoved: this.hasMoved,
			hasFought: this.hasFought,
			hasShopped: this.hasShopped,
			hasUsedCasino: this.hasUsedCasino,
			lootedTreasures: Array.from(this.lootedTreasures)
		};
	}

	private applySerializedField(key: string, value: unknown) {
		switch (key) {
			case 'customWheels':
				this.customWheels = new SvelteMap(
					Game.normalizeCustomWheels(value as SerializedGame['customWheels'])
				);
				break;
			case 'itemCostModifiers':
				this.itemCostModifiers = new SvelteMap(value as SerializedGame['itemCostModifiers']);
				break;
			case 'skippedNextTurns':
				this.skippedNextTurns = new SvelteSet(value as SerializedGame['skippedNextTurns']);
				break;
			case 'lootedTreasures':
				this.lootedTreasures = new SvelteSet(value as SerializedGame['lootedTreasures']);
				break;
			case 'shopItems':
				this.shopItems = value as [string, Item, string][];
				break;
			default:
				(this as Record<string, unknown>)[key] = value;
				break;
		}
	}

	private loadSerializedGame(data: SerializedGame) {
		this.players = data.players.map((p) => {
			const player = Player.deserialize(p);
			player.setGame(this);
			return player;
		});

		for (const key of Game.DELTA_SIMPLE_FIELDS) {
			this.applySerializedField(key, data[key]);
		}

		this.applySerializedField('customWheels', data.customWheels);
		this.applySerializedField('itemCostModifiers', data.itemCostModifiers);
		this.auditTrail = data.auditTrail;

		if (data.shopItems && data.shopItems.length > 0) {
			this.applySerializedField('shopItems', data.shopItems);
		} else {
			this.randomizeShopItems();
		}

		this.applySerializedField('lootedTreasures', data.lootedTreasures ?? []);

		this._shadowRealm = data._shadowRealm
			.map((sr) => this.players.find((p) => p.name === sr.name))
			.filter((p): p is Player => p !== undefined);
	}

	static generateDelta(
		beforeJson: string,
		afterJson: string,
		version: number
	): GameStateDelta | null {
		if (beforeJson === afterJson) return null;

		const before = JSON.parse(beforeJson) as SerializedGame;
		const after = JSON.parse(afterJson) as SerializedGame;
		const delta: GameStateDelta = { version };
		let hasChanges = false;

		const gameDelta: Record<string, unknown> = {};
		for (const key of Game.DELTA_SIMPLE_FIELDS) {
			if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
				gameDelta[key] = after[key];
				hasChanges = true;
			}
		}

		for (const key of Game.DELTA_COMPLEX_FIELDS) {
			if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
				gameDelta[key] = after[key];
				hasChanges = true;
			}
		}

		if (Object.keys(gameDelta).length > 0) delta.game = gameDelta;

		if (after.auditTrail.length > before.auditTrail.length) {
			delta.auditTrailAppend = after.auditTrail.slice(before.auditTrail.length);
			hasChanges = true;
		}

		const playerDelta: Record<string, unknown> = {};
		for (const afterPlayer of after.players) {
			const beforePlayer = before.players.find((p) => p.name === afterPlayer.name);
			if (!beforePlayer || JSON.stringify(beforePlayer) !== JSON.stringify(afterPlayer)) {
				playerDelta[afterPlayer.name] = afterPlayer;
				hasChanges = true;
			}
		}

		if (Object.keys(playerDelta).length > 0) delta.players = playerDelta;

		return hasChanges ? delta : null;
	}

	// Serialize the Game instance to a JSON string
	public serialize(): string {
		return JSON.stringify(this.toSerializedGame());
	}

	// Deserialize a JSON string to create a Game instance
	public static deserialize(json: string): Game {
		const rawData = JSON.parse(json);
		const data = validateGame(rawData);

		if (!data) {
			toast.error('Failed to load game: invalid save data');
			throw new Error('Invalid game data');
		}

		const game = new Game();
		game.loadSerializedGame(data);
		return game;
	}

	/**
	 * Apply an incremental delta to this game instance in-place.
	 * Avoids full deserialization — only updates changed fields and players.
	 */
	public applyDelta(delta: GameStateDelta) {
		// Apply top-level game field changes
		if (delta.game) {
			for (const [key, value] of Object.entries(delta.game)) {
				if (key === '_shadowRealm') continue; // Handled below after player replacement
				this.applySerializedField(key, value);
			}
		}

		// Append new audit trail entries
		if (delta.auditTrailAppend) {
			for (const entry of delta.auditTrailAppend) {
				this.auditTrail.push(entry);
			}
		}

		// Replace changed players (full serialized player data for any that changed)
		if (delta.players) {
			for (const [name, playerData] of Object.entries(delta.players)) {
				const idx = this.players.findIndex((p) => p.name === name);
				if (idx >= 0) {
					const updated = Player.deserialize(
						playerData as Parameters<typeof Player.deserialize>[0]
					);
					updated.setGame(this);
					this.players[idx] = updated;
				}
			}
		}

		// Resolve shadow realm references (names → Player instances)
		if (delta.players || delta.game?._shadowRealm) {
			if (delta.game?._shadowRealm) {
				// Shadow realm membership changed — resolve from new data
				const srData = delta.game._shadowRealm as { name: string }[];
				this._shadowRealm = srData
					.map((sr) => this.players.find((p) => p.name === sr.name))
					.filter((p): p is Player => p !== undefined);
			} else {
				// Players changed but shadow realm didn't — re-link to new instances
				this._shadowRealm = this._shadowRealm
					.map((sr) => this.players.find((p) => p.name === sr.name))
					.filter((p): p is Player => p !== undefined);
			}
		}
	}
}
