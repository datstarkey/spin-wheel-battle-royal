import type { ClassType } from '../classes/classType';
import type { Player } from '../player/player.svelte';
import { jaegerShots } from './jagerShots';
import { movementPot } from './movmentPot';
import { sweSupreme } from './swesupreme';
import { vodkaRedbull } from './vodkaRedbull';

export interface StatusEffect {
	name: string;
	description: string;
	image: string;
	turnDuration?: number;
	allowMultiple?: boolean;
	classLock?: ClassType[];
	onApply?: (player: Player) => void;
	onRemove?: (player: Player) => void;
	onTurnStart?: (player: Player) => void;
	onTurnEnd?: (player: Player) => void;
	onAttackWin?: (player: Player, defendingPlayer: Player) => void;
	onAttackLose?: (player: Player, defendingPlayer: Player) => void;
	onDefendWin?: (player: Player, playerAttackingYou: Player) => void;
	onDefendLose?: (player: Player, playerAttackingYou: Player) => void;
	onAttackStart?: (player: Player, defendingPlayer: Player) => void;
	onAttackEnd?: (player: Player, defendingPlayer: Player) => void;
	onDefenseStart?: (player: Player, playerAttackingYou: Player) => void;
	onDefenseEnd?: (player: Player, playerAttackingYou: Player) => void;
}

const statusEffects = {
	VodkaRedbull: vodkaRedbull,
	Swesupreme: sweSupreme,
	MovementPotBuff: movementPot,
	JagerShots: jaegerShots
};

export default statusEffects;
export type StatusType = keyof typeof statusEffects;
