<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Stepper from '$lib/components/ui/Stepper.svelte';
	import type { Player } from '$lib/game/player/player.svelte';
	import { MANA_RESOURCE, MAX_MANA } from '$lib/game/wheels/spellWheels';
	import { LUCKY_STREAK_RESOURCE, updateLuckyStreakMultipliers } from '$lib/game/classes/gambler';
	import { Swenergy as SWENERGY_RESOURCE } from '$lib/game/classes/swe';

	interface Props {
		player: Player;
	}

	let { player }: Props = $props();
</script>

{#if player.classType === 'magicman'}
	{@const mana = player.resources[MANA_RESOURCE] ?? 0}
	<div class="grid grid-cols-1 gap-3">
		<div
			class="group border-tertiary-500/30 bg-tertiary-500/10 hover:border-tertiary-500/50 relative overflow-hidden rounded border transition-all"
		>
			<div class="flex items-center">
				<button
					type="button"
					class="border-tertiary-500/20 text-tertiary-400 hover:bg-tertiary-500/20 flex h-10 w-10 items-center justify-center border-r transition-all hover:text-white active:scale-95"
					onclick={() => (player.resources[MANA_RESOURCE] = Math.max(0, mana - 10))}
				>
					<Icon icon="mdi:minus" />
				</button>
				<div class="flex flex-1 flex-col items-center justify-center px-3 py-1.5">
					<div class="flex items-center gap-1.5">
						<Icon icon="mdi:wizard-hat" class="text-tertiary-400 text-sm" />
						<span class="text-surface-100 text-lg font-bold tabular-nums">{mana}</span>
						<span class="text-tertiary-500 text-xs">/ {MAX_MANA}</span>
					</div>
					<span class="text-tertiary-400 text-[0.6rem] font-semibold tracking-widest uppercase"
						>Mana</span
					>
				</div>
				<button
					type="button"
					class="border-tertiary-500/20 text-tertiary-400 hover:bg-tertiary-500/20 flex h-10 w-10 items-center justify-center border-l transition-all hover:text-white active:scale-95"
					onclick={() => (player.resources[MANA_RESOURCE] = Math.min(MAX_MANA, mana + 10))}
				>
					<Icon icon="mdi:plus" />
				</button>
			</div>
		</div>
	</div>
{:else if player.classType === 'swe'}
	{@const swenergy = player.resources[SWENERGY_RESOURCE] ?? 0}
	<div class="grid grid-cols-1 gap-3">
		<div
			class="group border-secondary-500/30 bg-secondary-500/10 hover:border-secondary-500/50 relative overflow-hidden rounded border transition-all"
		>
			<div class="flex items-center">
				<button
					type="button"
					class="border-secondary-500/20 text-secondary-400 hover:bg-secondary-500/20 flex h-10 w-10 items-center justify-center border-r transition-all hover:text-white active:scale-95"
					onclick={() => (player.resources[SWENERGY_RESOURCE] = Math.max(0, swenergy - 1))}
				>
					<Icon icon="mdi:minus" />
				</button>
				<div class="flex flex-1 flex-col items-center justify-center px-3 py-1.5">
					<div class="flex items-center gap-1.5">
						<Icon icon="mdi:code-braces" class="text-secondary-400 text-sm" />
						<span class="text-surface-100 text-lg font-bold tabular-nums">{swenergy}</span>
					</div>
					<span class="text-secondary-400 text-[0.6rem] font-semibold tracking-widest uppercase"
						>SWEnergy</span
					>
				</div>
				<button
					type="button"
					class="border-secondary-500/20 text-secondary-400 hover:bg-secondary-500/20 flex h-10 w-10 items-center justify-center border-l transition-all hover:text-white active:scale-95"
					onclick={() => (player.resources[SWENERGY_RESOURCE] = swenergy + 1)}
				>
					<Icon icon="mdi:plus" />
				</button>
			</div>
		</div>
	</div>
{:else if Object.keys(player.resources).length > 0}
	<div class="grid grid-cols-2 gap-3">
		{#each Object.entries(player.resources) as [resource, amount] (resource)}
			<Stepper
				value={amount}
				onChange={(val) => {
					player.resources[resource] = val;
					if (resource === LUCKY_STREAK_RESOURCE) {
						updateLuckyStreakMultipliers(player);
					}
				}}
				icon="mdi:cube-outline"
				label={resource}
				colorClass="text-teal-400"
				min={0}
			/>
		{/each}
	</div>
{/if}
