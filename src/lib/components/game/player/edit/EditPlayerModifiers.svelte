<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Player } from '$lib/game/player/player.svelte';

	interface Props {
		player: Player;
	}

	let { player }: Props = $props();

	let modifiers = $derived(player.activeModifiers);
	const modifierSections = [
		{
			key: 'attack',
			label: 'ATK',
			icon: 'mdi:sword',
			colorClass: 'text-primary-400'
		},
		{
			key: 'defense',
			label: 'DEF',
			icon: 'mdi:shield',
			colorClass: 'text-secondary-400'
		},
		{
			key: 'movement',
			label: 'MOV',
			icon: 'ion:footsteps',
			colorClass: 'text-success-400'
		},
		{
			key: 'attackRange',
			label: 'RNG',
			icon: 'material-symbols:social-distance',
			colorClass: 'text-warning-400'
		}
	] as const;
	let hasModifiers = $derived(
		modifierSections.some((section) => Object.keys(modifiers[section.key]).length > 0)
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
			{#each modifierSections as section (section.key)}
				{@const entries = Object.entries(modifiers[section.key])}
				{#if entries.length > 0}
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2">
							<Icon icon={section.icon} class="{section.colorClass} text-xs" />
							<span class="text-surface-400">{section.label}:</span>
						</div>
						{#each entries as [source, value]}
							<div class="ml-4 flex items-center gap-2">
								<button
									type="button"
									class="text-error-400 hover:text-error-300 transition-colors"
									onclick={() => player.removeStatModifier(source, section.key)}
									title="Remove modifier"
								>
									<Icon icon="mdi:close-circle" class="text-xs" />
								</button>
								<span class="text-surface-300 font-mono"
									>{source}: {value > 0 ? '+' : ''}{value}</span
								>
							</div>
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/if}
