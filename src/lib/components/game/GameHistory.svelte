<script lang="ts">
	import { currentGame } from '$lib/stores/gameStore.svelte';
	import { slide, fly } from 'svelte/transition';

	let isExpanded = $state(false);
	let scrollContainer: HTMLDivElement | undefined = $state();

	// Parse event type from message for color coding and icons
	function getEventType(message: string): {
		type: string;
		icon: string;
		colorClass: string;
		bgClass: string;
	} {
		const lower = message.toLowerCase();

		// Victory / Game End
		if (lower.includes('wins the game') || lower.includes('has won'))
			return {
				type: 'victory',
				icon: '👑',
				colorClass: 'text-warning-400',
				bgClass: 'bg-warning-500/10 border-warning-500/30'
			};
		if (lower === 'game started!')
			return {
				type: 'game-start',
				icon: '🎮',
				colorClass: 'text-success-400',
				bgClass: 'bg-success-500/10 border-success-500/30'
			};

		// Death
		if (lower.includes('is dead'))
			return {
				type: 'death',
				icon: '💀',
				colorClass: 'text-error-400',
				bgClass: 'bg-error-500/10 border-error-500/30'
			};

		// Combat - special abilities first (more specific)
		if (lower.includes('2 tapped') || lower.includes('2 tap'))
			return {
				type: 'gorf',
				icon: '🔫',
				colorClass: 'text-error-400',
				bgClass: 'bg-error-500/10 border-error-500/30'
			};
		if (lower.includes('shit on') || lower.includes('no items to shit'))
			return {
				type: 'poop',
				icon: '💩',
				colorClass: 'text-warning-600',
				bgClass: 'bg-warning-500/10 border-warning-500/30'
			};
		if (lower.includes('shivved') || lower.includes('shiv'))
			return {
				type: 'shiv',
				icon: '🗡️',
				colorClass: 'text-error-400',
				bgClass: 'bg-error-500/10 border-error-500/30'
			};

		// Combat - general
		if (lower.includes('beat') || lower.includes('attacks'))
			return {
				type: 'attack',
				icon: '⚔️',
				colorClass: 'text-primary-400',
				bgClass: 'bg-primary-500/10 border-primary-500/30'
			};
		if (lower.includes('lost to'))
			return {
				type: 'defend',
				icon: '🛡️',
				colorClass: 'text-secondary-400',
				bgClass: 'bg-secondary-500/10 border-secondary-500/30'
			};

		// Shadow Realm events
		if (lower.includes('shadow realm') || lower.includes('swaps places'))
			return {
				type: 'shadow',
				icon: '🌑',
				colorClass: 'text-tertiary-400',
				bgClass: 'bg-tertiary-500/10 border-tertiary-500/30'
			};
		if (lower.includes('returns to spawn') || lower.includes('escaped'))
			return {
				type: 'escape',
				icon: '🏃',
				colorClass: 'text-success-400',
				bgClass: 'bg-success-500/10 border-success-500/30'
			};

		// Gold / Shop
		if (lower.includes('gold') || lower.includes('buys') || lower.includes('shop costs'))
			return {
				type: 'gold',
				icon: '💰',
				colorClass: 'text-warning-400',
				bgClass: 'bg-warning-500/10 border-warning-500/30'
			};

		// Casino
		if (lower.includes('casino'))
			return {
				type: 'casino',
				icon: '🎰',
				colorClass: 'text-warning-400',
				bgClass: 'bg-warning-500/10 border-warning-500/30'
			};

		// Health
		if (lower.includes('hp') || lower.includes('heals') || lower.includes('healing'))
			return {
				type: 'health',
				icon: '❤️',
				colorClass: 'text-success-400',
				bgClass: 'bg-success-500/10 border-success-500/30'
			};

		// Movement / Teleport
		if (lower.includes('rotated'))
			return {
				type: 'rotate',
				icon: '🔄',
				colorClass: 'text-secondary-400',
				bgClass: 'bg-secondary-500/10 border-secondary-500/30'
			};
		if (
			lower.includes('moved') ||
			lower.includes('movement') ||
			lower.includes('teleport') ||
			lower.includes('stepped on')
		)
			return {
				type: 'move',
				icon: '➡️',
				colorClass: 'text-success-400',
				bgClass: 'bg-success-500/10 border-success-500/30'
			};
		if (lower.includes('arrived at'))
			return {
				type: 'arrive',
				icon: '📍',
				colorClass: 'text-secondary-400',
				bgClass: 'bg-secondary-500/10 border-secondary-500/30'
			};

		// Spawn
		if (lower.includes('spawned'))
			return {
				type: 'spawn',
				icon: '✨',
				colorClass: 'text-tertiary-400',
				bgClass: 'bg-tertiary-500/10 border-tertiary-500/30'
			};

		// Turn management
		if (lower.includes('starts their turn'))
			return {
				type: 'turn-start',
				icon: '▶',
				colorClass: 'text-primary-400',
				bgClass: 'bg-primary-500/10 border-primary-500/30'
			};
		if (lower.includes('finishes their turn'))
			return {
				type: 'turn-end',
				icon: '■',
				colorClass: 'text-surface-400',
				bgClass: 'bg-surface-500/10 border-surface-500/30'
			};
		if (lower.includes('another turn'))
			return {
				type: 'extra-turn',
				icon: '🔁',
				colorClass: 'text-primary-400',
				bgClass: 'bg-primary-500/10 border-primary-500/30'
			};
		if (lower.includes('skipped') || lower.includes('will be skipped'))
			return {
				type: 'skip',
				icon: '⏭',
				colorClass: 'text-warning-400',
				bgClass: 'bg-warning-500/10 border-warning-500/30'
			};
		if (lower.includes('turn manually set'))
			return {
				type: 'admin',
				icon: '⚙️',
				colorClass: 'text-surface-400',
				bgClass: 'bg-surface-500/10 border-surface-500/30'
			};

		// Stats changes
		if (lower.includes('attack range'))
			return {
				type: 'range',
				icon: '🎯',
				colorClass: 'text-primary-400',
				bgClass: 'bg-primary-500/10 border-primary-500/30'
			};
		if (lower.includes('attack') && (lower.includes('base') || lower.includes('bonus')))
			return {
				type: 'attack-stat',
				icon: '⚔️',
				colorClass: 'text-primary-400',
				bgClass: 'bg-primary-500/10 border-primary-500/30'
			};
		if (lower.includes('defense') && (lower.includes('base') || lower.includes('bonus')))
			return {
				type: 'defense-stat',
				icon: '🛡️',
				colorClass: 'text-secondary-400',
				bgClass: 'bg-secondary-500/10 border-secondary-500/30'
			};

		// Status effects
		if (lower.includes('no longer has'))
			return {
				type: 'status-remove',
				icon: '✖️',
				colorClass: 'text-surface-400',
				bgClass: 'bg-surface-500/10 border-surface-500/30'
			};
		if (lower.includes('now has') && !lower.includes('gold') && !lower.includes('hp'))
			return {
				type: 'status-add',
				icon: '⚡',
				colorClass: 'text-tertiary-400',
				bgClass: 'bg-tertiary-500/10 border-tertiary-500/30'
			};

		// Items
		if (lower.includes('uses') || lower.includes('was given'))
			return {
				type: 'item',
				icon: '📦',
				colorClass: 'text-secondary-400',
				bgClass: 'bg-secondary-500/10 border-secondary-500/30'
			};
		if (lower.includes('gains') || lower.includes('loses'))
			return {
				type: 'stat-change',
				icon: '📊',
				colorClass: 'text-secondary-400',
				bgClass: 'bg-secondary-500/10 border-secondary-500/30'
			};

		// Button
		if (lower.includes('button'))
			return {
				type: 'event',
				icon: '🔴',
				colorClass: 'text-error-400',
				bgClass: 'bg-error-500/10 border-error-500/30'
			};

		// Global game settings
		if (lower.includes('global'))
			return {
				type: 'global',
				icon: '🌐',
				colorClass: 'text-surface-400',
				bgClass: 'bg-surface-500/10 border-surface-500/30'
			};

		return {
			type: 'info',
			icon: '•',
			colorClass: 'text-surface-300',
			bgClass: 'bg-surface-500/10 border-surface-500/30'
		};
	}

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

	let processedEntries = $derived(
		processEntries(currentGame.value?.auditTrail.toReversed() ?? [])
	);

	let entryCount = $derived(currentGame.value?.auditTrail.length ?? 0);
</script>

<!-- Floating Battle Log Terminal -->
<div class="fixed bottom-4 left-4 z-50 flex w-full max-w-md flex-col">
	<!-- Terminal Header -->
	<button
		class="group relative flex items-center justify-between overflow-hidden border border-b-0 px-4 py-2.5 transition-all duration-300
			{isExpanded
			? 'rounded-t-lg border-primary-500/50 bg-surface-900/95'
			: 'rounded-lg border-surface-500/30 bg-surface-900/90 hover:border-primary-500/30 hover:bg-surface-800/95'}"
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
						class="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-primary-500"
					></div>
				{/if}
			</div>

			<div class="flex flex-col items-start">
				<span
					class="text-xs font-bold uppercase tracking-widest
					{isExpanded ? 'text-primary-400' : 'text-surface-200 group-hover:text-primary-400'}"
				>
					Battle Log
				</span>
				<span class="text-[10px] uppercase tracking-wider text-surface-500">
					{entryCount} events recorded
				</span>
			</div>
		</div>

		<!-- Right section with expand indicator -->
		<div class="relative z-10 flex items-center gap-2">
			<!-- Entry count badge -->
			{#if entryCount > 0 && !isExpanded}
				<div
					class="flex h-5 min-w-5 items-center justify-center rounded-sm bg-primary-500/20 px-1.5 text-[10px] font-bold text-primary-400"
				>
					{entryCount}
				</div>
			{/if}

			<!-- Chevron -->
			<div
				class="flex h-6 w-6 items-center justify-center rounded transition-transform duration-300
				{isExpanded ? 'rotate-180 text-primary-400' : 'text-surface-400'}"
			>
				<svg
					class="h-4 w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					stroke-width="2"
				>
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
			class="relative overflow-hidden rounded-b-lg border border-t-0 border-primary-500/50 bg-surface-950/98 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5),0_0_20px_-5px_rgba(220,38,38,0.2)]"
			transition:slide={{ duration: 250 }}
		>
			<!-- Top fade gradient -->
			<div
				class="pointer-events-none absolute left-0 right-0 top-0 z-10 h-6 bg-linear-to-b from-surface-950/98 to-transparent"
			></div>

			<!-- Scrollable content -->
			<div
				bind:this={scrollContainer}
				class="scrollbar-thin scrollbar-track-surface-900 scrollbar-thumb-surface-600 max-h-[50vh] min-h-[200px] overflow-y-auto px-3 py-4"
			>
				{#if processedEntries.length === 0}
					<div class="flex flex-col items-center justify-center py-8 text-center">
						<div class="mb-2 text-2xl opacity-30">📜</div>
						<p class="text-xs uppercase tracking-wider text-surface-500">No events recorded</p>
						<p class="mt-1 text-[10px] text-surface-600">Battle log will appear here</p>
					</div>
				{:else}
					<div class="space-y-1.5">
						{#each processedEntries as entry, i (entry.index)}
							{@const event = getEventType(entry.message)}

							<!-- Turn separator -->
							{#if entry.isTurnEnd && i < processedEntries.length - 1}
								<div class="relative my-4 flex items-center justify-center">
									<div class="absolute inset-x-0 top-1/2 h-px bg-surface-700/50"></div>
									<div
										class="relative z-10 rounded-full bg-surface-900 px-3 py-0.5 text-[9px] uppercase tracking-widest text-surface-500"
									>
										turn end
									</div>
								</div>
							{/if}

							<!-- Log Entry -->
							<div
								class="group/entry relative flex items-start gap-2 rounded border px-2.5 py-2 transition-all duration-150 hover:bg-surface-800/30 {event.bgClass}"
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
									<p class="text-xs leading-relaxed text-surface-200">
										{entry.message}
									</p>
								</div>

								<!-- Entry number (subtle) -->
								<div
									class="shrink-0 self-center text-[9px] tabular-nums text-surface-600 opacity-0 transition-opacity group-hover/entry:opacity-100"
								>
									#{currentGame.value?.auditTrail.length ?? 0 - entry.index}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Bottom fade gradient -->
			<div
				class="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-6 bg-linear-to-t from-surface-950/98 to-transparent"
			></div>

			<!-- Corner accents -->
			<div class="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-primary-500/30"></div>
			<div class="absolute bottom-0 right-0 h-3 w-3 border-b border-r border-primary-500/30"></div>
		</div>
	{/if}
</div>
