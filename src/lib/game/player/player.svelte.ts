import {
	teleportFromShadowRealm,
	teleportToRandomSpawn,
	teleportToShadowRealm
} from '$lib/stores/teleportStore.svelte';
import toast from '$lib/stores/toaster.svelte';
import { getServerGameContext } from '$lib/game/serverContext';
import type { Game } from '../game.svelte';
import type { Position } from '../board/types';
import { classMap, type ClassBase, type ClassType } from '../classes/classType';
import { getItemByType, type AllItems } from '../items/itemTypes';
import type { SerializedPlayer, StatType } from '../serialization';
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
		const wasInShadowRealm = this._inShadowRealm;
		this._inShadowRealm = value;

		// Handle teleportation when entering/leaving shadow realm
		if (value && !wasInShadowRealm) {
			// Entering shadow realm - teleport to nearest shadow realm tile
			teleportToShadowRealm(this);
		} else if (!value && wasInShadowRealm) {
			// Leaving shadow realm - teleport to random spawn
			teleportFromShadowRealm(this);
		}
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
		if (this.dead) {
			toast.error("Can't change HP of dead player!");
			return;
		}

		const oldHp = this._hp;

		if (this.classType == 'gambler') {
			this._hp = value;
			this._gold = value;
		} else {
			this._hp = value;
		}
		if (this._hp < 0) this._hp = 0;

		// Track max HP as highest value seen
		if (this._hp > this._maxHp) {
			this._maxHp = this._hp;
		}

		const delta = this._hp - oldHp;

		if (this._hp === 0) {
			if (delta < 0) {
				this._game?.addAuditTrail(`${this.name} took ${Math.abs(delta)} damage and is dead!`);
			} else {
				this._game?.addAuditTrail(`${this.name} is dead!`);
			}
			this._game?.increaseGlobalHpReduction();
			this.dead = true;

			if (this._game?.currentPlayer === this) {
				this._game?.finishTurn();
			}
		} else if (delta !== 0) {
			if (delta > 0) {
				this._game?.addAuditTrail(`${this.name} healed ${delta} HP (${this._hp}/${this._maxHp})`);
			} else {
				this._game?.addAuditTrail(
					`${this.name} took ${Math.abs(delta)} damage (${this._hp}/${this._maxHp} HP)`
				);
			}
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
		return Object.values(this.attackMultipliers).reduce((acc, cur) => acc + cur, 1);
	}

	//Combine both as basic attack
	public get attack(): number {
		//Add brass knuckles multiplier after attack multipliers
		return (
			(this.bonusAttack + this.baseAttack + this.brassKnucklesMultiplier) * this.attackMultiplier
		);
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
		this._game?.addAuditTrail(`${this.name} now has ${this.gold} gold!`);
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

	onAttackWin(defendingPlayer: Player) {
		this.gold += 1;
		this.statuses.onAttackWin(defendingPlayer);
		this.gear.onAttackWin(defendingPlayer);
		this.class.onAttackWin(this, defendingPlayer);
		const ctx = getServerGameContext();
		if (this.name) generateWinWheel(this.name, ctx);
		if (defendingPlayer.name) generateDamageTakenWheel(defendingPlayer.name, ctx);
	}

	onAttackLose(defendingPlayer: Player) {
		defendingPlayer.gold += 1;
		this.hp -= this._game?.globalHpReduction ?? 0;
		this.statuses.onAttackLose(defendingPlayer);
		this.gear.onAttackLose(defendingPlayer);
		this.class.onAttackLose?.(this, defendingPlayer);
		const ctx = getServerGameContext();
		if (this.name) generateLoseWheel(this.name, ctx);
		if (this.name) generateDamageTakenWheel(this.name, ctx);
		// Teleport to random spawn on loss (unless in shadow realm)
		if (!this.inShadowRealm) {
			teleportToRandomSpawn(this);
		}
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
		// Teleport to random spawn on loss (unless in shadow realm)
		if (!this.inShadowRealm) {
			teleportToRandomSpawn(this);
		}
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
			this._game?.addAuditTrail(`${this.name} is in the Shadow Realm!`);
			if (this.name) generateShadowRealmWheel(this.name, getServerGameContext());
		}
	}

	onTurnEnd(context?: { hasMoved: boolean; totalMovement: number }) {
		this.class.onTurnEnd?.(this, context);
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
			brassKnucklesMultiplier: this._brassKnucklesMultiplier,
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
		player._brassKnucklesMultiplier = data.brassKnucklesMultiplier;
		player._baseDefense = data.baseDefense;
		player._bonusDefense = data.bonusDefense;
		player.defenseMultipliers = data.defenseMultipliers;
		player._gold = data.gold;
		player.resources = data.resources;
		player._statModifiers = data.statModifiers;
		player._position = data.position;
		player.gear = PlayerGear.deserialize(data.gear, player);
		player.statuses = PlayerStatuses.deserialize(data.statuses, player);
		player.statuses.applyDeserializedStatuses();
		return player;
	}
}
