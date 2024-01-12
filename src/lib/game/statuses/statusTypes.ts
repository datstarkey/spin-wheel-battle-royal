import type { Player } from '../player/player';
import { sweSupreme } from './swesupreme';
import { vodkaRedbull } from './vodkaRedbull';

export interface StatusEffect {
	name: string;
	description: string;
	image: string;
	turnDuration?: number;
	allowMultiple?: boolean;
	onApply?: (player: Player) => void;
	onRemove?: (player: Player) => void;
	onTurnStart?: (player: Player) => void;
	onTurnEnd?: (player: Player) => void;
	onWin?: (player: Player, attackingPlayer: Player) => void;
	onLose?: (player: Player, attackingPlayer: Player) => void;
	onAttackStart?: (player: Player, attackingPlayer: Player) => void;
	onAttackEnd?: (player: Player, attackingPlayer: Player) => void;
	onBeingAttackedStart?: (player: Player, playerAttackingYou: Player) => void;
	onBeingAttackedEnd?: (player: Player, playerAttackingYou: Player) => void;
}

const statusEffects = {
	'Vodka Redbull': vodkaRedbull,
	swesupreme: sweSupreme
};

export default statusEffects;
export type StatusType = keyof typeof statusEffects;
