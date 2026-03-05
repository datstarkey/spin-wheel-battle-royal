<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Player } from '$lib/game/player/player.svelte';

	interface Props {
		player: Player;
		compact?: boolean;
		isDead?: boolean;
	}

	let { player, compact = false, isDead = false }: Props = $props();

	let labelSize = $derived(compact ? 'text-[0.55rem]' : 'text-[0.6rem]');
</script>

{#if player.statuses.statuses.length > 0}
	<div class="{compact ? 'mb-4' : 'mb-3'} {isDead ? 'opacity-40' : ''}">
		<div
			class="text-surface-400 mb-1.5 flex items-center gap-1.5 {labelSize} font-semibold tracking-[0.15em] uppercase"
		>
			<Icon icon="mdi:star-four-points" class="text-xs opacity-70" />
			<span>Status Effects</span>
		</div>
		<div class="flex flex-wrap gap-1">
			{#each player.statuses.statuses as status (status.status.name)}
				<div
					class="border-warning-500/20 bg-warning-500/10 relative flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5
						{compact ? '' : 'group cursor-help'}"
				>
					<span class="text-warning-400 text-[0.6rem]">{status.status.name}</span>
					{#if status.duration && status.duration > 0}
						<span
							class="text-warning-500 rounded-sm bg-black/30 px-1 py-0.5 text-[0.55rem] font-bold"
							>{status.duration}T</span
						>
					{:else}
						<span class="text-tertiary-400 text-[0.6rem]">&#8734;</span>
					{/if}
					<!-- Tooltip (full card only) -->
					{#if !compact}
						<div
							class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
						>
							<div
								class="bg-surface-950 border-surface-500/50 max-w-48 rounded border px-2 py-1.5 text-center shadow-lg"
							>
								<p class="text-surface-100 text-[0.65rem] leading-relaxed">
									{status.status.description}
								</p>
							</div>
							<div
								class="border-surface-950 absolute left-1/2 -translate-x-1/2 border-4 border-b-0 border-r-transparent border-l-transparent"
							></div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}
