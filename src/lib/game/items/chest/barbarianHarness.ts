import type { Player } from '../../player/player.svelte';
import type { Item } from '../itemTypes';

export const BarbarianHarness: Item = {
    name: 'Barbarian Harness',
    description: 'Gain +20 attack, Lose -10 Defense',
    type: 'chest',
    baseCost: 3,
    maxAmount: 1,
    image: '/Items/ChestEquipables/BarbarianHarness.svg',

    onEquip: (player: Player) => {
            player.bonusAttack += 20;
            player.bonusDefense -= 10;
        },
        onUnequip: (player: Player) => {
            player.bonusAttack -= 20;
            player.bonusDefense += 10;
        }
    };