import { generateRandomPlayerWheel } from '../wheels/randomPlayerWheel';
import { generateShadowRealmWheel } from '../wheels/shadowRealm';
import type { ClassBase } from './classType';

export const Shadeweaver: ClassBase = {
	hp: 100,
	attack: 20,
	defense: 15,
	name: 'Shadeweaver',
	onWinAbility: 'Make someone spin the shadow realm wheel',
	attackRange: 1,
	onAttackWin: (player) => {
		generateRandomPlayerWheel(`${player.name} Makes someone roll the Shadow Realm Wheel`, (winner) => 
			{generateShadowRealmWheel(winner.name)

			}
		)
	}
}
			
