import toast from '$lib/stores/toaster.svelte';
import type { GameContext } from '../gameContext';
import type { SerializedPlayerStatuses } from '../serialization';
import type { StatusEffect, StatusType } from '../statuses/statusTypes';
import statusEffects from '../statuses/statusTypes';
import type { GameHookName } from '../types';
import type { Player } from './player.svelte';

export class PlayerStatuses {
	private _player: Player;
	private _playerName: string;

	constructor(player: Player) {
		this._player = player;
		this._playerName = player.name;
	}

	private get player(): Player {
		return this._player;
	}

	private _statuses: PlayerStatusEffect[] = $state([]);

	public get statuses(): PlayerStatusEffect[] {
		return this._statuses;
	}

	dispatchHook(hook: GameHookName, ...args: unknown[]) {
		for (const status of this._statuses) {
			const handler = status.status[hook] as ((...handlerArgs: unknown[]) => void) | undefined;
			handler?.(this.player, ...args);
		}
	}

	addStatus(status: StatusType, ctx?: GameContext) {
		const statusEffect = new PlayerStatusEffect(status);
		statusEffect.duration = statusEffect.status.turnDuration;

		//Don't allow duplicates unless the status allows it
		if (
			!statusEffect.status.allowMultiple &&
			this._statuses.some((s) => s.status === statusEffect.status)
		) {
			toast.error(`${this.player.name} already has ${statusEffect.status.name}!`);
			return;
		}

		this.player.game?.addAuditTrail(`${this.player.name} now has ${statusEffect.status.name}!`);
		this._statuses.push(statusEffect);
		if (ctx) {
			statusEffect.status.onApply?.(this.player, ctx);
		}
	}

	canHaveStatus(status: StatusType) {
		const statusEffect = statusEffects[status];
		if (statusEffect.classLock && !statusEffect.classLock.includes(this.player.classType)) {
			return false;
		}
		return true;
	}

	hasStatus(status: StatusType) {
		return this._statuses.some((s) => s.statusName === status);
	}

	getEffect(status: StatusType) {
		return this._statuses.find((s) => s.statusName === status);
	}

	removeStatus(status: StatusType, ctx?: GameContext) {
		const statusEffect = this._statuses.find((s) => s.statusName === status);
		if (!statusEffect) return;
		this.removeStatusEffect(statusEffect, ctx);
	}

	removeStatusEffect(statusEffect: PlayerStatusEffect, ctx?: GameContext) {
		this.player.game?.addAuditTrail(
			`${this.player.name} no longer has ${statusEffect.status.name}!`
		);
		if (ctx) {
			statusEffect.status.onRemove?.(this.player, ctx);
		}
		this._statuses = this._statuses.filter((x) => x !== statusEffect);
	}

	onTurnEnd(ctx: GameContext) {
		const statusesToRemove: PlayerStatusEffect[] = [];

		this._statuses.forEach((s) => {
			if (s.duration !== undefined) {
				s.duration -= 1;
				if (s.duration <= 0) {
					statusesToRemove.push(s);
				}
			}
		});

		statusesToRemove.forEach((s) => {
			this.player.game?.addAuditTrail(`${this.player.name} no longer has ${s.status.name}!`);
			s.status.onRemove?.(this.player, ctx);
			this._statuses = this._statuses.filter((x) => x !== s);
		});
	}

	/**
	 * --------------------------------------------------------------------------
	 * Serialization
	 */

	serialize(): SerializedPlayerStatuses {
		return {
			playerName: this._playerName,
			statuses: this._statuses.map((status) => ({
				statusName: status.statusName,
				duration: status.duration
			}))
		};
	}

	static deserialize(data: SerializedPlayerStatuses, player: Player): PlayerStatuses {
		const statuses = new PlayerStatuses(player);

		statuses._statuses = data.statuses.map((statusData) => {
			const status = new PlayerStatusEffect(statusData.statusName);
			status.duration = statusData.duration;
			return status;
		});

		return statuses;
	}
}

export class PlayerStatusEffect {
	private _statusName: StatusType;

	duration = $state<number>();

	constructor(status: StatusType) {
		this._statusName = status;
	}

	get status(): StatusEffect {
		return statusEffects[this._statusName];
	}

	get statusName(): StatusType {
		return this._statusName;
	}
}
