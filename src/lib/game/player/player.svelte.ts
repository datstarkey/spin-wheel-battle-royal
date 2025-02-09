import {
	addAuditTrail,
	currentGame,
	getGlobalHpReduction,
	getItemCost,
	increaseGlobalHpReduction,
	increaseShopConsumableCostModifier,
	increaseShopCostModifier
} from '$lib/stores/gameStore.svelte';
import toast from 'svelte-french-toast';
import { classMap, type ClassBase, type ClassType } from '../classes/classType';
import items, { getItemByType, type AllItems } from '../items/itemTypes';
import { generateDamageTakenWheel } from '../wheels/damageTakenWheel';
import { generateLoseWheel } from '../wheels/loseWheel';
import { generateShadowRealmWheel } from '../wheels/shadowRealm';
import { generateWinWheel } from '../wheels/winWheel';
import { PlayerGear } from './playerGear.svelte';
import { PlayerStatuses } from './playerStatuses.svelte';

export class Player {
	constructor(name: string) {
		this._name = name;
		this.gear = new PlayerGear(name);
		this.statuses = new PlayerStatuses(name);
	}
	private _name = $state<string>('');
	public get name() {
		return this._name;
	}

	gear: PlayerGear;
	statuses: PlayerStatuses;

	resources: Record<string, number> = $state({});

	private _inShadowRealm = $state(false);
	public get inShadowRealm() {
		return this._inShadowRealm;
	}
	public set inShadowRealm(value) {
		this._inShadowRealm = value;
	}

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

		if (this.classType == 'gambler') {
			this._gold = value;
			this._hp = this.gold;
		} else {
			this._hp = value;
		}
		this._hp = value;
		if (this._hp < 0) this._hp = 0;
		if (this._hp === 0) {
			addAuditTrail(`${this.name} is dead!`);
			increaseGlobalHpReduction();
			this.dead = true;

			if (currentGame.value?.currentPlayer == this) {
				currentGame.value?.finishTurn();
			}
		} else {
			addAuditTrail(`${this.name} has ${this.hp} HP!`);
		}
	}

	dead = $state(false);

	/**
	 * --------------------------------------------------------------------------
	 * Class Stats
	 */

	private _class: ClassType = $state('none');

	public get classType(): ClassType {
		return this._class;
	}
	public get class(): ClassBase {
		return classMap[this._class];
	}

	public set class(value: ClassBase) {
		const classType = Object.keys(classMap).find((key) => classMap[key as ClassType] === value);
		this._class = classType as ClassType;
	}

	/**
	 * --------------------------------------------------------------------------
	 * Movement
	 */

	private _baseMovement = $state(1);
	private _bonusMovement = $state(0);
	public get movement(): number {
		if (this._bonusMovement < 0) return this._baseMovement;
		return this._baseMovement + this._bonusMovement;
	}
	public get baseMovement(): number {
		return this._baseMovement;
	}

	public get bonusMovement(): number {
		return this._bonusMovement;
	}

	public set baseMovement(value: number) {
		if (value < 1) value = 1;
		this._baseMovement = value;
		addAuditTrail(`${this.name} base movement is now ${this.movement}!`);
	}
	public set bonusMovement(value: number) {
		if (value < 0) value = 0;
		this._bonusMovement = value;
		addAuditTrail(`${this.name} movement is now ${this.movement}!`);
	}

	/**
	 * --------------------------------------------------------------------------
	 * Attack Range
	 */

	private _baseAttackRange = $state(1);
	private _bonusAttackRange = $state(0);

	public get baseAttackRange(): number {
		return this._baseAttackRange;
	}
	public set baseAttackRange(value: number) {
		if (value < 1) value = 1;
		this._baseAttackRange = value;
		addAuditTrail(`${this.name} base attack range is now ${this.attackRange}!`);
	}
	public get bonusAttackRange(): number {
		return this._bonusAttackRange;
	}
	public set bonusAttackRange(value: number) {
		if (value < 0) value = 0;
		this._bonusAttackRange = value;
		addAuditTrail(`${this.name} bonus attack range is now ${this.attackRange}!`);
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
		return this._bonusAttack + this.brassKnucklesMultiplier;
	}
	public set bonusAttack(value: number) {
		if (value < 0) value = 0;
		this._bonusAttack = value;
		addAuditTrail(`${this.name} bonus attack is now ${this.bonusAttack}!`);
	}

	//Base
	public get baseAttack(): number {
		return this._baseAttack;
	}
	public set baseAttack(value: number) {
		if (value < 1) value = 1;
		this._baseAttack = value;
		addAuditTrail(`${this.name} base attack is now ${this.baseAttack}!`);
	}

	public get attackMultiplier(): number {
		return Object.values(this.attackMultipliers).reduce((acc, cur) => acc * cur, 1);
	}

	//Combine both as basic attack
	public get attack(): number {
		//Add brass knuckles multiplier after attack multipliers
		return this.bonusAttack + this.baseAttack * this.attackMultiplier;
	}

	/**
	 * --------------------------------------------------------------------------
	 * Defense Stats
	 */

	private _baseDefense = $state(0);
	private _bonusDefense = $state(0);
	defenseMultipliers: Record<string, number> = $state({});

	//Base
	public get baseDefense(): number {
		return this._baseDefense;
	}
	public set baseDefense(value: number) {
		if (value < 1) value = 1;
		this._baseDefense = value;
		addAuditTrail(`${this.name} base defense is now ${this.baseDefense}!`);
	}

	//Bonus
	public get bonusDefense(): number {
		if (this.classType == 'gigachad') {
			const gigaChadBonus = 0.3 * this._baseAttack;
			return this._bonusDefense + gigaChadBonus;
		}
		return this._bonusDefense;
	}
	public set bonusDefense(value: number) {
		if (value < 0) value = 0;
		this._bonusDefense = value;
		addAuditTrail(`${this.name} bonus defense is now ${this.bonusDefense}!`);
	}

	public get defenseMultiplier(): number {
		return Object.values(this.defenseMultipliers).reduce((acc, cur) => acc * cur, 1);
	}

	//Combine both when getting defense
	public get defense(): number {
		const value = this.bonusDefense > 0 ? this.bonusDefense + this.baseDefense : this.baseDefense;
		const multiplier = this.defenseMultiplier;
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
		if (this.classType == 'gambler') {
			this.hp = this.gold;
		}
		addAuditTrail(`${this.name} now has ${this.gold} gold!`);
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
		this._gold = this.class.startingGold ?? 30;

		if (this.classType == 'gambler') {
			this._hp = this.class.startingGold ?? 0;
		}
	}

	inventoryCount(itemName: string): number {
		return this.gear.allItems.filter((i) => i.name === itemName).length;
	}

	canBuyItem(item: AllItems): boolean {
		const actualItem = getItemByType(item);
		if (!actualItem) {
			return false;
		}

		const cost = getItemCost(item);
		if (this.gold < cost) {
			return false;
		}

		if (actualItem.maxAmount && this.inventoryCount(actualItem.name) >= actualItem.maxAmount) {
			return false;
		}
		if (actualItem.classLocks && !actualItem.classLocks.includes(this.classType)) {
			return false;
		}
		return true;
	}

	assignItem(item: AllItems) {
		const actualItem = getItemByType(item);
		if (!actualItem) {
			toast.error(`${items} is not a valid item!`);
			return;
		}

		addAuditTrail(`${this.name} was given ${item}!`);
		this.gear.addItem(item);
	}
	buyItem(item: AllItems) {
		const actualItem = getItemByType(item);
		if (!actualItem) {
			toast.error(`${items} is not a valid item!`);
			return;
		}

		if (!this.canBuyItem(item)) {
			return;
		}

		const cost = getItemCost(item);

		addAuditTrail(`${this.name} buys ${item}!`);
		this.gear.addItem(item);
		this.gold -= cost;

		if (actualItem.type == 'consumables') {
			increaseShopConsumableCostModifier(1);
		} else {
			increaseShopCostModifier(1);
		}
	}

	/**
	 * --------------------------------------------------------------------------
	 * Events
	 */

	onAttackWin(defendingPlayer: Player) {
		this.gold += 1;
		this.statuses.onAttackWin(defendingPlayer);
		this.gear.onAttackWin(defendingPlayer);
		this.class.onAttackWin(this, defendingPlayer);
		generateWinWheel(this.name);
		generateDamageTakenWheel(defendingPlayer.name);
	}

	onAttackLose(defendingPlayer: Player) {
		defendingPlayer.gold += 1;
		this.hp -= getGlobalHpReduction();
		this.statuses.onAttackLose(defendingPlayer);
		this.gear.onAttackLose(defendingPlayer);
		this.class.onAttackLose?.(this, defendingPlayer);
		generateLoseWheel(this.name);
		generateDamageTakenWheel(this.name);
	}

	onDefendWin(playerAttackingYou: Player) {
		this.statuses.onDefendWin(playerAttackingYou);
		this.gear.onDefendWin(playerAttackingYou);
		this.class.onDefendWin?.(this, playerAttackingYou);
	}

	onDefendLose(playerAttackingYou: Player) {
		this.statuses.onDefendLose(playerAttackingYou);
		this.gear.onDefendLose(playerAttackingYou);
		this.class.onDefendLose?.(this, playerAttackingYou);
	}

	onDefenseStart(playerAttackingYou: Player) {
		this.statuses.onDefenseStart(playerAttackingYou);
		this.gear.onDefenseStart(playerAttackingYou);
		this.class.onDefenseStart?.(this, playerAttackingYou);
	}

	onDefenseEnd(playerAttackingYou: Player) {
		this.statuses.onDefenseEnd(playerAttackingYou);
		this.gear.onDefenseEnd(playerAttackingYou);
		this.class.onDefenseEnd?.(this, playerAttackingYou);
	}

	onTurnStart() {
		this.class.onTurnStart?.(this);
		this.gear.onTurnStart();
		this.statuses.onTurnStart();
		if (this.inShadowRealm) {
			addAuditTrail(`${this.name} is in the Shadow Realm!`);
			generateShadowRealmWheel(this.name);
		}
	}

	onTurnEnd() {
		this.class.onTurnEnd?.(this);
		this.gear.onTurnEnd();
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
			hp: this._hp,
			class: this._class,
			dead: this.dead,
			movement: this._baseMovement,
			bonusMovement: this._bonusMovement,
			baseAttackRange: this._baseAttackRange,
			bonusAttackRange: this._bonusAttackRange,
			inShadowRealm: this._inShadowRealm,
			bonusAttack: this._bonusAttack,
			baseAttack: this._baseAttack,
			attackMultipliers: this.attackMultipliers,
			brassKnucklesMultiplier: this._brassKnucklesMultiplier,
			baseDefense: this._baseDefense,
			bonusDefense: this._bonusDefense,
			defenseMultiplier: this.defenseMultipliers,
			gold: this._gold,
			resources: this.resources,
			gear: this.gear.serialize(),
			statuses: this.statuses.serialize()
		};
	}

	static deserialize(data: Record<string, any>): Player {
		const player = new Player(data.name);
		player._hp = data.hp;
		player._class = data.class;
		player.dead = data.dead;
		player._baseMovement = data.movement;
		player._bonusMovement = data.bonusMovement;
		player._baseAttackRange = data.baseAttackRange;
		player._bonusAttackRange = data.bonusAttackRange;
		player._inShadowRealm = data.inShadowRealm;
		player._bonusAttack = data.bonusAttack;
		player._baseAttack = data.baseAttack;
		player.attackMultipliers = data.attackMultipliers;
		player._brassKnucklesMultiplier = data.brassKnucklesMultiplier;
		player._baseDefense = data.baseDefense;
		player._bonusDefense = data.bonusDefense;
		player.defenseMultipliers = data.defenseMultiplier;
		player._gold = data.gold;
		player.resources = data.resources;
		player.gear = PlayerGear.deserialize(data.gear);
		player.statuses = PlayerStatuses.deserialize(data.statuses);
		return player;
	}
}
