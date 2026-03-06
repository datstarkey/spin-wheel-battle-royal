/** Hook names shared by Player, PlayerGear, and PlayerStatuses */
export type GameHookName =
	| 'onAttackWin'
	| 'onAttackLose'
	| 'onDefendWin'
	| 'onDefendLose'
	| 'onAttackStart'
	| 'onAttackEnd'
	| 'onDefenseStart'
	| 'onDefenseEnd'
	| 'onTurnStart'
	| 'onTurnEnd';
