import toast from 'svelte-french-toast';
import { Player } from './player/player';
import type { WheelBase } from './wheels/wheels';
import { refresh } from '$lib/stores/gameStore';

export class Game {
	players: Player[] = [];
	started: boolean = false;

	globalHpReduction: number = 1;

	customWheels: Map<string, WheelBase> = new Map();

	/**
	 * --------------------------------------------------------------------------
	 * Turns
	 */

	playerOrder: Record<number, string> = {};
	private _currentTurn: number = 0;
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
			toast.success(`${alivePlayers[0].name} has won the game!`);
			return alivePlayers[0];
		}

		const player = this.getPlayerByName(this.playerOrder[this.currentTurn]);
		if (!player) {
			toast.error(
				`Could not get current turn, player ${this.playerOrder[this.currentTurn]} not found!`
			);
			return;
		}

		if (player.dead) {
			this.incrementTurn();
			return this.currentPlayer;
		}
		return player;
	}

	startTurn() {
		const player = this.currentPlayer;
		if (!player) return;
		player.onTurnStart();
		refresh();
	}

	finishTurn() {
		const player = this.currentPlayer;
		if (!player) return;

		player.onTurnEnd();
		this.incrementTurn();
		this.startTurn();
	}

	/**
	 * --------------------------------------------------------------------------
	 * Shadow Realm
	 */
	private _shadowRealm: Player[] = [];
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
		toast.success(`${player.name} has been sent to the Shadow Realm!`);
		this.shadowRealm.push(player);
	}

	//Todo - Add Spawn location outside of shadow realm
	removePlayerFromShadowRealm(player: Player) {
		if (this._shadowRealm.includes(player)) {
			this._shadowRealm = this._shadowRealm.filter((p) => p !== player);
			toast.success(`${player.name} has been removed from the Shadow Realm!`);
		}
	}

	/**
	 * --------------------------------------------------------------------------
	 * Functions
	 */
	getPlayerByName(name: string): Player | undefined {
		return this.players.find((player) => player.name === name);
	}
}
