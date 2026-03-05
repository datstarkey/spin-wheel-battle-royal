<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { getGameStore } from '$lib/stores/gameStore.svelte';
	import { getMultiplayerStore } from '$lib/multiplayer/multiplayerStore.svelte';
	import { fly, fade } from 'svelte/transition';

	const gs = getGameStore();
	const mp = getMultiplayerStore();

	let currentName = $derived(gs.game?.currentPlayer?.name ?? '');
	let isMyTurn = $derived(mp.isMyTurn);
</script>

{#key currentName}
	{#if currentName}
		<div
			class="pointer-events-none fixed top-20 left-1/2 z-50 -translate-x-1/2"
			in:fly={{ y: -40, duration: 400 }}
			out:fade={{ duration: 300, delay: 2700 }}
		>
			<div
				class="flex items-center gap-3 rounded-lg border-2 px-6 py-3 shadow-lg backdrop-blur-sm
					{isMyTurn
					? 'border-primary-500/60 bg-primary-950/90 shadow-[0_0_30px_rgba(220,38,38,0.3)]'
					: 'border-surface-500/40 bg-surface-950/90 shadow-[0_0_20px_rgba(0,0,0,0.5)]'}"
			>
				{#if isMyTurn}
					<Icon icon="mdi:sword-cross" class="text-primary-400 text-2xl" />
					<span class="text-primary-400 font-mono text-lg font-black tracking-[0.2em] uppercase"
						>YOUR TURN</span
					>
					<Icon icon="mdi:sword-cross" class="text-primary-400 text-2xl" />
				{:else}
					<Icon icon="mdi:account" class="text-surface-400 text-xl" />
					<span class="font-mono text-lg tracking-wide text-white">
						<span class="font-bold">{currentName}</span>
						<span class="text-surface-400">'s Turn</span>
					</span>
				{/if}
			</div>
		</div>
	{/if}
{/key}
