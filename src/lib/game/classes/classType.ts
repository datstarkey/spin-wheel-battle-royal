import type { Player } from '../player/player.svelte';
import { AbsoluteUnit } from './absoluteUnit';
import { Gambler } from './gambler';
import { GigaChad } from './gigaChad';
import { Gorf } from './gorf';
import { Intern } from './intern';
import { Magicman } from './magicman';
import { None } from './none';
import { Poopmaster } from './poopmaster';
import { Swe } from './swe';
// import { Stoner } from './stoner';
import { Shadeweaver } from './shadeweaver';

export interface ClassBase {
	hp: number;
	attack: number;
	defense: number;
	name: string;

	description?: string;
	icon?: string;

	startingGold?: number;

	onWinAbility: string;
	attackRange: number;

	// Passive stat bonuses - called when calculating stats
	getBonusAttack?: (player: Player) => number;
	getBonusDefense?: (player: Player) => number;

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
	poopmaster: Poopmaster,
	gambler: Gambler,
	gigachad: GigaChad,
	absoluteUnit: AbsoluteUnit,
	shadeweaver: Shadeweaver,
	magicman: Magicman,
	intern: Intern,
	gorf: Gorf
	// stoner: Stoner
};

export type ClassType = keyof typeof classMap;
