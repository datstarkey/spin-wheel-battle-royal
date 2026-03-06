import { requirePlayer, type GameContext } from '../gameContext';
import type { Player } from '../player/player.svelte';
import { addResource, getResource, setResource } from '../player/playerResources';
import { generateLootWheel } from './lootWheel';
import { generateRandomPlayerWheel, withTargetPlayerOrRandomWheel } from './randomPlayerWheel';
import { generateWinWheel } from './winWheel';

export const MANA_RESOURCE = 'Mana';
export const MAX_MANA = 100;
export const MANA_REGEN_PER_TURN = 10;
export const RUNE_OF_POWER_TURNS_KEY = 'RuneOfPowerTurns';

// ============================================================================
// Mana Helpers
// ============================================================================

export function getMana(player: Player): number {
	return getResource(player, MANA_RESOURCE);
}

export function setMana(player: Player, amount: number) {
	setResource(player, MANA_RESOURCE, amount, 0, MAX_MANA);
}

export function addMana(player: Player, amount: number) {
	addResource(player, MANA_RESOURCE, amount, 0, MAX_MANA);
}

export function spendMana(player: Player, amount: number, ctx: GameContext): boolean {
	const current = getMana(player);
	if (current < amount) {
		ctx.addAuditTrail(`${player.name} does not have enough mana! Need ${amount}, have ${current}`);
		return false;
	}
	setMana(player, current - amount);
	return true;
}

export function canCastSpell(player: Player, manaCost: number): boolean {
	return getMana(player) >= manaCost;
}

// ============================================================================
// Rune of Power Tracking
// ============================================================================

export function getRuneOfPowerTurns(player: Player): number {
	return getResource(player, RUNE_OF_POWER_TURNS_KEY);
}

export function incrementRuneOfPowerTurns(player: Player) {
	addResource(player, RUNE_OF_POWER_TURNS_KEY, 1);
}

export function resetRuneOfPowerTurns(player: Player) {
	setResource(player, RUNE_OF_POWER_TURNS_KEY, 0);
}

// ============================================================================
// Minor Spell Wheel (25 mana)
// ============================================================================

export function generateMinorSpellWheel(
	playerName: string,
	ctx: GameContext,
	targetPlayer?: Player
) {
	const player = requirePlayer(ctx, playerName, 'minor spell wheel');
	if (!player || player.dead) return;

	if (!spendMana(player, 25, ctx)) return;

	const wheel = [
		{
			label: 'Arcane Bolt - 15 damage',
			onWin: () => {
				withTargetPlayerOrRandomWheel(
					targetPlayer,
					`${player.name}'s Arcane Bolt Target`,
					(target) => {
						target.takeDamage(15);
						ctx.addAuditTrail(`${player.name}'s Arcane Bolt hits ${target.name} for 15 damage!`);
					},
					ctx
				);
			}
		},
		{
			label: 'Frost Shield - +10 def (2 turns)',
			onWin: () => {
				player.statuses.addStatus('FrostShield');
				ctx.addAuditTrail(`${player.name} gains Frost Shield! +10 defense for 2 turns`);
			}
		},
		{
			label: 'Mana Spark - Gain 15 mana',
			onWin: () => {
				addMana(player, 15);
				ctx.addAuditTrail(`${player.name} regains 15 mana!`);
			}
		},
		{
			label: 'Magic Missile - 8 dmg, +3 gold',
			onWin: () => {
				withTargetPlayerOrRandomWheel(
					targetPlayer,
					`${player.name}'s Magic Missile Target`,
					(target) => {
						target.takeDamage(8);
						player.gold += 3;
						ctx.addAuditTrail(`${player.name}'s Magic Missiles hit ${target.name}!`);
					},
					ctx
				);
			}
		},
		{
			label: 'Blink - Teleport 3 tiles',
			onWin: () => {
				player.bonusMovement += 3;
				ctx.addAuditTrail(`${player.name} can blink up to 3 extra tiles this turn!`);
			}
		},
		{
			label: 'Heal - Restore 12 HP',
			onWin: () => {
				player.hp += 12;
				ctx.addAuditTrail(`${player.name} heals for 12 HP!`);
			}
		},
		{
			label: 'Arcane Sight - +1 range (perm)',
			onWin: () => {
				player.baseAttackRange += 1;
				ctx.addAuditTrail(`${player.name} gains permanent +1 attack range!`);
			}
		},
		{
			label: 'Spin Loot Wheel',
			onWin: () => {
				generateLootWheel(player.name, ctx);
			}
		}
	];

	ctx.addCustomWheel(`Minor Spell - ${player.name}`, wheel, 'magic');
}

// ============================================================================
// Major Spell Wheel (50 mana)
// ============================================================================

export function generateMajorSpellWheel(
	playerName: string,
	ctx: GameContext,
	targetPlayer?: Player
) {
	const player = requirePlayer(ctx, playerName, 'major spell wheel');
	if (!player || player.dead) return;

	if (!spendMana(player, 50, ctx)) return;

	const wheel = [
		{
			label: 'Fireball - 30 damage',
			onWin: () => {
				withTargetPlayerOrRandomWheel(
					targetPlayer,
					`${player.name}'s Fireball Target`,
					(target) => {
						target.takeDamage(30);
						ctx.addAuditTrail(
							`${player.name}'s Fireball incinerates ${target.name} for 30 damage!`
						);
					},
					ctx
				);
			}
		},
		{
			label: 'Ice Storm - 15 dmg, slow',
			onWin: () => {
				withTargetPlayerOrRandomWheel(
					targetPlayer,
					`${player.name}'s Ice Storm Target`,
					(target) => {
						target.takeDamage(15);
						target.statuses.addStatus('IceStorm');
						ctx.addAuditTrail(
							`${player.name}'s Ice Storm hits ${target.name}! 15 damage and slowed!`
						);
					},
					ctx
				);
			}
		},
		{
			label: 'Chain Lightning - 20 + 10 dmg',
			onWin: () => {
				generateRandomPlayerWheel(
					`${player.name}'s Chain Lightning Primary`,
					(primary) => {
						primary.takeDamage(20);
						ctx.addAuditTrail(
							`${player.name}'s Chain Lightning strikes ${primary.name} for 20 damage!`
						);
						generateRandomPlayerWheel(
							`Chain Lightning Secondary`,
							(secondary) => {
								secondary.takeDamage(10);
								ctx.addAuditTrail(`Chain Lightning arcs to ${secondary.name} for 10 damage!`);
							},
							ctx
						);
					},
					ctx
				);
			}
		},
		{
			label: 'Greater Heal - 35 HP',
			onWin: () => {
				player.hp += 35;
				ctx.addAuditTrail(`${player.name} heals for 35 HP!`);
			}
		},
		{
			label: 'Transmute - 20 mana -> 20 gold',
			onWin: () => {
				player.gold += 20;
				ctx.addAuditTrail(`${player.name} transmutes magical energy into 20 gold!`);
			}
		},
		{
			label: 'Arcane Shield - +15 def (3 turns)',
			onWin: () => {
				player.addStatModifier('Arcane Shield', 'defense', 15);
				ctx.addAuditTrail(`${player.name} conjures an Arcane Shield! +15 defense`);
			}
		},
		{
			label: 'Mana Burn - Drain or 25 dmg',
			onWin: () => {
				withTargetPlayerOrRandomWheel(
					targetPlayer,
					`${player.name}'s Mana Burn Target`,
					(target) => {
						const targetMana = getMana(target);
						if (targetMana > 0) {
							const drained = Math.min(30, targetMana);
							setMana(target, targetMana - drained);
							addMana(player, drained);
							ctx.addAuditTrail(`${player.name} drains ${drained} mana from ${target.name}!`);
							return;
						}

						target.takeDamage(25);
						ctx.addAuditTrail(`${player.name}'s Mana Burn scorches ${target.name} for 25 damage!`);
					},
					ctx
				);
			}
		},
		{
			label: 'Polymorph - Skip turn',
			onWin: () => {
				withTargetPlayerOrRandomWheel(
					targetPlayer,
					`${player.name}'s Polymorph Target`,
					(target) => {
						ctx.skipNextTurn(target);
						ctx.addAuditTrail(
							`${player.name} polymorphs ${target.name}! They skip their next turn!`
						);
					},
					ctx
				);
			}
		}
	];

	ctx.addCustomWheel(`Major Spell - ${player.name}`, wheel, 'magic');
}

// ============================================================================
// Ultimate Spell Wheel (100 mana)
// ============================================================================

export function generateUltimateSpellWheel(
	playerName: string,
	ctx: GameContext,
	targetPlayer?: Player
) {
	const player = requirePlayer(ctx, playerName, 'ultimate spell wheel');
	if (!player || player.dead) return;

	if (!spendMana(player, 100, ctx)) return;

	const wheel = [
		{
			label: 'Meteor Strike - 60 damage',
			onWin: () => {
				withTargetPlayerOrRandomWheel(
					targetPlayer,
					`${player.name}'s Meteor Strike Target`,
					(target) => {
						target.takeDamage(60);
						ctx.addAuditTrail(`METEOR STRIKE obliterates ${target.name} for 60 damage!`);
					},
					ctx
				);
			}
		},
		{
			label: 'Time Stop - Extra turn',
			onWin: () => {
				ctx.gainAnotherTurn();
				ctx.addAuditTrail(`${player.name} STOPS TIME! Taking another turn!`);
			}
		},
		{
			label: 'Rune of Power - Ascension',
			onWin: () => {
				player.statuses.addStatus('RuneOfPower');
				ctx.addAuditTrail(`${player.name} places a RUNE OF POWER! Stay here 5 turns to ascend!`);
			}
		},
		{
			label: 'Arcane Supremacy - +25 atk, +15 def',
			onWin: () => {
				player.baseAttack += 25;
				player.baseDefense += 15;
				ctx.addAuditTrail(
					`${player.name} achieves ARCANE SUPREMACY! +25 attack, +15 defense permanently!`
				);
			}
		},
		{
			label: 'Soul Drain - Steal 40 HP',
			onWin: () => {
				withTargetPlayerOrRandomWheel(
					targetPlayer,
					`${player.name}'s Soul Drain Target`,
					(target) => {
						target.takeDamage(40);
						player.hp += 40;
						ctx.addAuditTrail(`${player.name} DRAINS ${target.name}'s SOUL! Stealing 40 HP!`);
					},
					ctx
				);
			}
		},
		{
			label: 'Dimensional Rift - Shadow Realm',
			onWin: () => {
				if (player.inShadowRealm) {
					player.inShadowRealm = false;
					ctx.addAuditTrail(`${player.name} tears open a rift and ESCAPES the Shadow Realm!`);
				} else {
					withTargetPlayerOrRandomWheel(
						targetPlayer,
						`${player.name}'s Dimensional Rift Target`,
						(target) => {
							target.inShadowRealm = true;
							ctx.addAuditTrail(`${player.name} banishes ${target.name} to the SHADOW REALM!`);
						},
						ctx
					);
				}
			}
		},
		{
			label: 'Grand Illusion - 3x Win Wheel',
			onWin: () => {
				ctx.addAuditTrail(
					`${player.name} conjures GRAND ILLUSIONS! Spinning the Win Wheel 3 times!`
				);
				generateWinWheel(player.name, ctx);
				generateWinWheel(player.name, ctx);
				generateWinWheel(player.name, ctx);
			}
		},
		{
			label: 'Spin 2 Loot Wheels',
			onWin: () => {
				ctx.addAuditTrail(`${player.name} manifests arcane treasures!`);
				generateLootWheel(player.name, ctx, 1);
				generateLootWheel(player.name, ctx, 2);
			}
		}
	];

	ctx.addCustomWheel(`ULTIMATE Spell - ${player.name}`, wheel, 'magic');
}
