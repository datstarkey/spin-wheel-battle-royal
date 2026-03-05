<script lang="ts">
	import { getMultiplayerStore } from '$lib/multiplayer/multiplayerStore.svelte';

	const mp = getMultiplayerStore();

	let movingPlayer = $derived(mp.spectatorMovePlayer);
	let shoppingPlayer = $derived(mp.shoppingPlayerName);
	let isMyTurn = $derived(mp.isMyTurn);

	// Only show to non-active players
	let statusText = $derived.by(() => {
		if (isMyTurn) return null;
		if (movingPlayer)
			return {
				icon: 'ion:footsteps',
				text: `${movingPlayer} is choosing a move...`,
				color: 'success'
			};
		if (shoppingPlayer)
			return { icon: 'mdi:store', text: `${shoppingPlayer} is shopping...`, color: 'warning' };
		return null;
	});
</script>

{#if statusText}
	<div class="pointer-events-none fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
		<div
			class="flex items-center gap-2 rounded-lg border px-4 py-2 backdrop-blur-sm
				{statusText.color === 'success'
				? 'border-success-500/40 bg-success-950/80 text-success-300'
				: 'border-warning-500/40 bg-warning-950/80 text-warning-300'}"
		>
			<iconify-icon icon={statusText.icon} class="animate-pulse text-lg"></iconify-icon>
			<span class="font-mono text-sm tracking-wide">{statusText.text}</span>
		</div>
	</div>
{/if}
