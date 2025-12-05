import { addCustomWheel, currentGame, getPlayerByName } from '$lib/stores/gameStore.svelte';
import toast from '$lib/stores/toaster.svelte';
import type { Player } from '../player/player.svelte';
import { generateLootWheel } from './lootWheel';
import { generateRandomPlayerWheel } from './randomPlayerWheel';
import { generateWinWheel } from './winWheel';

export const MANA_RESOURCE = 'Mana';
export const MAX_MANA = 100;
export const MANA_REGEN_PER_TURN = 10;
export const RUNE_OF_POWER_TURNS_KEY = 'RuneOfPowerTurns';

// ============================================================================
// Mana Helpers
// ============================================================================

export function getMana(player: Player): number {
	return player.resources[MANA_RESOURCE] ?? 0;
}

export function setMana(player: Player, amount: number) {
	player.resources[MANA_RESOURCE] = Math.max(0, Math.min(MAX_MANA, amount));
}

export function addMana(player: Player, amount: number) {
	const current = getMana(player);
	setMana(player, current + amount);
}

export function spendMana(player: Player, amount: number): boolean {
	const current = getMana(player);
	if (current < amount) {
		toast.error(`Not enough mana! Need ${amount}, have ${current}`);
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
	return player.resources[RUNE_OF_POWER_TURNS_KEY] ?? 0;
}

export function incrementRuneOfPowerTurns(player: Player) {
	player.resources[RUNE_OF_POWER_TURNS_KEY] = getRuneOfPowerTurns(player) + 1;
}

export function resetRuneOfPowerTurns(player: Player) {
	player.resources[RUNE_OF_POWER_TURNS_KEY] = 0;
}

// ============================================================================
// Minor Spell Wheel (25 mana)
// ============================================================================

export function generateMinorSpellWheel(playerName: string, targetPlayer?: Player) {
	const player = getPlayerByName(playerName);
	if (!player) {
		toast.error(`Could not generate spell wheel, Player ${playerName} not found!`);
		return;
	}

	if (player.dead) return;

	if (!spendMana(player, 25)) return;

	const wheel = [
		{
			label: 'Arcane Bolt - 15 damage',
			onWin: () => {
				if (targetPlayer && !targetPlayer.dead) {
					targetPlayer.hp -= 15;
					toast.success(`${player.name} zaps ${targetPlayer.name} for 15 damage!`);
				} else {
					toast.success(`${player.name} must select a target!`);
					generateRandomPlayerWheel(`${player.name}'s Arcane Bolt Target`, (target) => {
						target.hp -= 15;
						toast.success(`Arcane Bolt hits ${target.name} for 15 damage!`);
					});
				}
			}
		},
		{
			label: 'Frost Shield - +10 def (2 turns)',
			onWin: () => {
				player.addStatModifier('Frost Shield', 'defense', 10);
				toast.success(`${player.name} gains Frost Shield! +10 defense for 2 turns`);
				// Note: Would need status system to track duration
			}
		},
		{
			label: 'Mana Spark - Gain 15 mana',
			onWin: () => {
				addMana(player, 15);
				toast.success(`${player.name} regains 15 mana!`);
			}
		},
		{
			label: 'Magic Missile - 8 dmg, +3 gold',
			onWin: () => {
				if (targetPlayer && !targetPlayer.dead) {
					targetPlayer.hp -= 8;
					player.gold += 3;
					toast.success(`${player.name} fires magic missiles at ${targetPlayer.name}!`);
				} else {
					generateRandomPlayerWheel(`${player.name}'s Magic Missile Target`, (target) => {
						target.hp -= 8;
						player.gold += 3;
						toast.success(`Magic Missiles hit ${target.name}!`);
					});
				}
			}
		},
		{
			label: 'Blink - Teleport 3 tiles',
			onWin: () => {
				player.bonusMovement += 3;
				toast.success(`${player.name} can blink up to 3 extra tiles this turn!`);
			}
		},
		{
			label: 'Heal - Restore 12 HP',
			onWin: () => {
				player.hp += 12;
				toast.success(`${player.name} heals for 12 HP!`);
			}
		},
		{
			label: 'Arcane Sight - +1 range (perm)',
			onWin: () => {
				player.baseAttackRange += 1;
				toast.success(`${player.name} gains permanent +1 attack range!`);
			}
		},
		{
			label: 'Spin Loot Wheel',
			onWin: () => {
				generateLootWheel(player.name);
			}
		}
	];

	addCustomWheel(`Minor Spell - ${player.name}`, wheel, 'magic');
}

// ============================================================================
// Major Spell Wheel (50 mana)
// ============================================================================

export function generateMajorSpellWheel(playerName: string, targetPlayer?: Player) {
	const player = getPlayerByName(playerName);
	if (!player) {
		toast.error(`Could not generate spell wheel, Player ${playerName} not found!`);
		return;
	}

	if (player.dead) return;

	if (!spendMana(player, 50)) return;

	const wheel = [
		{
			label: 'Fireball - 30 damage',
			onWin: () => {
				if (targetPlayer && !targetPlayer.dead) {
					targetPlayer.hp -= 30;
					toast.success(`${player.name} hurls a fireball at ${targetPlayer.name} for 30 damage!`);
				} else {
					generateRandomPlayerWheel(`${player.name}'s Fireball Target`, (target) => {
						target.hp -= 30;
						toast.success(`Fireball incinerates ${target.name} for 30 damage!`);
					});
				}
			}
		},
		{
			label: 'Ice Storm - 15 dmg, slow',
			onWin: () => {
				if (targetPlayer && !targetPlayer.dead) {
					targetPlayer.hp -= 15;
					targetPlayer.addStatModifier('Ice Storm', 'movement', -1);
					toast.success(`${player.name} freezes ${targetPlayer.name}! 15 damage and slowed!`);
				} else {
					generateRandomPlayerWheel(`${player.name}'s Ice Storm Target`, (target) => {
						target.hp -= 15;
						target.addStatModifier('Ice Storm', 'movement', -1);
						toast.success(`Ice Storm hits ${target.name}! 15 damage and slowed!`);
					});
				}
			}
		},
		{
			label: 'Chain Lightning - 20 + 10 dmg',
			onWin: () => {
				generateRandomPlayerWheel(`${player.name}'s Chain Lightning Primary`, (primary) => {
					primary.hp -= 20;
					toast.success(`Chain Lightning strikes ${primary.name} for 20 damage!`);
					// Chain to another random player
					generateRandomPlayerWheel(`Chain Lightning Secondary`, (secondary) => {
						secondary.hp -= 10;
						toast.success(`Chain Lightning arcs to ${secondary.name} for 10 damage!`);
					});
				});
			}
		},
		{
			label: 'Greater Heal - 35 HP',
			onWin: () => {
				player.hp += 35;
				toast.success(`${player.name} heals for 35 HP!`);
			}
		},
		{
			label: 'Transmute - 20 mana → 20 gold',
			onWin: () => {
				player.gold += 20;
				toast.success(`${player.name} transmutes magical energy into 20 gold!`);
			}
		},
		{
			label: 'Arcane Shield - +15 def (3 turns)',
			onWin: () => {
				player.addStatModifier('Arcane Shield', 'defense', 15);
				toast.success(`${player.name} conjures an Arcane Shield! +15 defense`);
			}
		},
		{
			label: 'Mana Burn - Drain or 25 dmg',
			onWin: () => {
				if (targetPlayer && !targetPlayer.dead) {
					const targetMana = getMana(targetPlayer);
					if (targetMana > 0) {
						const drained = Math.min(30, targetMana);
						setMana(targetPlayer, targetMana - drained);
						addMana(player, drained);
						toast.success(`${player.name} drains ${drained} mana from ${targetPlayer.name}!`);
					} else {
						targetPlayer.hp -= 25;
						toast.success(`${player.name} burns ${targetPlayer.name} for 25 damage!`);
					}
				} else {
					generateRandomPlayerWheel(`${player.name}'s Mana Burn Target`, (target) => {
						const targetMana = getMana(target);
						if (targetMana > 0) {
							const drained = Math.min(30, targetMana);
							setMana(target, targetMana - drained);
							addMana(player, drained);
							toast.success(`${player.name} drains ${drained} mana from ${target.name}!`);
						} else {
							target.hp -= 25;
							toast.success(`Mana Burn scorches ${target.name} for 25 damage!`);
						}
					});
				}
			}
		},
		{
			label: 'Polymorph - Skip turn',
			onWin: () => {
				if (targetPlayer && !targetPlayer.dead) {
					currentGame.value?.skipNextTurn(targetPlayer);
					toast.success(`${player.name} polymorphs ${targetPlayer.name}! They skip their next turn!`);
				} else {
					generateRandomPlayerWheel(`${player.name}'s Polymorph Target`, (target) => {
						currentGame.value?.skipNextTurn(target);
						toast.success(`${target.name} is polymorphed! They skip their next turn!`);
					});
				}
			}
		}
	];

	addCustomWheel(`Major Spell - ${player.name}`, wheel, 'magic');
}

// ============================================================================
// Ultimate Spell Wheel (100 mana)
// ============================================================================

export function generateUltimateSpellWheel(playerName: string, targetPlayer?: Player) {
	const player = getPlayerByName(playerName);
	if (!player) {
		toast.error(`Could not generate spell wheel, Player ${playerName} not found!`);
		return;
	}

	if (player.dead) return;

	if (!spendMana(player, 100)) return;

	const wheel = [
		{
			label: 'Meteor Strike - 60 damage',
			onWin: () => {
				if (targetPlayer && !targetPlayer.dead) {
					targetPlayer.hp -= 60;
					toast.success(`${player.name} calls down a METEOR on ${targetPlayer.name} for 60 damage!`);
				} else {
					generateRandomPlayerWheel(`${player.name}'s Meteor Strike Target`, (target) => {
						target.hp -= 60;
						toast.success(`METEOR STRIKE obliterates ${target.name} for 60 damage!`);
					});
				}
			}
		},
		{
			label: 'Time Stop - Extra turn',
			onWin: () => {
				currentGame.value?.gainAnotherTurn();
				toast.success(`${player.name} STOPS TIME! Taking another turn!`);
			}
		},
		{
			label: 'Rune of Power - Ascension',
			onWin: () => {
				player.statuses.addStatus('RuneOfPower');
				toast.success(`${player.name} places a RUNE OF POWER! Stay here 5 turns to ascend!`);
			}
		},
		{
			label: 'Arcane Supremacy - +25 atk, +15 def',
			onWin: () => {
				player.baseAttack += 25;
				player.baseDefense += 15;
				toast.success(`${player.name} achieves ARCANE SUPREMACY! +25 attack, +15 defense permanently!`);
			}
		},
		{
			label: 'Soul Drain - Steal 40 HP',
			onWin: () => {
				if (targetPlayer && !targetPlayer.dead) {
					targetPlayer.hp -= 40;
					player.hp += 40;
					toast.success(`${player.name} DRAINS ${targetPlayer.name}'s SOUL! Stealing 40 HP!`);
				} else {
					generateRandomPlayerWheel(`${player.name}'s Soul Drain Target`, (target) => {
						target.hp -= 40;
						player.hp += 40;
						toast.success(`${player.name} DRAINS ${target.name}'s SOUL! Stealing 40 HP!`);
					});
				}
			}
		},
		{
			label: 'Dimensional Rift - Shadow Realm',
			onWin: () => {
				if (player.inShadowRealm) {
					player.inShadowRealm = false;
					toast.success(`${player.name} tears open a rift and ESCAPES the Shadow Realm!`);
				} else {
					generateRandomPlayerWheel(`${player.name}'s Dimensional Rift Target`, (target) => {
						target.inShadowRealm = true;
						toast.success(`${player.name} banishes ${target.name} to the SHADOW REALM!`);
					});
				}
			}
		},
		{
			label: 'Grand Illusion - 3x Win Wheel',
			onWin: () => {
				toast.success(`${player.name} conjures GRAND ILLUSIONS! Spinning the Win Wheel 3 times!`);
				generateWinWheel(player.name);
				setTimeout(() => generateWinWheel(player.name), 100);
				setTimeout(() => generateWinWheel(player.name), 200);
			}
		},
		{
			label: 'Spin 2 Loot Wheels',
			onWin: () => {
				toast.success(`${player.name} manifests arcane treasures!`);
				generateLootWheel(player.name, 1);
				generateLootWheel(player.name, 2);
			}
		}
	];

	addCustomWheel(`ULTIMATE Spell - ${player.name}`, wheel, 'magic');
}
