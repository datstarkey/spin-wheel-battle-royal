import { getGlobalHpReduction, increaseGlobalHpReduction } from '$lib/stores/gameStore.svelte';
import toast from 'svelte-french-toast';
import { classMap, type ClassBase, type ClassType } from '../classes/classType';
import { generateLoseWheel } from '../wheels/loseWheel';
import { generateWinWheel } from '../wheels/winWheel';
import { PlayerGear } from './playerGear.svelte';
import { PlayerStatuses } from './playerStatuses.svelte';

export class Player {
	constructor(name: string) {
		this.name = name;
		this.gear = new PlayerGear(name);
		this.statuses = new PlayerStatuses(name);
	}
	name: string = $state<string>()!;
	dead = $state(false);
	gear: PlayerGear;
	statuses: PlayerStatuses;

	resources: Record<string, number> = $state({});

	/**
	 * --------------------------------------------------------------------------
	 * HP Stats
	 */
	private _hp = $state(0);
	public get hp(): number {
		return this._hp;
	}
	public set hp(value: number) {
		if (this.dead) {
			toast.error("Can't change HP of dead player!");
			return;
		}

		this._hp = value;
		if (this._hp < 0) this._hp = 0;
		if (this._hp === 0) {
			toast.error(`${this.name} is dead!`);
			increaseGlobalHpReduction();
			this.dead = true;
		}
	}

	/**
	 * --------------------------------------------------------------------------
	 * Class Stats
	 */

	private _class: ClassType = $state('none');
	public get class(): ClassBase {
		return classMap[this._class];
	}

	/**
	 * --------------------------------------------------------------------------
	 * Movement
	 */

	private _movement = $state(0);
	private _bonusMovement = $state(0);
	public get movement(): number {
		if (this._bonusMovement < 0) return this._movement;
		return this._movement + this._bonusMovement;
	}

	public set bonusMovement(value: number) {
		this._bonusMovement = value;
		toast.success(`${this.name} movement is now ${this.movement}!`);
	}

	/**
	 * --------------------------------------------------------------------------
	 * Attack Range
	 */

	private _baseAttackRange = $state(1);
	public get baseAttackRange(): number {
		return this._baseAttackRange;
	}
	public set baseAttackRange(value: number) {
		this._baseAttackRange = value;
	}
	private _bonusAttackRange = $state(0);
	public get bonusAttackRange(): number {
		return this._bonusAttackRange;
	}
	public set bonusAttackRange(value: number) {
		this._bonusAttackRange = value;
	}
	public get attackRange(): number {
		return this._baseAttackRange + this._bonusAttackRange;
	}

	/**
	 * --------------------------------------------------------------------------
	 * Attack Stats
	 */

	private _bonusAttack = $state(0);
	private _baseAttack = $state(0);
	attackMultipliers: Record<string, number> = $state({});

	//Brass Knuckles multiplier, increases by your defense value
	private _brassKnucklesMultiplier = $state(0);
	public get brassKnucklesMultiplier(): number {
		return this._brassKnucklesMultiplier * this.defense;
	}
	public set brassKnucklesMultiplier(value: number) {
		this._brassKnucklesMultiplier = value;
	}

	//Bonus
	public get bonusAttack(): number {
		return this._bonusAttack;
	}
	public set bonusAttack(value: number) {
		this._bonusAttack = value;
		toast.success(`${this.name} bonus attack is now ${this.bonusAttack}!`);
	}

	//Base
	public get baseAttack(): number {
		return this._baseAttack;
	}
	public set baseAttack(value: number) {
		this._baseAttack = value;
		toast.success(`${this.name} base attack is now ${this.baseAttack}!`);
	}

	//Combine both as basic attack
	public get attack(): number {
		//if bonus attack is negative, don't include it
		const value = this.bonusAttack > 0 ? this.bonusAttack + this.baseAttack : this.baseAttack;
		const multiplier = Object.values(this.attackMultipliers).reduce((acc, cur) => acc * cur, 1);

		//Add brass knuckles multiplier after attack multipliers
		return value * multiplier + this.brassKnucklesMultiplier;
	}

	/**
	 * --------------------------------------------------------------------------
	 * Defense Stats
	 */

	private _baseDefense = $state(0);
	private _bonusDefense = $state(0);
	defenseMultiplier: Record<string, number> = $state({});

	//Base
	public get baseDefense(): number {
		return this._baseDefense;
	}
	public set baseDefense(value: number) {
		this._baseDefense = value;
		toast.success(`${this.name} base defense is now ${this.baseDefense}!`);
	}

	//Bonus
	public get bonusDefense(): number {
		return this._bonusDefense;
	}
	public set bonusDefense(value: number) {
		this._bonusDefense = value;
		toast.success(`${this.name} bonus defense is now ${this.bonusDefense}!`);
	}

	//Combine both when getting defense
	public get defense(): number {
		const value = this.bonusDefense > 0 ? this.bonusDefense + this.baseDefense : this.baseDefense;
		const multiplier = Object.values(this.defenseMultiplier).reduce((acc, cur) => acc * cur, 1);
		return value * multiplier;
	}

	/**
	 * --------------------------------------------------------------------------
	 * Gold Stats
	 */

	private _gold = $state(0);
	public get gold(): number {
		return this._gold;
	}
	public set gold(value: number) {
		this._gold = value;
		if (this._gold < 0) this._gold = 0;
		toast.success(`${this.name} now has ${this.gold} gold!`);
	}

	/**
	 * --------------------------------------------------------------------------
	 * Functions
	 */

	assignClass(classType: ClassType) {
		this._class = classType;
		this._hp = this.class.hp;
		this._baseAttack = this.class.attack;
		this._baseDefense = this.class.defense;
		this._baseAttackRange = this.class.attackRange;
	}

	/**
	 * --------------------------------------------------------------------------
	 * Events
	 */

	onWin(attackingPlayer: Player) {
		this.gold += 1;
		attackingPlayer.hp -= getGlobalHpReduction();
		this.statuses.onWin(attackingPlayer);
		this.gear.onWin(attackingPlayer);
		this.class.onWin(this, attackingPlayer);

		generateWinWheel(this.name);
	}

	onLose(attackingPlayer: Player) {
		attackingPlayer.gold += 1;
		this.hp -= getGlobalHpReduction();
		this.statuses.onLose(attackingPlayer);
		this.gear.onLose(attackingPlayer);
		this.class.onLose?.(this, attackingPlayer);
		generateLoseWheel(this.name);
	}

	onTurnStart() {
		this.statuses.onTurnStart();
	}

	onTurnEnd() {
		this.statuses.onTurnEnd();
	}

	onAttackStart(attackingPlayer: Player) {
		this.gear.onAttackStart(attackingPlayer);
	}
	onAttackEnd(attackingPlayer: Player) {
		this.gear.onAttackEnd(attackingPlayer);
	}

	/**
	 * --------------------------------------------------------------------------
	 * Serialization
	 */

	serialize(): Record<string, any> {
		return {
			name: this.name,
			dead: this.dead,
			hp: this._hp,
			class: this._class,
			movement: this._movement,
			bonusMovement: this._bonusMovement,
			baseAttackRange: this._baseAttackRange,
			bonusAttackRange: this._bonusAttackRange,
			bonusAttack: this._bonusAttack,
			baseAttack: this._baseAttack,
			attackMultipliers: this.attackMultipliers,
			brassKnucklesMultiplier: this._brassKnucklesMultiplier,
			baseDefense: this._baseDefense,
			bonusDefense: this._bonusDefense,
			defenseMultiplier: this.defenseMultiplier,
			gold: this._gold,
			resources: this.resources,
			gear: this.gear.serialize(),
			statuses: this.statuses.serialize()
		};
	}

	static deserialize(data: Record<string, any>): Player {
		const player = new Player(data.name);
		player.dead = data.dead;
		player._hp = data.hp;
		player._class = data.class;
		player._movement = data.movement;
		player._bonusMovement = data.bonusMovement;
		player._baseAttackRange = data.baseAttackRange;
		player._bonusAttackRange = data.bonusAttackRange;
		player._bonusAttack = data.bonusAttack;
		player._baseAttack = data.baseAttack;
		player.attackMultipliers = data.attackMultipliers;
		player._brassKnucklesMultiplier = data.brassKnucklesMultiplier;
		player._baseDefense = data.baseDefense;
		player._bonusDefense = data.bonusDefense;
		player.defenseMultiplier = data.defenseMultiplier;
		player._gold = data.gold;
		player.resources = data.resources;
		player.gear = PlayerGear.deserialize(data.gear);
		player.statuses = PlayerStatuses.deserialize(data.statuses);
		return player;
	}
}
