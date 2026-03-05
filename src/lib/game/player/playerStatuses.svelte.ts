import toast from '$lib/stores/toaster.svelte';
import type { GameContext } from '../gameContext';
import type { SerializedPlayerStatuses } from '../serialization';
import type { StatusEffect, StatusType } from '../statuses/statusTypes';
import statusEffects from '../statuses/statusTypes';
import type { Player } from './player.svelte';

export class PlayerStatuses {
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

	private _statuses: PlayerStatusEffect[] = $state([]);

	public get statuses(): PlayerStatusEffect[] {
		return this._statuses;
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
		this.player.game?.addAuditTrail(
			`${this.player.name} no longer has ${statusEffect.status.name}!`
		);
		if (ctx) {
			statusEffect.status.onRemove?.(this.player, ctx);
		}
		this._statuses = this._statuses.filter((x) => x !== statusEffect);
	}

	onTurnStart(ctx: GameContext) {
		this._statuses.forEach((s) => {
			s.status.onTurnStart?.(this.player, ctx);
		});
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

	onAttackWin(defendingPlayer: Player, ctx: GameContext) {
		this._statuses.forEach((s) => {
			s.status.onAttackWin?.(this.player, defendingPlayer, ctx);
		});
	}

	onAttackLose(defendingPlayer: Player, ctx: GameContext) {
		this._statuses.forEach((s) => {
			s.status.onAttackLose?.(this.player, defendingPlayer, ctx);
		});
	}

	onDefendWin(playerAttackingYou: Player, ctx: GameContext) {
		this._statuses.forEach((s) => {
			s.status.onDefendWin?.(this.player, playerAttackingYou, ctx);
		});
	}

	onDefendLose(defendingPlayer: Player, ctx: GameContext) {
		this._statuses.forEach((s) => {
			s.status.onDefendLose?.(this.player, defendingPlayer, ctx);
		});
	}

	onDefenseStart(defendingPlayer: Player, ctx: GameContext) {
		this._statuses.forEach((s) => {
			s.status.onDefenseStart?.(this.player, defendingPlayer, ctx);
		});
	}

	onDefenseEnd(defendingPlayer: Player, ctx: GameContext) {
		this._statuses.forEach((s) => {
			s.status.onDefenseEnd?.(this.player, defendingPlayer, ctx);
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

	// Note: stat modifiers are restored directly during deserialization via _statModifiers,
	// so onApply hooks are not re-invoked here (they would require a GameContext).
	applyDeserializedStatuses() {
		// Intentionally empty — stat modifiers already restored from serialized data
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
