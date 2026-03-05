<script lang="ts">
	import { getGameStore } from '$lib/stores/gameStore.svelte';
	import { getMultiplayerStore } from '$lib/multiplayer/multiplayerStore.svelte';
	import { fly } from 'svelte/transition';

	const gs = getGameStore();
	const mp = getMultiplayerStore();

	let currentName = $derived(gs.game?.currentPlayer?.name ?? '');
	let isMyTurn = $derived(mp.isMyTurn);

	let visible = $state(false);
	let displayName = $state('');
	let displayIsMe = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	let prevName = '';

	$effect(() => {
		const name = currentName;
		if (name && name !== prevName) {
			prevName = name;
			displayName = name;
			displayIsMe = isMyTurn;
			visible = true;
			clearTimeout(timer);
			timer = setTimeout(() => {
				visible = false;
			}, 3000);
		}

		return () => {
			clearTimeout(timer);
		};
	});
</script>

{#if visible}
	<div
		class="pointer-events-none fixed top-20 left-1/2 z-50 -translate-x-1/2"
		transition:fly={{ y: -40, duration: 400 }}
	>
		<div
			class="flex items-center gap-3 rounded-lg border-2 px-6 py-3 shadow-lg backdrop-blur-sm
				{displayIsMe
				? 'border-primary-500/60 bg-primary-950/90 shadow-[0_0_30px_rgba(220,38,38,0.3)]'
				: 'border-surface-500/40 bg-surface-950/90 shadow-[0_0_20px_rgba(0,0,0,0.5)]'}"
		>
			{#if displayIsMe}
				<iconify-icon icon="mdi:sword-cross" class="text-primary-400 text-2xl"></iconify-icon>
				<span class="text-primary-400 font-mono text-lg font-black tracking-[0.2em] uppercase"
					>YOUR TURN</span
				>
				<iconify-icon icon="mdi:sword-cross" class="text-primary-400 text-2xl"></iconify-icon>
			{:else}
				<iconify-icon icon="mdi:account" class="text-surface-400 text-xl"></iconify-icon>
				<span class="font-mono text-lg tracking-wide text-white">
					<span class="font-bold">{displayName}</span>
					<span class="text-surface-400">'s Turn</span>
				</span>
			{/if}
		</div>
	</div>
{/if}
