import { getPlayerByName, refresh } from '$lib/stores/gameStore';
import toast from 'svelte-french-toast';
import type { Player } from './player';
import type { Item, ItemType } from '../items/itemTypes';

export class PlayerGear {
	private _playerName: string;

	constructor(playerName: string) {
		this._playerName = playerName;
	}

	private get player(): Player {
		return getPlayerByName(this._playerName) as Player;
	}

	private get gearItems(): Item[] {
		return [this._mainHand, this._offHand, this._helm, this._chest].filter(
			(x) => x !== null
		) as Item[];
	}

	get allItems(): Item[] {
		return this.gearItems.concat(this._consumables);
	}

	/**
	 * --------------------------------------------------------------------------
	 * Events
	 */

	onWin(attackingPlayer: Player) {
		this.gearItems.forEach((x) => x.onWin?.(this.player, attackingPlayer));
	}

	onLose(attackingPlayer: Player) {
		this.gearItems.forEach((x) => x.onLose?.(this.player, attackingPlayer));
	}

	onAttackStart(attackingPlayer: Player) {
		this.gearItems.forEach((x) => x.onAttackStart?.(this.player, attackingPlayer));
	}

	onAttackEnd(attackingPlayer: Player) {
		this.gearItems.forEach((x) => x.onAttackStart?.(this.player, attackingPlayer));
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

	unequipItem(key: ItemType) {
		let prop: any = '';
		switch (key) {
			case 'mainhand':
				prop = '_mainHand';
				break;
			case 'offHand':
				prop = '_offHand';
				break;
			case 'helm':
				prop = '_helm';
				break;
		}
		if ((this as any)[prop]) {
			(this as any)[prop].onUnequip?.(this.player);
			(this as any)[prop] = null;
		}
	}

	deleteItem(item: Item, key: ItemType) {
		if (key === 'consumables') {
			this._consumables = this._consumables.filter((x) => x.name !== item.name);
			return;
		}
		this.unequipItem(key);
	}

	/**
	 * --------------------------------------------------------------------------
	 * Consumables
	 */

	private _consumables: Item[] = [];
	public get consumables(): Item[] {
		return this._consumables;
	}
	public set consumables(value: Item[]) {
		this._consumables = value;
	}

	addConsumable(item: Item) {
		if (item.type !== 'consumables') {
			toast.error('Item is not a consumable');
			return;
		}
		this._consumables.push(item);
		refresh();
	}

	/**
	 * --------------------------------------------------------------------------
	 * Main Hand
	 */
	private _mainHand: Item | null = null;
	public get mainHand(): Item | null {
		return this._mainHand;
	}

	addMainHand(item: Item) {
		if (item.type !== 'mainhand') {
			toast.error('Item is not a main hand!');
			return;
		}
		if (this._mainHand) {
			this.unequipItem('mainhand');
		}
		this._mainHand = item;
		item.onEquip?.(this.player, 'mainhand');
		refresh();
	}

	/**
	 * --------------------------------------------------------------------------
	 * off Hand
	 */
	private _offHand: Item | null = null;
	public get offHand(): Item | null {
		return this._offHand;
	}

	addOffHand(item: Item) {
		if (item.type !== 'offHand' && item.type !== 'mainhand') {
			toast.error('Item is not a main hand or offhand');
			return;
		}
		if (this._offHand) {
			this.unequipItem('offHand');
		}
		this._offHand = item;
		item.onEquip?.(this.player, 'offHand');
		refresh();
	}

	/**
	 * --------------------------------------------------------------------------
	 * Helm
	 */
	private _helm: Item | null = null;
	public get helm(): Item | null {
		return this._helm;
	}

	addHelm(item: Item) {
		if (item.type !== 'helm') {
			toast.error('Item is not a helm');
			return;
		}
		if (this._helm) {
			this.unequipItem('helm');
		}
		this._helm = item;
		item.onEquip?.(this.player, 'helm');
		refresh();
	}

	/**
	 * --------------------------------------------------------------------------
	 * Chest
	 */
	private _chest: Item | null = null;
	public get chest(): Item | null {
		return this._chest;
	}

	addChest(item: Item) {
		if (item.type !== 'chest') {
			toast.error('Item is not a chest');
			return;
		}
		if (this._chest) {
			this.unequipItem('chest');
		}
		this._chest = item;
		item.onEquip?.(this.player, 'chest');
		refresh();
	}
}
