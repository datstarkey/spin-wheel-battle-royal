import { addShade } from '../classes/shadeweaver';
import { requirePlayer, type GameContext } from '../gameContext';
import { generateRandomPlayerWheel } from './randomPlayerWheel';
import type { WheelBase } from './wheels';

// Grant Shade to all Shadeweavers when someone spins the shadow realm wheel
function grantShadeToShadeweavers(ctx: GameContext) {
	for (const player of ctx.getAllPlayers()) {
		if (player.classType === 'shadeweaver' && !player.dead) {
			addShade(player);
		}
	}
}

export function generateShadowRealmWheel(playerName: string, ctx: GameContext) {
	const player = requirePlayer(ctx, playerName, 'shadow realm wheel');
	if (!player || player.dead) return;
	if (player.classType === 'shadeweaver') return;

	// Grant Shade to all Shadeweavers when someone spins the wheel
	grantShadeToShadeweavers(ctx);

	const wheel: WheelBase = [
		{
			label: 'Return to spawn',
			onWin: () => {
				player.inShadowRealm = false;
				ctx.addAuditTrail(`${player.name} returns to spawn`);
			}
		},
		{
			label: 'Lose 5 gold',
			onWin: () => {
				player.gold -= 5;
				ctx.addAuditTrail(`${player.name} lost 5 gold in the Shadow Realm`);
			}
		},
		{
			label: 'Give 5 gold to someone',
			onWin: () => {
				generateRandomPlayerWheel(
					`${player.name} Gives 5 gold to someone`,
					(winner) => {
						player.gold -= 5;
						winner.gold += 5;
						ctx.addAuditTrail(`${player.name} gave 5 gold to ${winner.name}`);
					},
					ctx
				);
			}
		},
		{
			label: 'Give 3 Base Attack to someone',
			onWin: () => {
				generateRandomPlayerWheel(
					`${player.name} Gives 3 Base Attack to someone`,
					(winner) => {
						player.baseAttack -= 3;
						winner.baseAttack += 3;
						ctx.addAuditTrail(`${player.name} gave 3 base attack to ${winner.name}`);
					},
					ctx
				);
			}
		},
		{
			label: 'Give 3 Base Defense to someone',
			onWin: () => {
				generateRandomPlayerWheel(
					`${player.name} Gives 3 Base Defense to someone`,
					(winner) => {
						player.baseDefense -= 3;
						winner.baseDefense += 3;
						ctx.addAuditTrail(`${player.name} gave 3 base defense to ${winner.name}`);
					},
					ctx
				);
			}
		},
		{
			label: 'Swap Places with someone',
			onWin: () => {
				generateRandomPlayerWheel(
					`${player.name} Swaps Places with someone`,
					(winner) => {
						// Store original states
						const playerPosition = player.position;
						const playerWasInShadowRealm = player.inShadowRealm;
						const winnerPosition = winner.position;
						const winnerWasInShadowRealm = winner.inShadowRealm;

						// Swap board positions
						player.position = winnerPosition;
						winner.position = playerPosition;

						// Swap shadow realm status (always swap)
						player.inShadowRealm = winnerWasInShadowRealm;
						winner.inShadowRealm = playerWasInShadowRealm;

						ctx.addAuditTrail(`${player.name} swaps places with ${winner.name}`);
					},
					ctx
				);
			}
		},
		{
			label: 'Teleport to someone',
			onWin: () => {
				generateRandomPlayerWheel(
					`${player.name} Teleports to someone`,
					(winner) => {
						// Store target's position before changing shadow realm status
						const targetPosition = winner.position;
						const targetInShadowRealm = winner.inShadowRealm;

						// First change shadow realm status (this triggers auto-teleport to spawn)
						player.inShadowRealm = targetInShadowRealm;

						// Then override position to target's actual location
						player.position = targetPosition;

						ctx.addAuditTrail(`${player.name} teleports to ${winner.name}`);
					},
					ctx
				);
			}
		},
		{
			label: 'Increase all shop costs by 1g for everyone',
			onWin: () => {
				ctx.increaseShopCostModifier(1);
				ctx.addAuditTrail(`${player.name} increases all shop costs by 1g for everyone`);
			}
		},
		{
			label: 'Emotional damage',
			onWin: () => {
				generateRandomPlayerWheel(
					`${player.name} hurls out some insults`,
					(winner) => {
						winner.statuses.addStatus('EmotionalDamage');
						ctx.addAuditTrail(`${player.name} inflicted Emotional Damage on ${winner.name}!`);
					},
					ctx
				);
			}
		},
		{
			label: 'Nothing',
			onWin: () => {
				ctx.addAuditTrail(`${player.name} found nothing in the Shadow Realm`);
			}
		}
	];
	ctx.addCustomWheel(`Shadow Realm Wheel for ${player.name}`, wheel, 'shadow');
}
