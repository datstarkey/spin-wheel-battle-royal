<script lang="ts">
	import { getGameStore } from '$lib/stores/gameStore.svelte';
	import { getEventType } from './auditEventRules';

	const gs = getGameStore();
	import { slide, fly } from 'svelte/transition';

	let isExpanded = $state(false);
	let scrollContainer: HTMLDivElement | undefined = $state();

	// Group messages by turn for visual separation
	function processEntries(
		entries: string[]
	): Array<{ message: string; isTurnEnd: boolean; index: number }> {
		return entries.map((message, index) => ({
			message,
			isTurnEnd: message.includes('finishes their turn'),
			index
		}));
	}

	let processedEntries = $derived(processEntries(gs.game?.auditTrail.toReversed() ?? []));

	let entryCount = $derived(gs.game?.auditTrail.length ?? 0);
</script>

<!-- Floating Battle Log Terminal -->
<div class="fixed bottom-4 left-4 z-50 flex w-full max-w-md flex-col">
	<!-- Terminal Header -->
	<button
		class="group relative flex items-center justify-between overflow-hidden border border-b-0 px-4 py-2.5 transition-all duration-300
			{isExpanded
			? 'border-primary-500/50 bg-surface-900/95 rounded-t-lg'
			: 'border-surface-500/30 bg-surface-900/90 hover:border-primary-500/30 hover:bg-surface-800/95 rounded-lg'}"
		onclick={() => (isExpanded = !isExpanded)}
	>
		<!-- Scanline overlay effect -->
		<div
			class="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]"
		></div>

		<!-- Left section with icon and title -->
		<div class="relative z-10 flex items-center gap-3">
			<!-- Animated terminal icon -->
			<div class="relative">
				<div
					class="flex h-7 w-7 items-center justify-center rounded border text-xs
					{isExpanded
						? 'border-primary-500/50 bg-primary-500/20 text-primary-400'
						: 'border-surface-500/50 bg-surface-800 text-surface-400 group-hover:border-primary-500/30 group-hover:text-primary-400'}"
				>
					<span class="font-mono">▣</span>
				</div>
				<!-- Blinking indicator -->
				{#if entryCount > 0}
					<div
						class="bg-primary-500 absolute -top-0.5 -right-0.5 h-2 w-2 animate-pulse rounded-full"
					></div>
				{/if}
			</div>

			<div class="flex flex-col items-start">
				<span
					class="text-xs font-bold tracking-widest uppercase
					{isExpanded ? 'text-primary-400' : 'text-surface-200 group-hover:text-primary-400'}"
				>
					Battle Log
				</span>
				<span class="text-surface-500 text-[10px] tracking-wider uppercase">
					{entryCount} events recorded
				</span>
			</div>
		</div>

		<!-- Right section with expand indicator -->
		<div class="relative z-10 flex items-center gap-2">
			<!-- Entry count badge -->
			{#if entryCount > 0 && !isExpanded}
				<div
					class="bg-primary-500/20 text-primary-400 flex h-5 min-w-5 items-center justify-center rounded-sm px-1.5 text-[10px] font-bold"
				>
					{entryCount}
				</div>
			{/if}

			<!-- Chevron -->
			<div
				class="flex h-6 w-6 items-center justify-center rounded transition-transform duration-300
				{isExpanded ? 'text-primary-400 rotate-180' : 'text-surface-400'}"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
				</svg>
			</div>
		</div>

		<!-- Active border glow when expanded -->
		{#if isExpanded}
			<div
				class="absolute inset-0 rounded-t-lg shadow-[inset_0_1px_0_0_rgba(220,38,38,0.3),0_0_20px_-5px_rgba(220,38,38,0.3)]"
			></div>
		{/if}
	</button>

	<!-- Expanded Log Panel -->
	{#if isExpanded}
		<div
			class="border-primary-500/50 bg-surface-950/98 relative overflow-hidden rounded-b-lg border border-t-0 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5),0_0_20px_-5px_rgba(220,38,38,0.2)]"
			transition:slide={{ duration: 250 }}
		>
			<!-- Top fade gradient -->
			<div
				class="from-surface-950/98 pointer-events-none absolute top-0 right-0 left-0 z-10 h-6 bg-linear-to-b to-transparent"
			></div>

			<!-- Scrollable content -->
			<div
				bind:this={scrollContainer}
				class="scrollbar-thin scrollbar-track-surface-900 scrollbar-thumb-surface-600 max-h-[50vh] min-h-[200px] overflow-y-auto px-3 py-4"
			>
				{#if processedEntries.length === 0}
					<div class="flex flex-col items-center justify-center py-8 text-center">
						<div class="mb-2 text-2xl opacity-30">📜</div>
						<p class="text-surface-500 text-xs tracking-wider uppercase">No events recorded</p>
						<p class="text-surface-600 mt-1 text-[10px]">Battle log will appear here</p>
					</div>
				{:else}
					<div class="space-y-1.5">
						{#each processedEntries as entry, i (entry.index)}
							{@const event = getEventType(entry.message)}

							<!-- Turn separator -->
							{#if entry.isTurnEnd && i < processedEntries.length - 1}
								<div class="relative my-4 flex items-center justify-center">
									<div class="bg-surface-700/50 absolute inset-x-0 top-1/2 h-px"></div>
									<div
										class="bg-surface-900 text-surface-500 relative z-10 rounded-full px-3 py-0.5 text-[9px] tracking-widest uppercase"
									>
										turn end
									</div>
								</div>
							{/if}

							<!-- Log Entry -->
							<div
								class="group/entry hover:bg-surface-800/30 relative flex items-start gap-2 rounded border px-2.5 py-2 transition-all duration-150 {event.bgClass}"
								in:fly={{ x: -20, duration: 200, delay: Math.min(i * 30, 300) }}
							>
								<!-- Event icon -->
								<div
									class="flex h-5 w-5 shrink-0 items-center justify-center text-sm {event.colorClass}"
								>
									{event.icon}
								</div>

								<!-- Message content -->
								<div class="min-w-0 flex-1">
									<p class="text-surface-200 text-xs leading-relaxed">
										{entry.message}
									</p>
								</div>

								<!-- Entry number (subtle) -->
								<div
									class="text-surface-600 shrink-0 self-center text-[9px] tabular-nums opacity-0 transition-opacity group-hover/entry:opacity-100"
								>
									#{gs.game?.auditTrail.length ?? 0 - entry.index}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Bottom fade gradient -->
			<div
				class="from-surface-950/98 pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-6 bg-linear-to-t to-transparent"
			></div>

			<!-- Corner accents -->
			<div class="border-primary-500/30 absolute bottom-0 left-0 h-3 w-3 border-b border-l"></div>
			<div class="border-primary-500/30 absolute right-0 bottom-0 h-3 w-3 border-r border-b"></div>
		</div>
	{/if}
</div>
