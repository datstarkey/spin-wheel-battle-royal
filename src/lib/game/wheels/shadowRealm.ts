import { getRandomSpawnPoint } from '../board/board.svelte';
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

	const gifts: [stat: 'gold' | 'baseAttack' | 'baseDefense', amount: number, label: string][] = [
		['gold', 5, 'gold'],
		['baseAttack', 3, 'Base Attack'],
		['baseDefense', 3, 'Base Defense']
	];

	const wheel: WheelBase = [
		{
			label: 'Return to spawn',
			onWin: () => {
				player.game?.removePlayerFromShadowRealm(player);
				player.position = { ...getRandomSpawnPoint() };
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
		...gifts.map(([stat, amount, label]) => ({
			label: `Give ${amount} ${label} to someone`,
			onWin: () => {
				generateRandomPlayerWheel(
					`${player.name} Gives ${amount} ${label} to someone`,
					(winner) => {
						// Only hand over what was actually lost (stats are clamped at their floor)
						const before = player[stat];
						player[stat] -= amount;
						const given = before - player[stat];
						winner[stat] += given;
						ctx.addAuditTrail(
							`${player.name} gave ${given} ${label.toLowerCase()} to ${winner.name}`
						);
					},
					ctx
				);
			}
		})),
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

						player.inShadowRealm = targetInShadowRealm;
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
