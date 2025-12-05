import {
	addAuditTrail,
	currentGame,
	getGlobalHpReduction,
	getItemCost,
	increaseGlobalHpReduction,
	increaseShopConsumableCostModifier,
	increaseShopCostModifier
} from '$lib/stores/gameStore.svelte';
import toast from '$lib/stores/toaster.svelte';
import { classMap, type ClassBase, type ClassType } from '../classes/classType';
import { getItemByType, type AllItems } from '../items/itemTypes';
import type { SerializedPlayer } from '../serialization';
import { generateDamageTakenWheel } from '../wheels/damageTakenWheel';
import { generateLoseWheel } from '../wheels/loseWheel';
import { generateShadowRealmWheel } from '../wheels/shadowRealm';
import { generateWinWheel } from '../wheels/winWheel';
import { PlayerGear } from './playerGear.svelte';
import { PlayerStatuses } from './playerStatuses.svelte';

export class Player {
	constructor(name: string) {
		this._name = name;
		this.gear = new PlayerGear(this);
		this.statuses = new PlayerStatuses(this);
	}
	private _name = $state<string>('');
	public get name(): string {
		return this._name;
	}

	gear: PlayerGear;
	statuses: PlayerStatuses;

	resources: Record<string, number> = $state({});

	/**
	 * --------------------------------------------------------------------------
	 * Stat Modifiers System
	 */
	// Track all stat modifiers by source (item name or status name)
	private _statModifiersAttack = $state<Record<string, number>>({});
	private _statModifiersDefense = $state<Record<string, number>>({});
	private _statModifiersMovement = $state<Record<string, number>>({});
	private _statModifiersAttackRange = $state<Record<string, number>>({});
	private _statModifiersHp = $state<Record<string, number>>({});
	
	private get statModifiers() {
		return {
			attack: this._statModifiersAttack,
			defense: this._statModifiersDefense,
			movement: this._statModifiersMovement,
			attackRange: this._statModifiersAttackRange,
			hp: this._statModifiersHp
		};
	}
	
	// Public getters for UI display
	get activeModifiers() {
		return {
			attack: { ...this._statModifiersAttack },
			defense: { ...this._statModifiersDefense },
			movement: { ...this._statModifiersMovement },
			attackRange: { ...this._statModifiersAttackRange },
			hp: { ...this._statModifiersHp }
		};
	}

	// Add or update a stat modifier
	addStatModifier(source: string, stat: 'attack' | 'defense' | 'movement' | 'attackRange' | 'hp', value: number) {
		switch(stat) {
			case 'attack':
				this._statModifiersAttack[source] = value;
				break;
			case 'defense':
				this._statModifiersDefense[source] = value;
				break;
			case 'movement':
				this._statModifiersMovement[source] = value;
				break;
			case 'attackRange':
				this._statModifiersAttackRange[source] = value;
				break;
			case 'hp':
				this._statModifiersHp[source] = value;
				break;
		}
		addAuditTrail(`${this.name} gains ${value > 0 ? '+' : ''}${value} ${stat} from ${source}`);
	}

	// Remove a stat modifier
	removeStatModifier(source: string, stat: 'attack' | 'defense' | 'movement' | 'attackRange' | 'hp') {
		let value: number | undefined;
		switch(stat) {
			case 'attack':
				value = this._statModifiersAttack[source];
				if (value !== undefined) delete this._statModifiersAttack[source];
				break;
			case 'defense':
				value = this._statModifiersDefense[source];
				if (value !== undefined) delete this._statModifiersDefense[source];
				break;
			case 'movement':
				value = this._statModifiersMovement[source];
				if (value !== undefined) delete this._statModifiersMovement[source];
				break;
			case 'attackRange':
				value = this._statModifiersAttackRange[source];
				if (value !== undefined) delete this._statModifiersAttackRange[source];
				break;
			case 'hp':
				value = this._statModifiersHp[source];
				if (value !== undefined) delete this._statModifiersHp[source];
				break;
		}
		if (value !== undefined) {
			addAuditTrail(`${this.name} loses ${value > 0 ? '+' : ''}${value} ${stat} from ${source}`);
		}
	}

	// Get total modifier for a stat
	getTotalStatModifier(stat: 'attack' | 'defense' | 'movement' | 'attackRange' | 'hp'): number {
		switch(stat) {
			case 'attack':
				return Object.values(this._statModifiersAttack).reduce((sum, value) => sum + value, 0);
			case 'defense':
				return Object.values(this._statModifiersDefense).reduce((sum, value) => sum + value, 0);
			case 'movement':
				return Object.values(this._statModifiersMovement).reduce((sum, value) => sum + value, 0);
			case 'attackRange':
				return Object.values(this._statModifiersAttackRange).reduce((sum, value) => sum + value, 0);
			case 'hp':
				return Object.values(this._statModifiersHp).reduce((sum, value) => sum + value, 0);
			default:
				return 0;
		}
	}

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
			this._hp = value;
			this._gold = value;
		} else {
			this._hp = value;
		}
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
		return Math.max(1, this._baseMovement + this.bonusMovement);
	}
	public get baseMovement(): number {
		return this._baseMovement;
	}

	public get bonusMovement(): number {
		return this._bonusMovement + this.getTotalStatModifier('movement');
	}

	public set baseMovement(value: number) {
		if (value < 1) value = 1;
		this._baseMovement = value;
		addAuditTrail(`${this.name} base movement is now ${this.movement}!`);
	}
	public set bonusMovement(value: number) {
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
		return this._bonusAttackRange + this.getTotalStatModifier('attackRange');
	}
	public set bonusAttackRange(value: number) {
		this._bonusAttackRange = value;
		addAuditTrail(`${this.name} attack range is now ${this.attackRange}!`);
	}
	public get attackRange(): number {
		return this._baseAttackRange + this.bonusAttackRange;
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
		return this._bonusAttack + this.getTotalStatModifier('attack');
	}
	public set bonusAttack(value: number) {
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
		return (this.bonusAttack + this.baseAttack + this.brassKnucklesMultiplier) * this.attackMultiplier;
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
		let bonus = this._bonusDefense + this.getTotalStatModifier('defense');
		if (this.classType == 'gigachad') {
			// GigaChad gets 30% of base attack as defense
			const gigaChadBonus = Math.floor(0.3 * this._baseAttack);
			bonus += gigaChadBonus;
		}
		return bonus;
	}
	public set bonusDefense(value: number) {
		this._bonusDefense = value;
		addAuditTrail(`${this.name} bonus defense is now ${this.bonusDefense}!`);
	}

	public get defenseMultiplier(): number {
		return Object.values(this.defenseMultipliers).reduce((acc, cur) => acc * cur, 1);
	}

	//Combine both when getting defense
	public get defense(): number {
		const value = this.bonusDefense > 0 ? this.bonusDefense + this.baseDefense : this.baseDefense;
		return value * this.defenseMultiplier;
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
			this._hp = this._gold;
		}
		addAuditTrail(`${this.name} now has ${this.gold} gold!`);
	}

	/**
	 * --------------------------------------------------------------------------
	 * Functions
	 */

	assignClass(classType: ClassType) {
		// Remove previous class modifiers if any
		if (this._class && this._class !== 'none') {
			this.removeStatModifier(`Class: ${this.class.name}`, 'defense');
		}
		
		this._class = classType;
		this._hp = this.class.hp;
		this._baseAttack = this.class.attack;
		this._baseDefense = this.class.defense;
		this._baseAttackRange = this.class.attackRange;
		this._gold = this.class.startingGold ?? 30;

		if (this.classType == 'gambler') {
			this._hp = this.class.startingGold ?? 0;
		}
		
		// Apply class-specific passive modifiers
		if (this.classType == 'gigachad') {
			// GigaChad's defense bonus is handled dynamically in the getter
			// No need to add it to modifiers
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
			toast.error(`${item} is not a valid item!`);
			return;
		}

		addAuditTrail(`${this.name} was given ${item}!`);
		this.gear.addItem(item);
	}
	buyItem(item: AllItems) {
		const actualItem = getItemByType(item);
		if (!actualItem) {
			toast.error(`${item} is not a valid item!`);
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
		if (this.name) generateWinWheel(this.name);
		if (defendingPlayer.name) generateDamageTakenWheel(defendingPlayer.name);
	}

	onAttackLose(defendingPlayer: Player) {
		defendingPlayer.gold += 1;
		this.hp -= getGlobalHpReduction();
		this.statuses.onAttackLose(defendingPlayer);
		this.gear.onAttackLose(defendingPlayer);
		this.class.onAttackLose?.(this, defendingPlayer);
		if (this.name) generateLoseWheel(this.name);
		if (this.name) generateDamageTakenWheel(this.name);
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
			if (this.name) generateShadowRealmWheel(this.name);
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

	serialize(): SerializedPlayer {
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
			defenseMultipliers: this.defenseMultipliers, // Fixed: was 'defenseMultiplier'
			gold: this._gold,
			resources: this.resources,
			gear: this.gear.serialize(),
			statuses: this.statuses.serialize(),
			statModifiers: {
				attack: this._statModifiersAttack,
				defense: this._statModifiersDefense,
				movement: this._statModifiersMovement,
				attackRange: this._statModifiersAttackRange,
				hp: this._statModifiersHp
			}
		};
	}

	static deserialize(data: SerializedPlayer): Player {
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
		player.defenseMultipliers = data.defenseMultipliers; // Fixed: was 'defenseMultiplier'
		player._gold = data.gold;
		player.resources = data.resources;
		player._statModifiersAttack = data.statModifiers.attack;
		player._statModifiersDefense = data.statModifiers.defense;
		player._statModifiersMovement = data.statModifiers.movement;
		player._statModifiersAttackRange = data.statModifiers.attackRange;
		player._statModifiersHp = data.statModifiers.hp;
		player.gear = PlayerGear.deserialize(data.gear, player);
		player.statuses = PlayerStatuses.deserialize(data.statuses, player);
		player.statuses.applyDeserializedStatuses();
		return player;
	}
}
