<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/forms/Input.svelte';
	import type { Player } from '$lib/game/player/player.svelte';
	import statusEffects, { type StatusType } from '$lib/game/statuses/statusTypes';

	interface Props {
		player: Player;
	}
	let { player }: Props = $props();

	const statuses = Object.entries(statusEffects);
</script>

<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
	{#each statuses as [name, status]}
		{#if player.statuses.canHaveStatus(name as StatusType)}
			<div
				class="bg-surface flex flex-col justify-between rounded-xl border border-surface-300 p-4 text-sm shadow-sm"
			>
				<div class="mb-2">
					<h3 class="text-lg font-medium">{status.name}</h3>

					{#if status.image}
						<img src={status.image} alt={name} class="mx-auto my-2 h-12 w-12 object-contain" />
					{/if}

					<p class="text-sm">{status.description}</p>
				</div>

				{#if player.statuses.hasStatus(name as StatusType)}
					{@const effect = player.statuses.getEffect(name as StatusType)}
					{#if effect}
						<div class="flex items-end gap-2">
							<Input label="Duration" bind:value={effect.duration} />
							<Button
								class="w-full"
								onclick={() => player.statuses.removeStatus(name as StatusType)}
							>
								Remove
							</Button>
						</div>
					{/if}
				{:else}
					<Button class="w-full" onclick={() => player.statuses.addStatus(name as StatusType)}>
						Add Status
					</Button>
				{/if}
			</div>
		{/if}
	{/each}
</div>
