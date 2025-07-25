import type { ClassType } from '../classes/classType';
import type { Player } from '../player/player.svelte';
import { BarbarianHarness } from './chest/barbarianHarness';
import { GoFasterStripes } from './chest/goFasterStripes';
import { Kevlar } from './chest/kevlar';
import { SportsBra } from './chest/sportsBra';
import { Halo } from './consumables/halo';
import { HealthPot } from './consumables/healthPot';
import { JagerShots } from './consumables/jagerShots';
import { stellaArtois } from './consumables/stellaArtois';
import { vodkaRedbull } from './consumables/vodkaRedbull';
import { ANiceHat } from './helm/aNiceHat';
import { BeerGoggles } from './helm/beerGoggles';
import { Kaibrows } from './helm/kaibrows';
import { BrassKnucklesMH } from './mainHand/brassKnucklesMH';
import { BrassKnucklesOH } from './mainHand/brassKnucklesOH';
import { Fireball } from './mainHand/fireball';
import { Lightsaber } from './mainHand/lightsaber';
import { HylianShield } from './offhand/hylianShield';
import { Shiv } from './offhand/shiv';
export interface Item {
	name: string;
	type: ItemType;
	description: string;
	image: string;
	baseCost: number;
	classLocks?: ClassType[];
	maxAmount?: number;

	onUse?: (player: Player) => void;
	onEquip?: (player: Player, type: ItemType) => void;
	onUnequip?: (player: Player, type: ItemType) => void;
	onAttackWin?: (player: Player, defendingPlayer: Player) => void;
	onAttackLose?: (player: Player, defendingPlayer: Player) => void;
	onDefendWin?: (player: Player, playerAttackingYou: Player) => void;
	onDefendLose?: (player: Player, playerAttackingYou: Player) => void;
	onAttackStart?: (player: Player, defendingPlayer: Player) => void;
	onAttackEnd?: (player: Player, defendingPlayer: Player) => void;
	onDefenseStart?: (player: Player, playerAttackingYou: Player) => void;
	onDefenseEnd?: (player: Player, playerAttackingYou: Player) => void;
	onTurnStart?: (player: Player) => void;
	onTurnEnd?: (player: Player) => void;
}

export const mainhands = {
	Lightsaber: Lightsaber,
	Fireball: Fireball,
	BrassKnuckles: BrassKnucklesMH
};

export const offhands = {
	HylianShield: HylianShield,
	Shiv: Shiv,
	BrassKnucklesOH: BrassKnucklesOH
};

export const helms = {
	Halo: Halo,
	ANiceHat: ANiceHat,
	Kaibrows: Kaibrows,
	BeerGoggles: BeerGoggles
};

export const chests = {
	SportsBra: SportsBra,
	BarbarianHarness: BarbarianHarness,
	Kevlar: Kevlar,
	GoFasterStripes: GoFasterStripes
};

export const consumables = {
	HealthPot: HealthPot,
	JagerShots: JagerShots,
	stellaArtois: stellaArtois,
	vodkaRedbull: vodkaRedbull,
	halo: Halo
};

const items = {
	mainhand: mainhands,
	offHand: offhands,
	helm: helms,
	chest: chests,
	consumables: consumables
};

export default items;

export type ItemType = keyof typeof items;
export type MainHands = keyof typeof items.mainhand;
export type OffHands = keyof typeof items.offHand;
export type Helms = keyof typeof items.helm;
export type Chests = keyof typeof items.chest;
export type Consumables = keyof typeof items.consumables;

export type AllItems = MainHands | OffHands | Helms | Chests | Consumables;

export function getItemByType(type: AllItems) {
	if (type in items.mainhand) {
		return items.mainhand[type as MainHands] as Item;
	}
	if (type in items.offHand) {
		return items.offHand[type as OffHands] as Item;
	}
	if (type in items.helm) {
		return items.helm[type as Helms] as Item;
	}
	if (type in items.chest) {
		return items.chest[type as Chests] as Item;
	}
	if (type in items.consumables) {
		return items.consumables[type as Consumables] as Item;
	}
	return null;
}
