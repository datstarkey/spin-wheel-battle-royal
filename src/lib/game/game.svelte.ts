import toast from '$lib/stores/toaster.svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import items, { type AllItems, type Item } from './items/itemTypes';
import { Player } from './player/player.svelte';
import { validateGame } from './serialization';
import type { WheelBase, CustomWheelConfig } from './wheels/wheels';

export class Game {
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

	//playerNames
	skippedNextTurns = $state<string[]>([]);

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
		const shuffled = allItems.sort(() => Math.random() - 0.5);
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

	// Legacy getters for backwards compatibility during transition
	get unlockedShopCategory(): string {
		return this.shopItems[0]?.[2] ?? 'mainhand';
	}

	auditTrail = $state<string[]>([]);

	getItemCostModifier(item: AllItems): number {
		return this.itemCostModifiers.get(item) ?? 1;
	}

	increaseItemCostModifier(item: AllItems, amount: number = 1) {
		this.itemCostModifiers.set(item, this.getItemCostModifier(item) + amount);
	}

	addAuditTrail(message: string) {
		this.auditTrail.push(message);
		toast.success(message);
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
		const alivePlayers = this.players.filter((player) => !player.dead);
		if (alivePlayers.length === 0) {
			toast.error(`No players alive!`);
			return;
		}
		if (alivePlayers.length === 1) {
			if (!this.winner) {
				this.winner = alivePlayers[0];
				this.addAuditTrail(`${alivePlayers[0].name} has won the game!`);
			}
			return alivePlayers[0];
		}

		const player = this.getPlayerByName(this.playerOrder[this.currentTurn]);
		if (!player) {
			toast.error(
				`Could not get current turn, player ${this.playerOrder[this.currentTurn]} not found!`
			);
			return;
		}

		return player;
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

	startTurn() {
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
		if (this.skippedNextTurns.includes(player.name)) {
			this.skippedNextTurns = this.skippedNextTurns.filter((name) => name !== player.name);
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
		player.onTurnStart();
		this.addAuditTrail(`${player.name} starts their turn!`);
		this.hasTurnStarted = true;
	}

	gainAnotherTurn() {
		this.addAuditTrail(`${this.currentPlayer?.name} gets another turn`);
		this.hasTurnStarted = true;
		this.resetTurnActions();
	}

	finishTurn() {
		this.addAuditTrail(`${this.currentPlayer?.name} finishes their turn!`);
		this.currentPlayer?.onTurnEnd();

		const previousTurnIndex = this._currentTurn;
		this.incrementTurn();
		this.hasTurnStarted = false;
		this.resetTurnActions();

		// Increment global turn count when a full round completes (everyone has had a turn)
		// This happens when currentTurn wraps back to 0 from a higher index
		// Note: previousTurnIndex > _currentTurn detects wrap (e.g., 3 -> 0, or 1 -> 0 with dead players)
		const didWrapAround = this._currentTurn === 0 && previousTurnIndex > 0;
		if (didWrapAround) {
			const previousBonus = this.globalMovementBonus;
			this.globalTurnCount++;
			this.addAuditTrail(`Round ${this.globalTurnCount} complete!`);

			// Check for movement speed increase (every 5 rounds, max +4)
			if (this.globalMovementBonus > previousBonus) {
				this.addAuditTrail(
					`Global movement speed increased! All players now have +${this.globalMovementBonus} movement`
				);
			}

			// Check for HP reduction increase (every 20 rounds, doubles infinitely)
			if (this.globalTurnCount % Game.TURNS_PER_HP_REDUCTION_INCREASE === 0) {
				this.globalHpReduction *= 2;
				this.addAuditTrail(
					`Global HP reduction doubled to ${this.globalHpReduction}!`
				);
			}
		}

		// Note: startTurn is called here but it's now safe because startTurn
		// no longer calls finishTurn recursively - it just returns early if needed
		this.startTurn();
	}

	skipNextTurn(player: Player) {
		this.skippedNextTurns.push(player.name);
	}

	/**
	 * --------------------------------------------------------------------------
	 * Shadow Realm
	 */
	private _shadowRealm: Player[] = $state([]);
	public get shadowRealm(): Player[] {
		this._shadowRealm ??= [];
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

	// Serialize the Game instance to a JSON string
	public serialize(): string {
		return JSON.stringify({
			players: this.players.map((player) => player.serialize()),
			started: this.started,
			globalHpReduction: this.globalHpReduction,
			globalTurnCount: this.globalTurnCount,
			customWheels: Array.from(this.customWheels.entries()), // Convert SvelteMap to array
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
			skippedNextTurns: this.skippedNextTurns,
			hasMoved: this.hasMoved,
			hasFought: this.hasFought,
			hasShopped: this.hasShopped,
			hasUsedCasino: this.hasUsedCasino,
			lootedTreasures: Array.from(this.lootedTreasures)
		});
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
		game.players = data.players.map((p) => Player.deserialize(p));
		game.started = data.started;
		game.globalHpReduction = data.globalHpReduction;
		game.globalTurnCount = data.globalTurnCount ?? 0;
		// Normalize wheel data to handle both old (array) and new (config object) formats
		const normalizedWheels = data.customWheels.map(([key, value]: [string, unknown]): [string, CustomWheelConfig] => {
			if (Array.isArray(value)) {
				// Old format: just an array of items
				return [key, { items: value }];
			}
			// New format: already a CustomWheelConfig
			return [key, value as CustomWheelConfig];
		});
		game.customWheels = new SvelteMap(normalizedWheels);
		game.playerOrder = data.playerOrder;
		game._currentTurn = data._currentTurn;
		// Shadow realm players need to be references to actual player objects
		game._shadowRealm = data._shadowRealm
			.map((sr) => game.players.find((p) => p.name === sr.name))
			.filter((p): p is Player => p !== undefined);
		game.itemCostModifiers = new SvelteMap(data.itemCostModifiers);
		game.auditTrail = data.auditTrail;
		game.shopCostModifier = data.shopCostModifier;
		game.shopConsumableCostModifier = data.shopConsumableCostModifier;
		game.shopRerollCost = data.shopRerollCost ?? Game.INITIAL_REROLL_COST;
		// Regenerate shop items on load (old saves won't have shopItems)
		if (data.shopItems && data.shopItems.length > 0) {
			game.shopItems = data.shopItems as [string, Item, string][];
		} else {
			game.randomizeShopItems();
		}
		game.hasTurnStarted = data.hasTurnStarted ?? false;
		game.skippedNextTurns = data.skippedNextTurns ?? [];
		game.hasMoved = data.hasMoved ?? false;
		game.hasFought = data.hasFought ?? false;
		game.hasShopped = data.hasShopped ?? false;
		game.hasUsedCasino = data.hasUsedCasino ?? false;
		game.lootedTreasures = new SvelteSet(data.lootedTreasures ?? []);
		return game;
	}
}
