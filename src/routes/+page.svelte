<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import Players from '$lib/components/game/Players.svelte';
	import CustomWheels from '$lib/components/wheel/CustomWheels.svelte';
	import RoomLobby from '$lib/components/multiplayer/RoomLobby.svelte';
	import LobbyMenu from '$lib/components/multiplayer/LobbyMenu.svelte';
	import { getMultiplayerStore, loadSession } from '$lib/multiplayer/multiplayerStore.svelte';
	import { getGameStore } from '$lib/stores/gameStore.svelte';

	const gs = getGameStore();
	const mp = getMultiplayerStore();

	// Ready once we know there's no session OR connection has resolved
	let hasSession = $state(!!loadSession());
	let ready = $derived(
		!hasSession || mp.connectionStatus === 'connected' || mp.connectionStatus === 'disconnected'
	);

	let gameStarted = $derived(gs.game?.started ?? false);

	// State for lobby menu initial mode (from query param)
	let initialMode = $state<'menu' | 'join'>('menu');
	let initialJoinCode = $state('');

	onMount(() => {
		hasSession = !!loadSession();
		const lobbyParam = page.url.searchParams.get('lobby');
		if (lobbyParam) {
			initialJoinCode = lobbyParam.toUpperCase();
			initialMode = 'join';
		}
	});
</script>

<!-- Loading: wait for reconnection attempt to resolve -->
{#if !ready}
	<div class="flex items-center justify-center pt-24">
		<div class="flex items-center gap-3">
			<Icon icon="mdi:loading" class="text-primary-400 animate-spin text-2xl" />
			<span class="text-surface-400 font-mono text-sm tracking-wider">Connecting...</span>
		</div>
	</div>

	<!-- View 1: Game is running -->
{:else if gameStarted}
	<Players />
	<CustomWheels />

	<!-- View 2: Connected to room, waiting/setup -->
{:else if mp.isConnected}
	<RoomLobby />

	<!-- View 3: Not connected — lobby menu -->
{:else}
	<LobbyMenu {initialMode} {initialJoinCode} />
{/if}
