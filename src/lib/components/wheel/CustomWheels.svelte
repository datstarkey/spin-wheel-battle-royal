<script lang="ts">
	import { getMultiplayerStore } from '#lib/multiplayer/multiplayerStore.svelte.js';
	import CustomWheel from './CustomWheel.svelte';

	const mp = getMultiplayerStore();

	// The combat wheel has its own battle overlay
	let wheels = $derived(mp.pendingWheels.filter((w) => w.key !== mp.combatState?.wheelKey));
	let active = $derived(wheels[0]);
</script>

{#if active}
	<!-- Keyed so every wheel starts with a fresh, un-landed reel -->
	{#key active.key}
		<CustomWheel wheel={active} queued={wheels.length - 1} />
	{/key}
{/if}
