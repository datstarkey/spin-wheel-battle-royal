<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Player } from '$lib/game/player/player.svelte';
	import { getSocketStore } from '$lib/multiplayer/socketStore.svelte';

	const socket = getSocketStore();
	import toast from '$lib/stores/toaster.svelte';

	interface Props {
		player: Player;
		align?: 'left' | 'right';
	}

	let { player, align = 'right' }: Props = $props();

	let wheelDropdownOpen = $state(false);

	const wheels = [
		{ name: 'Loot Wheel', type: 'loot' },
		{ name: 'Button Wheel', type: 'button' },
		{ name: 'Casino Wheel', type: 'casino' },
		{
			name: 'Shadow Realm Wheel',
			type: 'shadow',
			condition: () => player.inShadowRealm
		},
		{
			name: 'Gambler Wheel',
			type: 'gambler',
			condition: () => player.classType === 'gambler'
		}
	];

	function addWheel(wheel: (typeof wheels)[0]) {
		socket.gmAddWheel(player.name, wheel.type);
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
		title="Add Wheel (GM)"
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
