<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Player } from '$lib/game/player/player.svelte';
	import statusEffects, { type StatusType } from '$lib/game/statuses/statusTypes';

	interface Props {
		player: Player;
	}

	let { player }: Props = $props();

	let selectedStatus = $state<StatusType | ''>('');

	let availableStatuses = $derived(
		Object.entries(statusEffects).filter(
			([key]) =>
				player.statuses.canHaveStatus(key as StatusType) &&
				!player.statuses.hasStatus(key as StatusType)
		)
	);

	function addStatus() {
		if (selectedStatus && player.statuses.canHaveStatus(selectedStatus)) {
			player.statuses.addStatus(selectedStatus);
			selectedStatus = '';
		}
	}
</script>

<!-- Divider: Status Effects -->
<div class="flex items-center gap-3">
	<div class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"></div>
	<span class="text-surface-500 text-[0.6rem] font-semibold tracking-widest uppercase"
		>Status Effects</span
	>
	<div class="via-surface-600 h-px flex-1 bg-linear-to-r from-transparent to-transparent"></div>
</div>

<!-- Current Status Effects -->
{#if player.statuses.statuses.length > 0}
	<div class="flex flex-wrap gap-1">
		{#each player.statuses.statuses as status (status.status.name)}
			<div
				class="border-warning-500/20 bg-warning-500/10 flex items-center gap-1.5 rounded border px-2 py-1"
			>
				<span class="text-warning-400 text-xs">{status.status.name}</span>
				{#if status.duration && status.duration > 0}
					<span class="text-warning-500 rounded bg-black/30 px-1 py-0.5 text-[0.6rem] font-bold"
						>{status.duration}T</span
					>
				{:else}
					<span class="text-tertiary-400 text-xs">&#8734;</span>
				{/if}
				<button
					type="button"
					class="text-surface-500 hover:text-error-400 transition-colors"
					onclick={() => {
						const key = Object.entries(statusEffects).find(
							([, s]) => s.name === status.status.name
						)?.[0] as StatusType | undefined;
						if (key) player.statuses.removeStatus(key);
					}}
				>
					<Icon icon="mdi:close" class="text-xs" />
				</button>
			</div>
		{/each}
	</div>
{/if}

<!-- Add Status Effect -->
<div class="flex gap-1">
	<select class="select flex-1 text-xs" bind:value={selectedStatus}>
		<option value="">+ Add Status Effect</option>
		{#each availableStatuses as [key, status] (key)}
			<option value={key}>{status.name}</option>
		{/each}
	</select>
	<button
		type="button"
		class="text-surface-400 hover:border-warning-500/50 hover:bg-warning-500/20 rounded border border-white/10 bg-black/30 px-3 transition-all hover:text-white disabled:opacity-30"
		disabled={!selectedStatus}
		onclick={addStatus}
	>
		<Icon icon="mdi:plus" />
	</button>
</div>
