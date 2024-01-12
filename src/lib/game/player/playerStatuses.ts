import { getPlayerByName } from '$lib/stores/gameStore';
import toast from 'svelte-french-toast';
import type { StatusEffect, StatusType } from '../statuses/statusTypes';
import statusEffects from '../statuses/statusTypes';
import type { Player } from './player';

export class PlayerStatuses {
	private _playerName: string;

	constructor(playerName: string) {
		this._playerName = playerName;
	}

	private get player(): Player {
		return getPlayerByName(this._playerName) as Player;
	}

	private _statuses: PlayerStatusEffect[] = [];

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

		this._statuses.push(statusEffect);
		statusEffect.status.onApply?.(this.player);
	}

	hasStatus(status: StatusType) {
		return this._statuses.some((s) => s.status.name === status);
	}

	removeStatus(status: StatusType) {
		const statusEffect = this._statuses.find((s) => s.status.name === status);
		if (!statusEffect) return;
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

	onWin(attackingPlayer: Player) {
		this._statuses.forEach((s) => {
			s.status.onWin?.(this.player, attackingPlayer);
		});
	}

	onLose(attackingPlayer: Player) {
		this._statuses.forEach((s) => {
			s.status.onLose?.(this.player, attackingPlayer);
		});
	}
}

export class PlayerStatusEffect {
	private _statusName: StatusType;

	duration?: number;

	constructor(status: StatusType) {
		this._statusName = status;
	}

	get status(): StatusEffect {
		return statusEffects[this._statusName];
	}
}
