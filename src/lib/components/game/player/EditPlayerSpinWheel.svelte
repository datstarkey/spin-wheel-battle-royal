<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import type { Player } from '$lib/game/player/player.svelte';
	import { generateShadowRealmWheel } from '$lib/game/wheels/shadowRealm';
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
