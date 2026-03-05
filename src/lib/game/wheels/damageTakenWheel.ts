import { requirePlayer, type GameContext } from '../gameContext';
import type { WheelBase } from './wheels';

export function generateDamageTakenWheel(playerName: string, ctx: GameContext) {
	const player = requirePlayer(ctx, playerName, 'damage taken wheel');
	if (!player || player.dead) return;

	const globalHpValue = ctx.getGlobalHpReduction();

	let reductionPercentage = 0;

	if (player.classType === 'absoluteUnit') {
		reductionPercentage = Math.min(player.baseDefense, 50);
	}

	const reductionPercentageInversion = (100 - reductionPercentage) / 100;

	const wheel: WheelBase = [
		{
			label: `Take ${globalHpValue * 1} damage`,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 1 * reductionPercentageInversion);
			}
		},
		{
			label: `Take ${globalHpValue * 2} damage`,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 2 * reductionPercentageInversion);
			}
		},
		{
			label: `Take ${globalHpValue * 3} damage`,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 3 * reductionPercentageInversion);
			}
		},
		{
			label: `Take ${globalHpValue * 4} damage`,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 4 * reductionPercentageInversion);
			}
		},
		{
			label: `Take ${globalHpValue * 5} damage`,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 5 * reductionPercentageInversion);
			}
		},
		{
			label: `Take ${globalHpValue * 10} damage`,
			weight: 2,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 10 * reductionPercentageInversion);
			}
		},
		{
			label: `Take ${globalHpValue * 15} damage`,
			weight: 2,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 15 * reductionPercentageInversion);
			}
		},
		{
			label: `Take ${globalHpValue * 20} damage and go to shadow realm`,
			onWin: () => {
				player.hp -= Math.floor(globalHpValue * 20 * reductionPercentageInversion);
				player.inShadowRealm = true;
				ctx.addAuditTrail(`${player.name} was banished to the Shadow Realm!`);
			}
		}
	];

	ctx.addCustomWheel(`Damage Taken Wheel - ${player.name}`, wheel, 'damage');
}
