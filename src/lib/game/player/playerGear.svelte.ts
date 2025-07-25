import { addAuditTrail, getPlayerByName } from '$lib/stores/gameStore.svelte';
import toast from 'svelte-french-toast';
import type { AllItems, Consumables, Item, ItemType } from '../items/itemTypes';
import items, {
	getItemByType,
	type Chests,
	type Helms,
	type MainHands,
	type OffHands
} from '../items/itemTypes';
import type { Player } from './player.svelte';

export class PlayerGear {
	private _playerName: string;

	constructor(playerName: string) {
		this._playerName = playerName;
	}

	private get player(): Player {
		const player = getPlayerByName(this._playerName);
		if (!player) {
			throw new Error(`Player ${this._playerName} not found`);
		}
		return player;
	}

	private get gearItems(): Item[] {
		const items = [this._mainHand, this._offHand, this._helm, this._chest].filter(
			(x) => x !== null
		) as AllItems[];
		return items.map((x) => getItemByType(x)).filter((x) => x !== null);
	}

	get allItems(): Item[] {
		const consumables = this._consumables.map((x) => getItemByType(x)).filter((x) => x !== null);
		return this.gearItems.concat(consumables);
	}

	/**
	 * --------------------------------------------------------------------------
	 * Events
	 */

	onAttackWin(defendingPlayer: Player) {
		this.gearItems.forEach((x) => x.onAttackWin?.(this.player, defendingPlayer));
	}

	onAttackLose(defendingPlayer: Player) {
		this.gearItems.forEach((x) => x.onAttackLose?.(this.player, defendingPlayer));
	}

	onDefendWin(attackingPlayer: Player) {
		this.gearItems.forEach((x) => x.onDefendWin?.(this.player, attackingPlayer));
	}

	onDefendLose(attackingPlayer: Player) {
		this.gearItems.forEach((x) => x.onDefendLose?.(this.player, attackingPlayer));
	}

	onAttackStart(defendingPlayer: Player) {
		this.gearItems.forEach((x) => x.onAttackStart?.(this.player, defendingPlayer));
	}

	onAttackEnd(defendingPlayer: Player) {
		this.gearItems.forEach((x) => x.onAttackEnd?.(this.player, defendingPlayer));
	}

	onDefenseStart(attackingPlayer: Player) {
		this.gearItems.forEach((x) => x.onDefenseStart?.(this.player, attackingPlayer));
	}

	onDefenseEnd(attackingPlayer: Player) {
		this.gearItems.forEach((x) => x.onDefenseEnd?.(this.player, attackingPlayer));
	}

	onTurnStart() {
		this.gearItems.forEach((s) => s.onTurnStart?.(this.player));
	}

	onTurnEnd() {
		this.gearItems.forEach((s) => s.onTurnEnd?.(this.player));
	}

	/**
	 * --------------------------------------------------------------------------
	 * Functions
	 */

	addItem(item: AllItems) {
		const actualItem = getItemByType(item);
		if (!actualItem) {
			toast.error('Item is not a valid item');
			return;
		}

		switch (actualItem.type) {
			case 'consumables':
				this.addConsumable(item);
				break;
			case 'mainhand':
				this.addMainHand(item);
				break;
			case 'offHand':
				this.addOffHand(item);
				break;
			case 'helm':
				this.addHelm(item);
				break;
			case 'chest':
				this.addChest(item);
				break;
			default:
				toast.error('Item is not a valid type');
				break;
		}
	}

	unequipItem(key: ItemType) {
		switch (key) {
			case 'mainhand':
				if (this._mainHand) {
					const actualItem = getItemByType(this._mainHand);
					actualItem?.onUnequip?.(this.player, 'mainhand');
					this._mainHand = null;
				}
				break;
			case 'offHand':
				if (this._offHand) {
					const actualItem = getItemByType(this._offHand);
					actualItem?.onUnequip?.(this.player, 'offHand');
					this._offHand = null;
				}
				break;
			case 'helm':
				if (this._helm) {
					const actualItem = getItemByType(this._helm);
					actualItem?.onUnequip?.(this.player, 'helm');
					this._helm = null;
				}
				break;
			case 'chest':
				if (this._chest) {
					const actualItem = getItemByType(this._chest);
					actualItem?.onUnequip?.(this.player, 'chest');
					this._chest = null;
				}
				break;
		}
	}

	deleteItem(key: ItemType, index?: number) {
		switch (key) {
			case 'consumables':
				if (index === undefined) {
					this._consumables = [];
				} else {
					this._consumables.splice(index, 1);
				}
				break;
			case 'mainhand':
			case 'offHand':
			case 'helm':
			case 'chest':
				this.unequipItem(key);
				break;
		}
	}

	/**
	 * --------------------------------------------------------------------------
	 * Consumables
	 */

	private _consumables = $state<Consumables[]>([]);
	public get consumables(): Consumables[] {
		return this._consumables;
	}
	public set consumables(value: Consumables[]) {
		this._consumables = value;
	}

	addConsumable(item: AllItems) {
		if (item in items.consumables) {
			this._consumables.push(item as Consumables);
		} else {
			toast.error('Item is not a consumable');
		}
	}

	useConsumable(item: Consumables) {
		const index = this._consumables.indexOf(item);
		if (index === -1) {
			toast.error('Consumable not found in inventory');
			return;
		}
		
		const actualItem = getItemByType(item);
		actualItem?.onUse?.(this.player);

		addAuditTrail(`${this.player.name} uses ${item}!`);
		this._consumables.splice(index, 1);
	}

	/**
	 * --------------------------------------------------------------------------
	 * Main Hand
	 */
	private _mainHand = $state<MainHands | null>(null);
	public get mainHand(): MainHands | null {
		return this._mainHand;
	}

	public get mainHandItem(): Item | null {
		return this._mainHand ? getItemByType(this._mainHand) : null;
	}

	addMainHand(item: AllItems) {
		const actualItem = getItemByType(item);
		if (!actualItem) {
			toast.error('Item is not a valid item');
			return;
		}
		if (actualItem.type !== 'mainhand') {
			toast.error('Item is not a main hand!');
			return;
		}
		if (this._mainHand) {
			this.unequipItem('mainhand');
		}
		this._mainHand = item as MainHands;
		actualItem.onEquip?.(this.player, 'mainhand');
	}

	/**
	 * --------------------------------------------------------------------------
	 * off Hand
	 */
	private _offHand = $state<OffHands | null>(null);
	public get offHand(): OffHands | null {
		return this._offHand;
	}

	public get offHandItem(): Item | null {
		return this._offHand ? getItemByType(this._offHand) : null;
	}

	addOffHand(item: AllItems) {
		const actualItem = getItemByType(item);
		if (!actualItem) {
			toast.error('Item is not a valid item');
			return;
		}
		if (actualItem.type !== 'offHand' && actualItem.type !== 'mainhand') {
			toast.error('Item is not a main hand or offhand');
			return;
		}
		if (this._offHand) {
			this.unequipItem('offHand');
		}
		this._offHand = item as OffHands;
		actualItem.onEquip?.(this.player, 'offHand');
	}

	/**
	 * --------------------------------------------------------------------------
	 * Helm
	 */
	private _helm = $state<Helms | null>(null);
	public get helm(): Helms | null {
		return this._helm;
	}

	addHelm(item: AllItems) {
		const actualItem = getItemByType(item);
		if (!actualItem) {
			toast.error('Item is not a valid item');
			return;
		}
		if (actualItem.type !== 'helm') {
			toast.error('Item is not a helm');
			return;
		}
		if (this._helm) {
			this.unequipItem('helm');
		}
		this._helm = item as Helms;
		actualItem.onEquip?.(this.player, 'helm');
	}

	/**
	 * --------------------------------------------------------------------------
	 * Chest
	 */
	private _chest = $state<Chests | null>(null);
	public get chest(): Chests | null {
		return this._chest;
	}

	addChest(item: AllItems) {
		const actualItem = getItemByType(item);
		if (!actualItem) {
			toast.error('Item is not a valid item');
			return;
		}
		if (actualItem.type !== 'chest') {
			toast.error('Item is not a chest');
			return;
		}
		if (this._chest) {
			this.unequipItem('chest');
		}
		this._chest = item as Chests;
		actualItem.onEquip?.(this.player, 'chest');
	}

	/**
	 * --------------------------------------------------------------------------
	 * Serialization
	 */

	serialize(): Record<string, any> {
		return {
			playerName: this._playerName,
			mainHand: this._mainHand,
			offHand: this._offHand,
			helm: this._helm,
			chest: this._chest,
			consumables: this._consumables
		};
	}

	static deserialize(data: Record<string, any>): PlayerGear {
		const gear = new PlayerGear(data.playerName);
		gear._consumables = data.consumables || [];
		
		// Re-equip items to trigger onEquip callbacks
		if (data.mainHand) {
			gear.addMainHand(data.mainHand);
		}
		if (data.offHand) {
			gear.addOffHand(data.offHand);
		}
		if (data.helm) {
			gear.addHelm(data.helm);
		}
		if (data.chest) {
			gear.addChest(data.chest);
		}
		
		return gear;
	}
}
