<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Player } from '$lib/game/player/player.svelte';
	import { generateButtonWheel } from '$lib/game/wheels/buttonWheel';
	import { generateDamageTakenWheel } from '$lib/game/wheels/damageTakenWheel';
	import { generateGamblerWheel } from '$lib/game/wheels/gamblerWheel';
	import { generateLootWheel } from '$lib/game/wheels/lootWheel';
	import { generateLoseWheel } from '$lib/game/wheels/loseWheel';
	import { generateShadowRealmWheel } from '$lib/game/wheels/shadowRealm';
	import { generateWinWheel } from '$lib/game/wheels/winWheel';
	import toast from '$lib/stores/toaster.svelte';

	interface Props {
		player: Player;
		align?: 'left' | 'right';
	}

	let { player, align = 'right' }: Props = $props();

	let wheelDropdownOpen = $state(false);

	const wheels = [
		{ name: 'Loot Wheel', action: () => generateLootWheel(player.name) },
		{ name: 'Win Wheel', action: () => generateWinWheel(player.name) },
		{ name: 'Lose Wheel', action: () => generateLoseWheel(player.name) },
		{ name: 'Button Wheel', action: () => generateButtonWheel(player.name) },
		{ name: 'Damage Taken Wheel', action: () => generateDamageTakenWheel(player.name) },
		{
			name: 'Shadow Realm Wheel',
			action: () => generateShadowRealmWheel(player.name),
			condition: () => player.inShadowRealm
		},
		{
			name: 'Gambler Wheel',
			action: () => generateGamblerWheel(player.name),
			condition: () => player.classType === 'gambler'
		}
	];

	function addWheel(wheel: (typeof wheels)[0]) {
		wheel.action();
		toast.success(`${wheel.name} Added`);
		wheelDropdownOpen = false;
	}

	export function getIsOpen() {
		return wheelDropdownOpen;
	}
</script>

<div class="relative">
	<button
		class="text-surface-300 hover:border-primary-500 hover:text-surface-100 flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 bg-white/5 transition-all hover:bg-white/10"
		onclick={() => (wheelDropdownOpen = !wheelDropdownOpen)}
		title="Add Wheel"
	>
		<Icon icon="mdi:tire" />
	</button>
	{#if wheelDropdownOpen}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="fixed inset-0 z-40" onclick={() => (wheelDropdownOpen = false)}></div>
		<div
			class="bg-surface-950 absolute top-full z-50 mt-1 min-w-40 overflow-hidden rounded border border-white/10 shadow-xl
				{align === 'right' ? 'right-0' : 'left-0'}"
		>
			{#each wheels as wheel (wheel.name)}
				{#if !wheel.condition || wheel.condition()}
					<button
						class="text-surface-300 hover:text-surface-100 w-full border-none bg-transparent px-3 py-2 text-left text-xs transition-all hover:bg-white/5"
						onclick={() => addWheel(wheel)}
					>
						{wheel.name}
					</button>
				{/if}
			{/each}
		</div>
	{/if}
</div>
