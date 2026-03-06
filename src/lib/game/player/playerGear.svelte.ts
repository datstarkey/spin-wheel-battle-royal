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
import { getServerGameContext } from '../serverContext';
import type { SerializedPlayerGear } from '../serialization';
import type { Player } from './player.svelte';

type GearHookName =
	| 'onAttackWin'
	| 'onAttackLose'
	| 'onDefendWin'
	| 'onDefendLose'
	| 'onAttackStart'
	| 'onAttackEnd'
	| 'onDefenseStart'
	| 'onDefenseEnd'
	| 'onTurnStart'
	| 'onTurnEnd';

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

	/** Resolve ctx — use provided value or fall back to server singleton */
	private resolveCtx(ctx?: GameContext): GameContext {
		return ctx ?? getServerGameContext();
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

	dispatchHook(hook: GearHookName, ...args: unknown[]) {
		for (const item of this.gearItems) {
			const handler = item[hook] as ((...handlerArgs: unknown[]) => void) | undefined;
			handler?.(this.player, ...args);
		}
	}

	/**
	 * --------------------------------------------------------------------------
	 * Events
	 */

	onAttackWin(defendingPlayer: Player, ctx: GameContext) {
		this.dispatchHook('onAttackWin', defendingPlayer, ctx);
	}

	onAttackLose(defendingPlayer: Player, ctx: GameContext) {
		this.dispatchHook('onAttackLose', defendingPlayer, ctx);
	}

	onDefendWin(attackingPlayer: Player, ctx: GameContext) {
		this.dispatchHook('onDefendWin', attackingPlayer, ctx);
	}

	onDefendLose(attackingPlayer: Player, ctx: GameContext) {
		this.dispatchHook('onDefendLose', attackingPlayer, ctx);
	}

	onAttackStart(defendingPlayer: Player, ctx: GameContext) {
		this.dispatchHook('onAttackStart', defendingPlayer, ctx);
	}

	onAttackEnd(defendingPlayer: Player, ctx: GameContext) {
		this.dispatchHook('onAttackEnd', defendingPlayer, ctx);
	}

	onDefenseStart(attackingPlayer: Player, ctx: GameContext) {
		this.dispatchHook('onDefenseStart', attackingPlayer, ctx);
	}

	onDefenseEnd(attackingPlayer: Player, ctx: GameContext) {
		this.dispatchHook('onDefenseEnd', attackingPlayer, ctx);
	}

	onTurnStart(ctx: GameContext) {
		this.dispatchHook('onTurnStart', ctx);
	}

	onTurnEnd(ctx: GameContext) {
		this.dispatchHook('onTurnEnd', ctx);
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
		const resolvedCtx = this.resolveCtx(ctx);
		switch (key) {
			case 'mainhand':
				if (this._mainHand) {
					const actualItem = getItemByType(this._mainHand);
					actualItem?.onUnequip?.(this.player, 'mainhand', resolvedCtx);
					this._mainHand = null;
				}
				break;
			case 'offHand':
				if (this._offHand) {
					const actualItem = getItemByType(this._offHand);
					actualItem?.onUnequip?.(this.player, 'offHand', resolvedCtx);
					this._offHand = null;
				}
				break;
			case 'helm':
				if (this._helm) {
					const actualItem = getItemByType(this._helm);
					actualItem?.onUnequip?.(this.player, 'helm', resolvedCtx);
					this._helm = null;
				}
				break;
			case 'chest':
				if (this._chest) {
					const actualItem = getItemByType(this._chest);
					actualItem?.onUnequip?.(this.player, 'chest', resolvedCtx);
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

	useConsumable(item: Consumables, ctx?: GameContext) {
		const index = this._consumables.indexOf(item);
		if (index === -1) {
			toast.error('Consumable not found in inventory');
			return;
		}

		const actualItem = getItemByType(item);
		actualItem?.onUse?.(this.player, this.resolveCtx(ctx));

		this.player.game?.addAuditTrail(`${this.player.name} uses ${item}!`);
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

	addMainHand(item: AllItems, ctx?: GameContext) {
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
			this.unequipItem('mainhand', ctx);
		}
		this._mainHand = item as MainHands;
		actualItem.onEquip?.(this.player, 'mainhand', this.resolveCtx(ctx));
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

	addOffHand(item: AllItems, ctx?: GameContext) {
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
			this.unequipItem('offHand', ctx);
		}
		this._offHand = item as OffHands;
		actualItem.onEquip?.(this.player, 'offHand', this.resolveCtx(ctx));
	}

	/**
	 * --------------------------------------------------------------------------
	 * Helm
	 */
	private _helm = $state<Helms | null>(null);
	public get helm(): Helms | null {
		return this._helm;
	}

	addHelm(item: AllItems, ctx?: GameContext) {
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
			this.unequipItem('helm', ctx);
		}
		this._helm = item as Helms;
		actualItem.onEquip?.(this.player, 'helm', this.resolveCtx(ctx));
	}

	/**
	 * --------------------------------------------------------------------------
	 * Chest
	 */
	private _chest = $state<Chests | null>(null);
	public get chest(): Chests | null {
		return this._chest;
	}

	addChest(item: AllItems, ctx?: GameContext) {
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
			this.unequipItem('chest', ctx);
		}
		this._chest = item as Chests;
		actualItem.onEquip?.(this.player, 'chest', this.resolveCtx(ctx));
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
