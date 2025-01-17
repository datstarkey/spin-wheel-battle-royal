import { addAuditTrail, getPlayerByName } from '$lib/stores/gameStore.svelte';
import toast from 'svelte-french-toast';
import type { StatusEffect, StatusType } from '../statuses/statusTypes';
import statusEffects from '../statuses/statusTypes';
import type { Player } from './player.svelte';

export class PlayerStatuses {
	private _playerName: string;

	constructor(playerName: string) {
		this._playerName = playerName;
	}

	private get player(): Player {
		return getPlayerByName(this._playerName) as Player;
	}

	private _statuses: PlayerStatusEffect[] = $state([]);

	public get statuses(): PlayerStatusEffect[] {
		return this._statuses;
	}

	addStatus(status: StatusType) {
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

		addAuditTrail(`${this.player.name} now has ${statusEffect.status.name}!`);
		this._statuses.push(statusEffect);
		statusEffect.status.onApply?.(this.player);
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

	removeStatus(status: StatusType) {
		const statusEffect = this._statuses.find((s) => s.statusName === status);
		if (!statusEffect) return;
		addAuditTrail(`${this.player.name} no longer has ${statusEffect.status.name}!`);
		statusEffect.status.onRemove?.(this.player);
		this._statuses = this._statuses.filter((x) => x !== statusEffect);
	}

	onTurnStart() {
		this._statuses.forEach((s) => {
			s.status.onTurnStart?.(this.player);
		});
	}

	onTurnEnd() {
		this._statuses.forEach((s) => {
			s.duration! -= 1;
			if (s.duration! <= 0) {
				s.status.onRemove?.(this.player);
				this._statuses = this._statuses.filter((x) => x !== s);
			}
		});
	}

	onAttackWin(defendingPlayer: Player) {
		this._statuses.forEach((s) => {
			s.status.onAttackWin?.(this.player, defendingPlayer);
		});
	}

	onAttackLose(defendingPlayer: Player) {
		this._statuses.forEach((s) => {
			s.status.onAttackLose?.(this.player, defendingPlayer);
		});
	}

	onDefendWin(playerAttackingYou: Player) {
		this._statuses.forEach((s) => {
			s.status.onDefendWin?.(this.player, playerAttackingYou);
		});
	}

	onDefendLose(defendingPlayer: Player) {
		this._statuses.forEach((s) => {
			s.status.onDefendLose?.(this.player, defendingPlayer);
		});
	}

	onDefenseStart(defendingPlayer: Player) {
		this._statuses.forEach((s) => {
			s.status.onDefenseStart?.(this.player, defendingPlayer);
		});
	}

	onDefenseEnd(defendingPlayer: Player) {
		this._statuses.forEach((s) => {
			s.status.onDefenseEnd?.(this.player, defendingPlayer);
		});
	}

	/**
	 * --------------------------------------------------------------------------
	 * Serialization
	 */

	serialize(): Record<string, any> {
		return {
			playerName: this._playerName,
			statuses: this._statuses.map((status) => ({
				statusName: status.statusName,
				duration: status.duration
			}))
		};
	}

	static deserialize(data: Record<string, any>): PlayerStatuses {
		const statuses = new PlayerStatuses(data.playerName);

		statuses._statuses =
			data.statuses?.map((statusData: { statusName: StatusType; duration: number }) => {
				const status = new PlayerStatusEffect(statusData.statusName);
				status.duration = statusData.duration;
				return status;
			}) ?? [];

		return statuses;
	}
}

export class PlayerStatusEffect {
	private _statusName: StatusType;

	duration: number | undefined;

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
