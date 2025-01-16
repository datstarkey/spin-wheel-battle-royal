import toast from 'svelte-french-toast';
import type { Player } from '../player/player.svelte';
import type { WheelBase } from './wheels';

export const shadowRealmWheel: WheelBase = [
	{
		label: 'Return to spawn'
	},
	{
		label: 'Lose 5 gold',
		onWin: (player: Player) => (player.gold -= 5)
	},
	{
		label: 'Give 5 gold to someone',
		onWin: () => toast.error('Not implemented yet')
	},
	{
		label: 'Give 3 Base Attack to someone',
		onWin: () => toast.error('Not implemented yet')
	},
	{
		label: 'Give 3 Base Defense to someone',
		onWin: () => toast.error('Not implemented yet')
	},
	{
		label: 'Swap Places with someone',
		onWin: () => toast.error('Not implemented yet')
	},
	{
		label: 'Teleport to someone',
		onWin: () => toast.error('Not implemented yet')
	},
	{
		label: 'Increase all shop costs by 1g for everyone',
		onWin: () => toast.error('Not implemented yet')
	},
	{
		label: 'Emotional damage',
		onWin: () => toast.error('Not implemented yet')
	},
	{
		label: 'Nothing'
	}
];
