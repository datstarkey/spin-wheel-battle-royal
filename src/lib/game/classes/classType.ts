import { Swe } from './swe';
import { Stoner } from './stoner';
import { Poopmaster } from './poopmaster';
import { Gorf } from './gorf';
import { Magicman } from './magicman';
import { None } from './none';
import type { Player } from '../player/player';

export interface ClassBase {
	hp: number;
	attack: number;
	defense: number;
	name: string;

	onWinAbility: string;
	attackRange: number;

	onWin: (player: Player, attackingPlayer: Player) => void;
	onLose?: (player: Player, attackingPlayer: Player) => void;
	onTurnStart?: (player: Player) => void;
	onTurnEnd?: (player: Player) => void;
	onAttackStart?: (player: Player, attackingPlayer: Player) => void;
	onAttackEnd?: (player: Player, attackingPlayer: Player) => void;
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
