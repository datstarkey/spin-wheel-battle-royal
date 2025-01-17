<script lang="ts">
	import { currentGame } from '$lib/stores/gameStore.svelte';
	let isExpanded = $state(false);
</script>

<div class="fixed bottom-4 left-4 flex w-full max-w-md flex-col">
	<button
		class="variant-filled-primary flex items-center justify-between rounded-t-lg px-4 py-2 font-medium"
		onclick={() => (isExpanded = !isExpanded)}
	>
		<span>Game History</span>
		<span class="ml-2">{isExpanded ? '▼' : '▲'}</span>
	</button>

	{#if isExpanded}
		<div class="variant-glass-surface overflow-hidden rounded-b-lg shadow-lg">
			<div class="max-h-[60vh] space-y-2 overflow-y-auto p-4">
				{#each currentGame.value?.auditTrail.toReversed() ?? [] as item}
					<div class="variant-soft-primary rounded-lg p-3 text-sm">
						<p>{item}</p>
					</div>

					{#if item.includes('finishes their turn!')}
						<div class="h-8"></div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>
