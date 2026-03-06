import toast from '$lib/stores/toaster.svelte';
import type { GameContext } from '../gameContext';
import type { AllItems, Consumables, Item, ItemType } from '../items/itemTypes';
import items, {
	getItemByType,
	type Chests,
	type Helms,
	type MainHands,
	type OffHands
} from '../items/itemTypes';
import { resolveCtx } from '../serverContext';
import type { SerializedPlayerGear } from '../serialization';
import type { GameHookName } from '../types';
import type { Player } from './player.svelte';

export class PlayerGear {
	private _player: Player | null = null;
	private _playerName: string;

	constructor(playerNameOrPlayer: string | Player) {
		if (typeof playerNameOrPlayer === 'string') {
			this._playerName = playerNameOrPlayer;
		} else {
			this._player = playerNameOrPlayer;
			this._playerName = playerNameOrPlayer.name;
		}
	}

	setPlayer(player: Player) {
		this._player = player;
	}

	private get player(): Player {
		if (this._player) {
			return this._player;
		}
		throw new Error(`Player ${this._playerName} not resolved — call setPlayer() first`);
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

	dispatchHook(hook: GameHookName, ...args: unknown[]) {
		for (const item of this.gearItems) {
			const handler = item[hook] as ((...handlerArgs: unknown[]) => void) | undefined;
			handler?.(this.player, ...args);
		}
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

	unequipItem(key: ItemType, ctx?: GameContext) {
		const slot = this.getSlotField(key);
		if (!slot) return;

		const currentItem = slot.get();
		if (currentItem) {
			getItemByType(currentItem)?.onUnequip?.(this.player, key, resolveCtx(ctx));
			slot.set(null);
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

	useConsumable(item: Consumables, ctx?: GameContext) {
		const index = this._consumables.indexOf(item);
		if (index === -1) {
			toast.error('Consumable not found in inventory');
			return;
		}

		const actualItem = getItemByType(item);
		actualItem?.onUse?.(this.player, resolveCtx(ctx));

		this.player.game?.addAuditTrail(`${this.player.name} uses ${item}!`);
		this._consumables.splice(index, 1);
	}

	/**
	 * --------------------------------------------------------------------------
	 * Equipment Slots
	 */
	private _mainHand = $state<MainHands | null>(null);
	private _offHand = $state<OffHands | null>(null);
	private _helm = $state<Helms | null>(null);
	private _chest = $state<Chests | null>(null);

	public get mainHand(): MainHands | null {
		return this._mainHand;
	}
	public get mainHandItem(): Item | null {
		return this._mainHand ? getItemByType(this._mainHand) : null;
	}
	public get offHand(): OffHands | null {
		return this._offHand;
	}
	public get offHandItem(): Item | null {
		return this._offHand ? getItemByType(this._offHand) : null;
	}
	public get helm(): Helms | null {
		return this._helm;
	}
	public get chest(): Chests | null {
		return this._chest;
	}

	/** Slot accessor map for generic equip/unequip operations */
	private getSlotField(
		slot: ItemType
	): { get: () => AllItems | null; set: (v: null) => void } | null {
		switch (slot) {
			case 'mainhand':
				return { get: () => this._mainHand, set: () => (this._mainHand = null) };
			case 'offHand':
				return { get: () => this._offHand, set: () => (this._offHand = null) };
			case 'helm':
				return { get: () => this._helm, set: () => (this._helm = null) };
			case 'chest':
				return { get: () => this._chest, set: () => (this._chest = null) };
			default:
				return null;
		}
	}

	private equipSlot(
		item: AllItems,
		expectedTypes: ItemType[],
		slotType: ItemType,
		assign: (item: AllItems) => void,
		ctx?: GameContext
	) {
		const actualItem = getItemByType(item);
		if (!actualItem) {
			toast.error('Item is not a valid item');
			return;
		}
		if (!expectedTypes.includes(actualItem.type)) {
			toast.error(`Item is not a ${slotType}`);
			return;
		}
		this.unequipItem(slotType, ctx);
		assign(item);
		actualItem.onEquip?.(this.player, slotType, resolveCtx(ctx));
	}

	addMainHand(item: AllItems, ctx?: GameContext) {
		this.equipSlot(item, ['mainhand'], 'mainhand', (i) => (this._mainHand = i as MainHands), ctx);
	}

	addOffHand(item: AllItems, ctx?: GameContext) {
		this.equipSlot(
			item,
			['offHand', 'mainhand'],
			'offHand',
			(i) => (this._offHand = i as OffHands),
			ctx
		);
	}

	addHelm(item: AllItems, ctx?: GameContext) {
		this.equipSlot(item, ['helm'], 'helm', (i) => (this._helm = i as Helms), ctx);
	}

	addChest(item: AllItems, ctx?: GameContext) {
		this.equipSlot(item, ['chest'], 'chest', (i) => (this._chest = i as Chests), ctx);
	}

	/**
	 * --------------------------------------------------------------------------
	 * Serialization
	 */

	serialize(): SerializedPlayerGear {
		return {
			playerName: this._playerName,
			mainHand: this._mainHand,
			offHand: this._offHand,
			helm: this._helm,
			chest: this._chest,
			consumables: this._consumables
		};
	}

	static deserialize(data: SerializedPlayerGear, player: Player): PlayerGear {
		const gear = new PlayerGear(player);
		gear._consumables = data.consumables;

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
