<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Player } from '$lib/game/player/player.svelte';
	import { EQUIPMENT_SLOTS } from './playerDisplayConstants';

	interface Props {
		player: Player;
		compact?: boolean;
		isDead?: boolean;
	}

	let { player, compact = false, isDead = false }: Props = $props();

	let labelSize = $derived(compact ? 'text-[0.55rem]' : 'text-[0.6rem]');
</script>

<div class="{compact ? 'mb-4' : 'mb-3'} {isDead ? 'opacity-40' : ''}">
	<div
		class="text-surface-400 mb-1.5 flex items-center gap-1.5 {labelSize} font-semibold tracking-[0.15em] uppercase"
	>
		<Icon icon="mdi:treasure-chest" class="text-xs opacity-70" />
		<span>Equipment</span>
	</div>
	<div class="grid grid-cols-2 gap-1">
		{#each EQUIPMENT_SLOTS as slot (slot.key)}
			{@const value = player.gear[slot.key] as string | null}
			<div
				class="flex items-center gap-1.5 rounded-sm border border-white/[0.03] bg-black/25 px-1.5 py-1"
			>
				<Icon icon={slot.icon} class="{slot.colorClass} text-xs opacity-60" />
				<span
					class="truncate text-[0.65rem] {value
						? 'text-surface-300'
						: compact
							? 'text-surface-500 italic'
							: 'text-surface-400 italic'}"
				>
					{value ?? 'Empty'}
				</span>
			</div>
		{/each}
	</div>
</div>
