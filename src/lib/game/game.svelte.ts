import { hasPlayerAttacked } from '$lib/components/game/AttackPlayer.svelte';
import { addAuditTrail } from '$lib/stores/gameStore.svelte';
import toast from 'svelte-french-toast';
import { SvelteMap } from 'svelte/reactivity';
import type { AllItems } from './items/itemTypes';
import { Player } from './player/player.svelte';
import type { WheelBase } from './wheels/wheels';

export class Game {
	players: Player[] = $state([]);

	alivePlayers = $derived(this.players.filter((player) => !player.dead));
	started = $state(false);

	winner = $state<Player | undefined>(undefined);

	globalHpReduction = $state(1);

	customWheels = new SvelteMap<string, WheelBase>();

	itemCostModifiers = new SvelteMap<AllItems, number>();

	//playerNames
	skippedNextTurns = $state<string[]>([]);

	shopCostModifier = $state(0);
	shopConsumableCostModifier = $state(0);

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
	private set currentTurn(value: number) {
		this._currentTurn = value;
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
			// addAuditTrail(`${alivePlayers[0].name} has won the game!`);
			return alivePlayers[0];
		}

		const player = this.getPlayerByName(this.playerOrder[this.currentTurn]);
		if (!player) {
			toast.error(
				`Could not get current turn, player ${this.playerOrder[this.currentTurn]} not found!`
			);
			return;
		}

		// if (player.dead) {

		// 	this.incrementTurn();
		// 	return this.currentPlayer;
		// }
		return player;
	}

	startTurn() {
		if (!this.hasTurnStarted) {
			this.currentPlayer?.onTurnStart();
			this.addAuditTrail(`${this.currentPlayer?.name} starts their turn!`);
			this.hasTurnStarted = true;

			//skip the turn if the player has skipped the next turn
			if (this.skippedNextTurns.includes(this.currentPlayer?.name ?? '')) {
				this.skippedNextTurns = this.skippedNextTurns.filter(
					(name) => name !== this.currentPlayer?.name
				);
				this.startTurn();
			}

			if (this.currentPlayer?.dead) {
				toast.success('player is dead');
				this.finishTurn();
			} else {
				toast.success('player is not dead');
			}
		}
	}

	gainAnotherTurn() {
		this.addAuditTrail(`${this.currentPlayer?.name} gets another turn`);
		this.hasTurnStarted = true;
		hasPlayerAttacked.value = false;
	}

	finishTurn() {
		this.addAuditTrail(`${this.currentPlayer?.name} finishes their turn!`);
		this.currentPlayer?.onTurnEnd();
		this.incrementTurn();
		this.hasTurnStarted = false;
		hasPlayerAttacked.value = false;
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
		addAuditTrail(`${player.name} has been sent to the Shadow Realm!`);
		this.shadowRealm.push(player);
	}

	//Todo - Add Spawn location outside of shadow realm
	removePlayerFromShadowRealm(player: Player) {
		if (this._shadowRealm.includes(player)) {
			this._shadowRealm = this._shadowRealm.filter((p) => p !== player);
			addAuditTrail(`${player.name} has been removed from the Shadow Realm!`);
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
			customWheels: Array.from(this.customWheels.entries()), // Convert SvelteMap to array
			playerOrder: this.playerOrder,
			_currentTurn: this._currentTurn,
			_shadowRealm: this._shadowRealm,
			itemCostModifiers: Array.from(this.itemCostModifiers.entries()),
			auditTrail: this.auditTrail,
			shopCostModifier: this.shopCostModifier,
			shopConsumableCostModifier: this.shopConsumableCostModifier,
			hasTurnStarted: this.hasTurnStarted,
			skippedNextTurns: this.skippedNextTurns
		});
	}

	// Deserialize a JSON string to create a Game instance
	public static deserialize(json: string): Game {
		const data = JSON.parse(json);
		const game = new Game();
		game.players = data.players.map((p: any) => Player.deserialize(p));
		game.started = data.started;
		game.globalHpReduction = data.globalHpReduction;
		game.customWheels = new SvelteMap(data.customWheels); // Convert array back to SvelteMap
		game.playerOrder = data.playerOrder;
		game._currentTurn = data._currentTurn;
		game._shadowRealm = data._shadowRealm;
		game.itemCostModifiers = new SvelteMap(data.itemCostModifiers);
		game.auditTrail = data.auditTrail;
		game.shopCostModifier = data.shopCostModifier;
		game.hasTurnStarted = data.hasTurnStarted;
		game.skippedNextTurns = data.skippedNextTurns;
		return game;
	}
}
