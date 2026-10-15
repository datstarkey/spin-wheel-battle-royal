import type { GameContext } from '../gameContext';
import { resolveCtx } from '../serverContext';
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

		// A non-stacking status that is already active gets its duration refreshed instead
		const existing = this._statuses.find((s) => s.statusName === status);
		if (existing && !statusEffect.status.allowMultiple) {
			existing.duration = statusEffect.duration;
			this.player.game?.addAuditTrail(
				`${this.player.name}'s ${existing.status.name} is refreshed!`
			);
			return;
		}

		this.player.game?.addAuditTrail(`${this.player.name} now has ${statusEffect.status.name}!`);
		this._statuses.push(statusEffect);
		statusEffect.status.onApply?.(this.player, resolveCtx(ctx));
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
		statusEffect.status.onRemove?.(this.player, resolveCtx(ctx));
		this._statuses = this._statuses.filter((x) => x !== statusEffect);
	}

	/** Count timed statuses down by one turn and remove the ones that ran out */
	tickDurations(ctx: GameContext) {
		const statusesToRemove: PlayerStatusEffect[] = [];

		this._statuses.forEach((s) => {
			if (s.duration !== undefined) {
				s.duration -= 1;
				if (s.duration <= 0) {
					statusesToRemove.push(s);
				}
			}
		});

		statusesToRemove.forEach((s) => this.removeStatusEffect(s, ctx));
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
