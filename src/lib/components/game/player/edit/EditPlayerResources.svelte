<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Stepper from '$lib/components/ui/Stepper.svelte';
	import { HIDDEN_RESOURCES } from '$lib/components/game/player/shared/playerDisplayConstants';
	import type { Player } from '$lib/game/player/player.svelte';
	import { MANA_RESOURCE, MAX_MANA } from '$lib/game/wheels/spellWheels';
	import { LUCKY_STREAK_RESOURCE, updateLuckyStreakMultipliers } from '$lib/game/classes/gambler';
	import { Swenergy as SWENERGY_RESOURCE } from '$lib/game/classes/swe';

	interface SpecialResourceCard {
		resource: string;
		label: string;
		icon: string;
		iconColorClass: string;
		containerClass: string;
		buttonClass: string;
		step: number;
		max?: number;
	}

	interface Props {
		player: Player;
	}

	let { player }: Props = $props();

	const specialResourceCards: Record<string, SpecialResourceCard | undefined> = {
		magicman: {
			resource: MANA_RESOURCE,
			label: 'Mana',
			icon: 'mdi:wizard-hat',
			iconColorClass: 'text-tertiary-400',
			containerClass:
				'group border-tertiary-500/30 bg-tertiary-500/10 hover:border-tertiary-500/50 relative overflow-hidden rounded border transition-all',
			buttonClass:
				'border-tertiary-500/20 text-tertiary-400 hover:bg-tertiary-500/20 flex h-10 w-10 items-center justify-center transition-all hover:text-white active:scale-95',
			step: 10,
			max: MAX_MANA
		},
		swe: {
			resource: SWENERGY_RESOURCE,
			label: 'SWEnergy',
			icon: 'mdi:code-braces',
			iconColorClass: 'text-secondary-400',
			containerClass:
				'group border-secondary-500/30 bg-secondary-500/10 hover:border-secondary-500/50 relative overflow-hidden rounded border transition-all',
			buttonClass:
				'border-secondary-500/20 text-secondary-400 hover:bg-secondary-500/20 flex h-10 w-10 items-center justify-center transition-all hover:text-white active:scale-95',
			step: 1
		}
	};

	let specialResourceCard = $derived(
		player.classType === 'none' ? undefined : specialResourceCards[player.classType]
	);
	let genericResourceEntries = $derived(
		Object.entries(player.resources).filter(([resource]) => !HIDDEN_RESOURCES.has(resource))
	);

	function updateResource(resource: string, nextValue: number, max?: number) {
		const clamped = max !== undefined ? Math.min(max, nextValue) : nextValue;
		player.resources[resource] = Math.max(0, clamped);

		if (resource === LUCKY_STREAK_RESOURCE) {
			updateLuckyStreakMultipliers(player);
		}
	}
</script>

{#snippet specialResourceEditor(card: SpecialResourceCard, value: number)}
	<div class="grid grid-cols-1 gap-3">
		<div class={card.containerClass}>
			<div class="flex items-center">
				<button
					type="button"
					class="{card.buttonClass} border-r"
					onclick={() => updateResource(card.resource, value - card.step, card.max)}
				>
					<Icon icon="mdi:minus" />
				</button>
				<div class="flex flex-1 flex-col items-center justify-center px-3 py-1.5">
					<div class="flex items-center gap-1.5">
						<Icon icon={card.icon} class="{card.iconColorClass} text-sm" />
						<span class="text-surface-100 text-lg font-bold tabular-nums">{value}</span>
						{#if card.max !== undefined}
							<span class="text-surface-500 text-xs">/ {card.max}</span>
						{/if}
					</div>
					<span class="{card.iconColorClass} text-[0.6rem] font-semibold tracking-widest uppercase"
						>{card.label}</span
					>
				</div>
				<button
					type="button"
					class="{card.buttonClass} border-l"
					onclick={() => updateResource(card.resource, value + card.step, card.max)}
				>
					<Icon icon="mdi:plus" />
				</button>
			</div>
		</div>
	</div>
{/snippet}

{#if specialResourceCard}
	{@const specialValue = player.resources[specialResourceCard.resource] ?? 0}
	{@render specialResourceEditor(specialResourceCard, specialValue)}
{:else if genericResourceEntries.length > 0}
	<div class="grid grid-cols-2 gap-3">
		{#each genericResourceEntries as [resource, amount] (resource)}
			<Stepper
				value={amount}
				onChange={(val) => updateResource(resource, val)}
				icon="mdi:cube-outline"
				label={resource}
				colorClass="text-teal-400"
				min={0}
			/>
		{/each}
	</div>
{/if}
