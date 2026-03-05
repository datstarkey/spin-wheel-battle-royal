import type { GameContext } from '../gameContext';
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

	onAttackWin: (player: Player, defendingPlayer: Player, ctx: GameContext) => void;
	onAttackLose?: (player: Player, defendingPlayer: Player, ctx: GameContext) => void;
	onDefendWin?: (player: Player, attackingPlayer: Player, ctx: GameContext) => void;
	onDefendLose?: (player: Player, attackingPlayer: Player, ctx: GameContext) => void;
	onTurnStart?: (player: Player, ctx: GameContext) => void;
	onTurnEnd?: (
		player: Player,
		ctx: GameContext,
		context?: { hasMoved: boolean; totalMovement: number }
	) => void;
	onAttackStart?: (player: Player, defendingPlayer: Player, ctx: GameContext) => void;
	onAttackEnd?: (player: Player, defendingPlayer: Player, ctx: GameContext) => void;
	onDefenseStart?: (player: Player, attackingPlayer: Player, ctx: GameContext) => void;
	onDefenseEnd?: (player: Player, attackingPlayer: Player, ctx: GameContext) => void;
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
};

export type ClassType = keyof typeof classMap;
