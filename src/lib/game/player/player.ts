import { getGlobalHpReduction, increaseGlobalHpReduction, refresh } from '$lib/stores/gameStore';
import toast from 'svelte-french-toast';
import { type ClassType, classMap, type ClassBase } from '../classes/classType';
import { PlayerGear } from './playerGear';
import { PlayerStatuses } from './playerStatuses';
import { generateWinWheel } from '../wheels/winWheel';
import { generateLoseWheel } from '../wheels/loseWheel';

export class Player {
	constructor(name: string) {
		this.name = name;
		this.gear = new PlayerGear(name);
		this.statuses = new PlayerStatuses(name);
	}
	name: string;
	dead: boolean = false;
	gear: PlayerGear;
	statuses: PlayerStatuses;

	resources: Record<string, number> = {};

	/**
	 * --------------------------------------------------------------------------
	 * HP Stats
	 */
	private _hp: number = 0;
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
		refresh();
	}

	/**
	 * --------------------------------------------------------------------------
	 * Class Stats
	 */

	private _class: ClassType = 'none';
	public get class(): ClassBase {
		return classMap[this._class];
	}

	/**
	 * --------------------------------------------------------------------------
	 * Movement
	 */

	private _movement: number = 0;
	private _bonusMovement: number = 0;
	public get movement(): number {
		if (this._bonusMovement < 0) return this._movement;
		return this._movement + this._bonusMovement;
	}

	public set bonusMovement(value: number) {
		this._bonusMovement = value;
		toast.success(`${this.name} movement is now ${this.movement}!`);
		refresh();
	}

	/**
	 * --------------------------------------------------------------------------
	 * Attack Range
	 */

	private _baseAttackRange: number = 1;
	public get baseAttackRange(): number {
		return this._baseAttackRange;
	}
	public set baseAttackRange(value: number) {
		this._baseAttackRange = value;
	}
	private _bonusAttackRange: number = 0;
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

	private _bonusAttack: number = 0;
	private _baseAttack: number = 0;
	attackMultipliers: Record<string, number> = {};

	//Bonus
	public get bonusAttack(): number {
		return this._bonusAttack;
	}
	public set bonusAttack(value: number) {
		this._bonusAttack = value;
		toast.success(`${this.name} bonus attack is now ${this.bonusAttack}!`);
		refresh();
	}

	//Base
	public get baseAttack(): number {
		return this._baseAttack;
	}
	public set baseAttack(value: number) {
		this._baseAttack = value;
		toast.success(`${this.name} base attack is now ${this.baseAttack}!`);
		refresh();
	}

	//Combine both as basic attack
	public get attack(): number {
		//if bonus attack is negative, don't include it
		const value = this.bonusAttack > 0 ? this.bonusAttack + this.baseAttack : this.baseAttack;
		const multiplier = Object.values(this.attackMultipliers).reduce((acc, cur) => acc * cur, 1);
		return value * multiplier;
	}

	/**
	 * --------------------------------------------------------------------------
	 * Defense Stats
	 */

	private _baseDefense: number = 0;
	private _bonusDefense: number = 0;
	defenseMultiplier: Record<string, number> = {};

	//Base
	public get baseDefense(): number {
		return this._baseDefense;
	}
	public set baseDefense(value: number) {
		this._baseDefense = value;
		toast.success(`${this.name} base defense is now ${this.baseDefense}!`);
		refresh();
	}

	//Bonus
	public get bonusDefense(): number {
		return this._bonusDefense;
	}
	public set bonusDefense(value: number) {
		this._bonusDefense = value;
		toast.success(`${this.name} bonus defense is now ${this.bonusDefense}!`);
		refresh();
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

	private _gold: number = 0;
	public get gold(): number {
		return this._gold;
	}
	public set gold(value: number) {
		this._gold = value;
		if (this._gold < 0) this._gold = 0;
		toast.success(`${this.name} now has ${this.gold} gold!`);
		refresh();
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
		refresh();
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
}
