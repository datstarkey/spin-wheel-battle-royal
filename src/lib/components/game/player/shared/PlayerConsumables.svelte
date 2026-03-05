<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Player } from '$lib/game/player/player.svelte';

	interface Props {
		player: Player;
		compact?: boolean;
		isDead?: boolean;
		currentTurnPlayer?: Player;
	}

	let { player, compact = false, isDead = false, currentTurnPlayer }: Props = $props();

	let labelSize = $derived(compact ? 'text-[0.55rem]' : 'text-[0.6rem]');
</script>

{#if player.gear.consumables.length > 0}
	<div class="{compact ? 'mb-4' : 'mb-2'} {isDead ? 'opacity-40' : ''}">
		<div
			class="text-surface-400 mb-1.5 flex items-center gap-1.5 {labelSize} font-semibold tracking-[0.15em] uppercase"
		>
			<Icon icon="iconoir:consumable" class="text-xs opacity-70" />
			<span>Items</span>
		</div>
		<div class="flex flex-col gap-1">
			{#each player.gear.consumables as item (item)}
				<div
					class="flex items-center justify-between rounded-sm border border-white/[0.03] bg-black/25 px-1.5 py-1"
				>
					<span class="text-surface-300 text-[0.65rem]">{item}</span>
					<button
						class="from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 rounded-sm border-none bg-gradient-to-br px-1.5 py-0.5 text-[0.55rem] font-bold tracking-widest text-white uppercase transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-30"
						disabled={isDead || player.name !== currentTurnPlayer?.name}
						onclick={() => player.gear.useConsumable(item)}
					>
						USE
					</button>
				</div>
			{/each}
		</div>
	</div>
{/if}
