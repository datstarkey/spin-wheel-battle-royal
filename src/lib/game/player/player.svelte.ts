import { teleportToRandomSpawn } from '$lib/stores/teleportStore.svelte';
import toast from '$lib/stores/toaster.svelte';
import type { GameContext } from '../gameContext';
import type { Game } from '../game.svelte';
import type { Position } from '../board/types';
import { classMap, type ClassBase, type ClassType } from '../classes/classType';
import { getItemByType, type AllItems } from '../items/itemTypes';
import type { SerializedPlayer, StatType } from '../serialization';
import type { GameHookName } from '../types';
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

	/** Reference to parent Game instance. Set by Game when player is added/deserialized. */
	private _game: Game | null = null;

	/** Public accessor for sub-objects (PlayerGear, classes, etc.) */
	get game(): Game | null {
		return this._game;
	}

	setGame(game: Game | null) {
		this._game = game;
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
	private _statModifiers = $state<Record<StatType, Record<string, number>>>({
		attack: {},
		defense: {},
		movement: {},
		attackRange: {},
		hp: {}
	});

	// Public getters for UI display
	get activeModifiers() {
		return {
			attack: { ...this._statModifiers.attack },
			defense: { ...this._statModifiers.defense },
			movement: { ...this._statModifiers.movement },
			attackRange: { ...this._statModifiers.attackRange },
			hp: { ...this._statModifiers.hp }
		};
	}

	// Add or update a stat modifier
	addStatModifier(source: string, stat: StatType, value: number) {
		this._statModifiers[stat][source] = value;
		this._game?.addAuditTrail(
			`${this.name} gains ${value > 0 ? '+' : ''}${value} ${stat} from ${source}`
		);
	}

	// Remove a stat modifier
	removeStatModifier(source: string, stat: StatType) {
		const value = this._statModifiers[stat][source];
		if (value !== undefined) {
			delete this._statModifiers[stat][source];
			this._game?.addAuditTrail(
				`${this.name} loses ${value > 0 ? '+' : ''}${value} ${stat} from ${source}`
			);
		}
	}

	// Get total modifier for a stat
	getTotalStatModifier(stat: StatType): number {
		return Object.values(this._statModifiers[stat]).reduce((sum, value) => sum + value, 0);
	}

	private _inShadowRealm = $state(false);
	public get inShadowRealm() {
		return this._inShadowRealm;
	}
	public set inShadowRealm(value: boolean) {
		this._inShadowRealm = value;
	}

	/**
	 * --------------------------------------------------------------------------
	 * Board Position
	 */
	private _position = $state<Position | null>(null);
	public get position(): Position | null {
		return this._position;
	}
	public set position(value: Position | null) {
		this._position = value;
	}

	/**
	 * --------------------------------------------------------------------------
	 * HP Stats
	 */
	private _hp = $state(0);
	private _maxHp = $state(0);

	public get hp(): number {
		return this._hp;
	}
	public get maxHp(): number {
		return this._maxHp;
	}
	public set hp(value: number) {
		if (this.dead) return;

		this._hp = Math.max(0, value);
		if (this.classType === 'gambler') {
			this._gold = this._hp;
		}

		// Track max HP as highest value seen
		if (this._hp > this._maxHp) {
			this._maxHp = this._hp;
		}
	}

	takeDamage(amount: number) {
		if (this.dead || amount <= 0) return;

		const oldHp = this._hp;
		this.hp = oldHp - amount;

		if (this._hp === 0) {
			this._game?.addAuditTrail(`${this.name} took ${amount} damage and is dead!`);
			this.die();
		} else {
			this._game?.addAuditTrail(
				`${this.name} took ${amount} damage (${this._hp}/${this._maxHp} HP)`
			);
		}
	}

	heal(amount: number) {
		if (this.dead || amount <= 0) return;

		this.hp = this._hp + amount;
		this._game?.addAuditTrail(`${this.name} healed ${amount} HP (${this._hp}/${this._maxHp})`);
	}

	die() {
		if (this.dead) return;
		this.dead = true;
		this._game?.increaseGlobalHpReduction();

		if (this._game?.currentPlayer === this) {
			this._game?.finishTurn();
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
		if (classType) {
			this._class = classType as ClassType;
		}
	}

	/**
	 * --------------------------------------------------------------------------
	 * Movement
	 */

	private _baseMovement = $state(3);
	private _bonusMovement = $state(0);
	public get movement(): number {
		// Include global movement bonus (increases every 5 global turns, max +4)
		return Math.max(
			1,
			this._baseMovement + this.bonusMovement + (this._game?.globalMovementBonus ?? 0)
		);
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
		this._game?.addAuditTrail(`${this.name} base movement is now ${this.movement}!`);
	}
	public set bonusMovement(value: number) {
		this._bonusMovement = value;
		this._game?.addAuditTrail(`${this.name} movement is now ${this.movement}!`);
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
		this._game?.addAuditTrail(`${this.name} base attack range is now ${this.attackRange}!`);
	}
	public get bonusAttackRange(): number {
		return this._bonusAttackRange + this.getTotalStatModifier('attackRange');
	}
	public set bonusAttackRange(value: number) {
		this._bonusAttackRange = value;
		this._game?.addAuditTrail(`${this.name} attack range is now ${this.attackRange}!`);
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

	//Bonus
	public get bonusAttack(): number {
		let bonus = this._bonusAttack + this.getTotalStatModifier('attack');
		// Add class-specific bonus attack if defined
		if (this.class.getBonusAttack) {
			bonus += this.class.getBonusAttack(this);
		}
		return bonus;
	}
	public set bonusAttack(value: number) {
		this._bonusAttack = value;
		this._game?.addAuditTrail(`${this.name} bonus attack is now ${this.bonusAttack}!`);
	}
	public get rawBonusAttack(): number {
		return this._bonusAttack;
	}

	//Base
	public get baseAttack(): number {
		return this._baseAttack;
	}
	public set baseAttack(value: number) {
		if (value < 1) value = 1;
		this._baseAttack = value;
		this._game?.addAuditTrail(`${this.name} base attack is now ${this.baseAttack}!`);
	}

	public get attackMultiplier(): number {
		return Object.values(this.attackMultipliers).reduce((acc, cur) => acc * cur, 1);
	}

	//Combine both as basic attack
	public get attack(): number {
		return (this.bonusAttack + this.baseAttack) * this.attackMultiplier;
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
		this._game?.addAuditTrail(`${this.name} base defense is now ${this.baseDefense}!`);
	}

	//Bonus
	public get bonusDefense(): number {
		let bonus = this._bonusDefense + this.getTotalStatModifier('defense');
		// Add class-specific bonus defense if defined
		if (this.class.getBonusDefense) {
			bonus += this.class.getBonusDefense(this);
		}
		return bonus;
	}
	public set bonusDefense(value: number) {
		this._bonusDefense = value;
		this._game?.addAuditTrail(`${this.name} bonus defense is now ${this.bonusDefense}!`);
	}
	public get rawBonusDefense(): number {
		return this._bonusDefense;
	}

	public get defenseMultiplier(): number {
		return Object.values(this.defenseMultipliers).reduce((acc, cur) => acc * cur, 1);
	}

	//Combine both when getting defense
	public get defense(): number {
		return (this.bonusDefense + this.baseDefense) * this.defenseMultiplier;
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
		const oldGold = this._gold;
		this._gold = Math.max(0, value);
		if (this.classType === 'gambler') {
			this._hp = this._gold;
		}
		const delta = this._gold - oldGold;
		if (delta !== 0) {
			this._game?.addAuditTrail(`${this.name} now has ${this.gold} gold!`);
		}
	}

	/**
	 * --------------------------------------------------------------------------
	 * Functions
	 */

	assignClass(classType: ClassType) {
		// Remove ALL stat modifiers from previous class
		if (this._class && this._class !== 'none') {
			const oldClassName = this.class.name;
			const statTypes: StatType[] = ['attack', 'defense', 'movement', 'attackRange', 'hp'];
			for (const stat of statTypes) {
				this.removeStatModifier(`Class: ${oldClassName}`, stat);
			}
		}

		this._class = classType;
		this._hp = this.class.hp;
		this._baseAttack = this.class.attack;
		this._baseDefense = this.class.defense;
		this._baseAttackRange = this.class.attackRange;
		this._gold = this.class.startingGold ?? 30;

		if (this.classType === 'gambler') {
			this._hp = this.class.startingGold ?? 0;
		}
	}

	inventoryCount(itemName: string): number {
		return this.gear.allItems.filter((i) => i.name === itemName).length;
	}

	canBuyItem(item: AllItems): boolean {
		// Can only buy one item per turn
		if (this._game?.hasShopped) {
			return false;
		}

		const actualItem = getItemByType(item);
		if (!actualItem) {
			return false;
		}

		const cost = this._game?.getItemCost(item) ?? Infinity;
		if (this.gold < cost) {
			return false;
		}

		// Gamblers can't buy items that would reduce their gold to 0 (since HP = Gold)
		if (this.classType === 'gambler' && this.gold - cost <= 0) {
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

		this._game?.addAuditTrail(`${this.name} was given ${item}!`);
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

		const cost = this._game?.getItemCost(item) ?? 0;

		this._game?.addAuditTrail(`${this.name} buys ${item}!`);
		this.gear.addItem(item);
		this.gold -= cost;

		// Mark that the player has shopped this turn
		if (this._game) this._game.hasShopped = true;

		if (actualItem.type == 'consumables') {
			if (this._game) this._game.shopConsumableCostModifier += 1;
		} else {
			if (this._game) this._game.shopCostModifier += 1;
		}
	}

	/**
	 * --------------------------------------------------------------------------
	 * Events
	 */

	private dispatchStatusesGearClassHook(hook: GameHookName, ...args: unknown[]) {
		this.statuses.dispatchHook(hook, ...args);
		this.gear.dispatchHook(hook, ...args);
		const classHandler = this.class[hook] as ((...handlerArgs: unknown[]) => void) | undefined;
		classHandler?.(this, ...args);
	}

	private dispatchClassGearStatusesHook(hook: GameHookName, ...args: unknown[]) {
		const classHandler = this.class[hook] as ((...handlerArgs: unknown[]) => void) | undefined;
		classHandler?.(this, ...args);
		this.gear.dispatchHook(hook, ...args);
		this.statuses.dispatchHook(hook, ...args);
	}

	onAttackWin(defendingPlayer: Player, ctx: GameContext) {
		this.gold += 1;
		this.dispatchStatusesGearClassHook('onAttackWin', defendingPlayer, ctx);
		if (this.name) generateWinWheel(this.name, ctx);
		if (defendingPlayer.name) generateDamageTakenWheel(defendingPlayer.name, ctx);
	}

	onAttackLose(defendingPlayer: Player, ctx: GameContext) {
		defendingPlayer.gold += 1;
		this.takeDamage(this._game?.globalHpReduction ?? 0);
		this.dispatchStatusesGearClassHook('onAttackLose', defendingPlayer, ctx);
		if (this.name) generateLoseWheel(this.name, ctx);
		if (this.name) generateDamageTakenWheel(this.name, ctx);
		// Teleport to random spawn on loss (unless in shadow realm)
		if (!this.inShadowRealm) {
			teleportToRandomSpawn(this);
		}
	}

	onDefendWin(playerAttackingYou: Player, ctx: GameContext) {
		this.dispatchStatusesGearClassHook('onDefendWin', playerAttackingYou, ctx);
	}

	onDefendLose(playerAttackingYou: Player, ctx: GameContext) {
		this.dispatchStatusesGearClassHook('onDefendLose', playerAttackingYou, ctx);
		// Teleport to random spawn on loss (unless in shadow realm)
		if (!this.inShadowRealm) {
			teleportToRandomSpawn(this);
		}
	}

	onDefenseStart(playerAttackingYou: Player, ctx: GameContext) {
		this.dispatchStatusesGearClassHook('onDefenseStart', playerAttackingYou, ctx);
	}

	onDefenseEnd(playerAttackingYou: Player, ctx: GameContext) {
		this.dispatchStatusesGearClassHook('onDefenseEnd', playerAttackingYou, ctx);
	}

	onTurnStart(ctx: GameContext) {
		this.dispatchClassGearStatusesHook('onTurnStart', ctx);
		if (this.inShadowRealm) {
			this._game?.addAuditTrail(`${this.name} is in the Shadow Realm!`);
			if (this.name) generateShadowRealmWheel(this.name, ctx);
		}
	}

	onTurnEnd(ctx: GameContext, context?: { hasMoved: boolean; totalMovement: number }) {
		this.dispatchClassGearStatusesHook('onTurnEnd', ctx, context);
	}

	onAttackStart(defendingPlayer: Player, ctx: GameContext) {
		this.dispatchStatusesGearClassHook('onAttackStart', defendingPlayer, ctx);
	}

	onAttackEnd(defendingPlayer: Player, ctx: GameContext) {
		this.dispatchStatusesGearClassHook('onAttackEnd', defendingPlayer, ctx);
	}

	/**
	 * --------------------------------------------------------------------------
	 * Serialization
	 */

	serialize(): SerializedPlayer {
		return {
			name: this.name,
			hp: this._hp,
			maxHp: this._maxHp,
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
			baseDefense: this._baseDefense,
			bonusDefense: this._bonusDefense,
			defenseMultipliers: this.defenseMultipliers,
			gold: this._gold,
			resources: this.resources,
			gear: this.gear.serialize(),
			statuses: this.statuses.serialize(),
			statModifiers: this._statModifiers,
			position: this._position
		};
	}

	static deserialize(data: SerializedPlayer): Player {
		const player = new Player(data.name);
		player._hp = data.hp;
		player._maxHp = data.maxHp ?? data.hp; // Fallback to current HP for backwards compatibility
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
		player._baseDefense = data.baseDefense;
		player._bonusDefense = data.bonusDefense;
		player.defenseMultipliers = data.defenseMultipliers;
		player._gold = data.gold;
		player.resources = data.resources;
		player._statModifiers = data.statModifiers;
		player._position = data.position;
		player.gear = PlayerGear.deserialize(data.gear, player);
		player.statuses = PlayerStatuses.deserialize(data.statuses, player);
		// Stat modifiers are restored directly from serialized _statModifiers,
		// so onApply hooks are not re-invoked (they would require a GameContext).
		return player;
	}
}
