import type { Player } from '../player/player.svelte';
import { Gorf } from './gorf';
import { Magicman } from './magicman';
import { None } from './none';
import { Poopmaster } from './poopmaster';
import { Stoner } from './stoner';
import { Swe } from './swe';

export interface ClassBase {
	hp: number;
	attack: number;
	defense: number;
	name: string;

	onWinAbility: string;
	attackRange: number;

	onAttackWin: (player: Player, defendingPlayer: Player) => void;
	onAttackLose?: (player: Player, defendingPlayer: Player) => void;
	onDefendWin?: (player: Player, attackingPlayer: Player) => void;
	onDefendLose?: (player: Player, attackingPlayer: Player) => void;
	onTurnStart?: (player: Player) => void;
	onTurnEnd?: (player: Player) => void;
	onAttackStart?: (player: Player, defendingPlayer: Player) => void;
	onAttackEnd?: (player: Player, defendingPlayer: Player) => void;
	onDefenseStart?: (player: Player, attackingPlayer: Player) => void;
	onDefenseEnd?: (player: Player, attackingPlayer: Player) => void;
}

export const classMap = {
	none: None, //placeholder
	swe: Swe,
	stoner: Stoner,
	poopmaster: Poopmaster,
	gorf: Gorf,
	magicman: Magicman
};
export type ClassType = keyof typeof classMap;
