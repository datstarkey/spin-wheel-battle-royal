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

	// [multiplier of the global HP reduction, wheel weight]; the last slice also banishes
	const slices: [number, number][] = [
		[1, 1],
		[2, 1],
		[3, 1],
		[4, 1],
		[5, 1],
		[10, 2],
		[15, 2],
		[20, 1]
	];
	const wheel: WheelBase = slices.map(([multiplier, weight], i) => {
		// Labels show the damage actually dealt, after Absolute Unit's reduction
		const damage = Math.floor(globalHpValue * multiplier * reductionPercentageInversion);
		const banishes = i === slices.length - 1;
		return {
			label: `Take ${damage} damage${banishes ? ' and go to shadow realm' : ''}`,
			weight,
			onWin: () => {
				player.takeDamage(damage);
				if (banishes && !player.dead) {
					ctx.banishToShadowRealm(player, `${player.name} was banished to the Shadow Realm!`);
				}
			}
		};
	});

	ctx.addCustomWheel(`Damage Taken Wheel - ${player.name}`, wheel, 'damage');
}
