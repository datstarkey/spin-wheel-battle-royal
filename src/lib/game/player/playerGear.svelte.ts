import { getPlayerByName } from '$lib/stores/gameStore.svelte';
import toast from 'svelte-french-toast';
import type { Item, ItemType } from '../items/itemTypes';
import items, { type Chests, type Helms, type MainHands, type OffHands } from '../items/itemTypes';
import type { Player } from './player.svelte';

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

	private _consumables = $state<Item[]>([]);
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
	}

	/**
	 * --------------------------------------------------------------------------
	 * Main Hand
	 */
	private _mainHand = $state<Item | null>(null);
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
	}

	/**
	 * --------------------------------------------------------------------------
	 * Serialization
	 */

	serialize(): Record<string, any> {
		return {
			playerName: this._playerName,
			mainHand: this._mainHand?.name,
			offHand: this._offHand?.name,
			helm: this._helm?.name,
			chest: this._chest?.name,
			consumables: this._consumables.map((item) => item.name)
		};
	}

	static deserialize(data: Record<string, any>): PlayerGear {
		const gear = new PlayerGear(data.playerName);
		if (data.mainHand) gear.addMainHand(items.mainhand[data.mainHand as MainHands]);
		if (data.offHand) gear.addOffHand(items.offHand[data.offHand as OffHands]);
		if (data.helm) gear.addHelm(items.helm[data.helm as Helms]);
		if (data.chest) gear.addChest(items.chest[data.chest as Chests]);
		data.consumables?.forEach((name: string) => {
			gear.addConsumable(items.consumables[name as keyof typeof items.consumables]);
		});
		return gear;
	}
}
