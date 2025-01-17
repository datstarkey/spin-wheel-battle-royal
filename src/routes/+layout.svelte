<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { currentGame, resetGame } from '$lib/stores/gameStore.svelte';
	import {
		AppBar,
		AppShell,
		Drawer,
		LightSwitch,
		autoModeWatcher,
		initializeStores
	} from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { Toaster } from 'svelte-french-toast';
	import '../app.css';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	initializeStores();

	onMount(() => {
		autoModeWatcher();
	});
</script>

<Toaster position="top-center"></Toaster>
<Drawer />

<AppShell>
	{#snippet header()}
		<AppBar>
			{#snippet lead()}
				<h3 class="ml-5">Spin-Wheel Battle Royal</h3>
			{/snippet}
			{#snippet trail()}
				{#if currentGame.value}
					<Button class="variant-filled-error" onclick={resetGame}>Reset Game</Button>
				{/if}
				<LightSwitch></LightSwitch>
			{/snippet}
		</AppBar>
	{/snippet}

	<!-- <svelte:fragment slot="sidebarLeft">
		<AppRail>
			<AppRailAnchor href="/">Home</AppRailAnchor>
			<AppRailAnchor href="/players">Players</AppRailAnchor>
		</AppRail>
	</svelte:fragment> -->

	<div class="flex w-full flex-col items-center p-4">
		{@render children?.()}
	</div>
</AppShell>
