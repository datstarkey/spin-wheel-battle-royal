import type { Player } from '../player/player.svelte';
import { SportsBra } from './chest/sportsBra';
import { HealthPot } from './consumables/healthPot';
import { ANiceHat } from './helm/aNiceHat';
import { BeerGoggles } from './helm/beerGoggles';
import { Halo } from './helm/halo';
import { Kaibrows } from './helm/kaibrows';
import { BrassKnuckles } from './mainHand/brassKnuckles';
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
	classLocks?: string[];

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

const items = {
	mainhand: {
		Lightsaber: Lightsaber,
		Fireball: Fireball,
		'Brass Knuckles': BrassKnuckles
	},
	offHand: {
		'Hylian Shield': HylianShield,
		Shiv: Shiv
	},
	helm: {
		Halo: Halo,
		'A Nice Hat': ANiceHat,
		Kaibrows: Kaibrows,
		'Beer Goggles': BeerGoggles
	},
	chest: {
		'Sports Bra': SportsBra
	},
	consumables: {
		'Health Pot': HealthPot
	}
};

export default items;

export type ItemType = keyof typeof items;
export type MainHands = keyof typeof items.mainhand;
export type OffHands = keyof typeof items.offHand;
export type Helms = keyof typeof items.helm;
export type Chests = keyof typeof items.chest;
