<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import type { Player } from '$lib/game/player/player.svelte';
	import { generateButtonWheel } from '$lib/game/wheels/buttonWheel';
	import { generateLootWheel } from '$lib/game/wheels/lootWheel';
	import { generateLoseWheel } from '$lib/game/wheels/loseWheel';
	import { generateShadowRealmWheel } from '$lib/game/wheels/shadowRealm';
	import { generateWinWheel } from '$lib/game/wheels/winWheel';
	import toast from 'svelte-french-toast';

	interface Props {
		player: Player;
	}
	let { player }: Props = $props();
</script>

{#if player.inShadowRealm}
	<Button
		onclick={() => {
			generateShadowRealmWheel(player.name);
			toast.success('Shadow Realm Wheel Added');
		}}
	>
		Add Shadow Realm Wheel
	</Button>
{/if}

<div class="flex gap-8">
	<Button
		onclick={() => {
			generateLootWheel(player.name);
			toast.success('Loot Wheel Added');
		}}
	>
		Add Loot Wheel
	</Button>

	<Button
		onclick={() => {
			generateWinWheel(player.name);
			toast.success('Win Wheel Added');
		}}
	>
		Add Win Wheel
	</Button>

	<Button
		onclick={() => {
			generateLoseWheel(player.name);
			toast.success('Lose Wheel Added');
		}}
	>
		Add Lose Wheel
	</Button>

	<Button
		onclick={() => {
			generateButtonWheel(player.name);
			toast.success('Button Wheel Added');
		}}
	>
		Add Button Wheel
	</Button>
</div>
