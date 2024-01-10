<script>
	import { AppBar, AppShell, Drawer, LightSwitch, initializeStores } from '@skeletonlabs/skeleton';
	import '../app.css';
	import { onMount } from 'svelte';
	import { autoModeWatcher } from '@skeletonlabs/skeleton';
	import { Toaster } from 'svelte-french-toast';
	import { currentGame, resetGame } from '$lib/stores/gameStore';
	import Button from '$lib/components/Button.svelte';

	initializeStores();

	onMount(() => {
		autoModeWatcher();
	});
</script>

<Toaster position="bottom-center"></Toaster>
<Drawer />

<AppShell>
	<svelte:fragment slot="header">
		<AppBar>
			<h3 slot="lead" class="ml-5">Spin-Wheel Battle Royal</h3>
			<svelte:fragment slot="trail">
				{#if $currentGame}
					<Button class="variant-filled-error" on:click={resetGame}>Reset Game</Button>
				{/if}
				<LightSwitch></LightSwitch></svelte:fragment
			>
		</AppBar>
	</svelte:fragment>

	<!-- <svelte:fragment slot="sidebarLeft">
		<AppRail>
			<AppRailAnchor href="/">Home</AppRailAnchor>
			<AppRailAnchor href="/players">Players</AppRailAnchor>
		</AppRail>
	</svelte:fragment> -->

	<div class="flex w-full flex-col items-center p-4">
		<slot />
	</div>
</AppShell>
