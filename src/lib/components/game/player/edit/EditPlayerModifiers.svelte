<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Player } from '$lib/game/player/player.svelte';

	interface Props {
		player: Player;
	}

	let { player }: Props = $props();

	let modifiers = $derived(player.activeModifiers);
	let hasModifiers = $derived(
		Object.keys(modifiers.attack).length > 0 ||
			Object.keys(modifiers.defense).length > 0 ||
			Object.keys(modifiers.movement).length > 0 ||
			Object.keys(modifiers.attackRange).length > 0
	);
</script>

{#if hasModifiers}
	<div class="rounded border border-white/10 bg-black/20 p-3">
		<div
			class="text-surface-400 mb-2 flex items-center gap-2 text-[0.65rem] font-semibold tracking-widest uppercase"
		>
			<Icon icon="mdi:tune-variant" class="text-xs" />
			<span>Active Modifiers</span>
		</div>
		<div class="grid gap-1 text-xs">
			{#if Object.keys(modifiers.attack).length > 0}
				<div class="flex flex-col gap-1">
					<div class="flex items-center gap-2">
						<Icon icon="mdi:sword" class="text-primary-400 text-xs" />
						<span class="text-surface-400">ATK:</span>
					</div>
					{#each Object.entries(modifiers.attack) as [source, value]}
						<div class="ml-4 flex items-center gap-2">
							<button
								type="button"
								class="text-error-400 hover:text-error-300 transition-colors"
								onclick={() => player.removeStatModifier(source, 'attack')}
								title="Remove modifier"
							>
								<Icon icon="mdi:close-circle" class="text-xs" />
							</button>
							<span class="text-surface-300 font-mono">{source}: {value > 0 ? '+' : ''}{value}</span
							>
						</div>
					{/each}
				</div>
			{/if}
			{#if Object.keys(modifiers.defense).length > 0}
				<div class="flex flex-col gap-1">
					<div class="flex items-center gap-2">
						<Icon icon="mdi:shield" class="text-secondary-400 text-xs" />
						<span class="text-surface-400">DEF:</span>
					</div>
					{#each Object.entries(modifiers.defense) as [source, value]}
						<div class="ml-4 flex items-center gap-2">
							<button
								type="button"
								class="text-error-400 hover:text-error-300 transition-colors"
								onclick={() => player.removeStatModifier(source, 'defense')}
								title="Remove modifier"
							>
								<Icon icon="mdi:close-circle" class="text-xs" />
							</button>
							<span class="text-surface-300 font-mono">{source}: {value > 0 ? '+' : ''}{value}</span
							>
						</div>
					{/each}
				</div>
			{/if}
			{#if Object.keys(modifiers.movement).length > 0}
				<div class="flex flex-col gap-1">
					<div class="flex items-center gap-2">
						<Icon icon="ion:footsteps" class="text-success-400 text-xs" />
						<span class="text-surface-400">MOV:</span>
					</div>
					{#each Object.entries(modifiers.movement) as [source, value]}
						<div class="ml-4 flex items-center gap-2">
							<button
								type="button"
								class="text-error-400 hover:text-error-300 transition-colors"
								onclick={() => player.removeStatModifier(source, 'movement')}
								title="Remove modifier"
							>
								<Icon icon="mdi:close-circle" class="text-xs" />
							</button>
							<span class="text-surface-300 font-mono">{source}: {value > 0 ? '+' : ''}{value}</span
							>
						</div>
					{/each}
				</div>
			{/if}
			{#if Object.keys(modifiers.attackRange).length > 0}
				<div class="flex flex-col gap-1">
					<div class="flex items-center gap-2">
						<Icon icon="material-symbols:social-distance" class="text-warning-400 text-xs" />
						<span class="text-surface-400">RNG:</span>
					</div>
					{#each Object.entries(modifiers.attackRange) as [source, value]}
						<div class="ml-4 flex items-center gap-2">
							<button
								type="button"
								class="text-error-400 hover:text-error-300 transition-colors"
								onclick={() => player.removeStatModifier(source, 'attackRange')}
								title="Remove modifier"
							>
								<Icon icon="mdi:close-circle" class="text-xs" />
							</button>
							<span class="text-surface-300 font-mono">{source}: {value > 0 ? '+' : ''}{value}</span
							>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
