<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Players from '$lib/components/game/Players.svelte';
	import CustomWheels from '$lib/components/wheel/CustomWheels.svelte';
	import { getMultiplayerStore, loadSession } from '$lib/multiplayer/multiplayerStore.svelte';
	import { getSocketStore } from '$lib/multiplayer/socketStore.svelte';
	import { getGameStore } from '$lib/stores/gameStore.svelte';
	import { localStorageStore } from '$lib/stores/localStorageStore.svelte';

	const gs = getGameStore();
	const mp = getMultiplayerStore();
	const socket = getSocketStore();

	// Ready once we know there's no session OR connection has resolved
	let hasSession = $state(!!loadSession());
	let ready = $derived(
		!hasSession || mp.connectionStatus === 'connected' || mp.connectionStatus === 'disconnected'
	);

	// Derived state (only where null-coalescing adds value)
	let gameStarted = $derived(gs.game?.started ?? false);
	let gamePlayers = $derived(gs.game?.players ?? []);

	// State machine: lobby menu → room lobby → game
	let mode = $state<'menu' | 'create' | 'join'>('menu');
	let password = $state('');
	let joinCode = $state('');
	let joinPassword = $state('');
	let error = $state('');
	let loading = $state(false);
	let starting = $state(false);

	// Remember player name in localStorage
	const savedName = localStorageStore<string>('playerName', '');
	let gmName = $state(savedName.value);
	let joinName = $state(savedName.value);

	// Read ?lobby= query param + mark session status (one-time on mount)
	onMount(() => {
		hasSession = !!loadSession();
		const lobbyParam = page.url.searchParams.get('lobby');
		if (lobbyParam) {
			joinCode = lobbyParam.toUpperCase();
			mode = 'join';
		}
	});

	async function handleCreate() {
		if (!gmName.trim()) {
			error = 'Please enter your name';
			return;
		}
		error = '';
		loading = true;
		try {
			socket.connect();
			const result = await socket.createRoom(gmName.trim(), password.trim() || undefined);
			if (result.success && result.roomCode) {
				savedName.value = gmName.trim();
			} else {
				error = result.error ?? 'Failed to create room';
			}
		} catch {
			error = 'Connection failed';
		}
		loading = false;
	}

	async function handleJoin() {
		if (!joinCode.trim() || !joinName.trim()) {
			error = 'Please fill in all fields';
			return;
		}
		error = '';
		loading = true;
		try {
			socket.connect();
			const result = await socket.joinRoom(
				joinCode.trim().toUpperCase(),
				joinName.trim(),
				joinPassword.trim() || undefined
			);
			if (result.success) {
				savedName.value = joinName.trim();
			} else {
				error = result.error ?? 'Failed to join room';
			}
		} catch {
			error = 'Connection failed';
		}
		loading = false;
	}

	function removePlayer(name: string) {
		socket.gmRemovePlayer(name);
	}

	function startGame() {
		starting = true;
		socket.sendAction({ type: 'GM_START_GAME' }, (response: { success: boolean }) => {
			if (!response?.success) {
				starting = false;
			}
		});
	}

	function leaveRoom() {
		socket.disconnect();
		starting = false;
	}
</script>

<!-- Loading: wait for reconnection attempt to resolve -->
{#if !ready}
	<div class="flex items-center justify-center pt-24">
		<div class="flex items-center gap-3">
			<iconify-icon icon="mdi:loading" class="text-primary-400 animate-spin text-2xl"
			></iconify-icon>
			<span class="text-surface-400 font-mono text-sm tracking-wider">Connecting...</span>
		</div>
	</div>

	<!-- View 1: Game is running -->
{:else if gameStarted}
	<Players />
	<CustomWheels />

	<!-- View 2: Connected to room, waiting/setup -->
{:else if mp.isConnected}
	<div class="mx-auto flex max-w-2xl flex-col gap-6 pt-8">
		<!-- Room Header -->
		<div class="text-center">
			<p class="text-surface-400 mb-1 text-sm">Room Code</p>
			<h1 class="text-primary-400 font-mono text-5xl font-bold tracking-widest">{mp.roomCode}</h1>
			<p class="text-surface-500 mt-2 text-sm">
				Share this link to invite friends:
				<span class="text-surface-300 font-mono text-xs">{page.url.origin}?lobby={mp.roomCode}</span
				>
			</p>
		</div>

		<!-- Connected Players -->
		<div>
			<h2 class="text-surface-400 mb-2 text-xs font-semibold tracking-wider uppercase">
				Connected ({mp.connectedPlayers.length})
			</h2>
			<div class="flex flex-wrap gap-2">
				{#each mp.connectedPlayers as cp (cp.name)}
					<div
						class="border-surface-500/30 bg-surface-900/50 flex items-center gap-2 rounded border px-3 py-1.5 text-sm"
					>
						<div
							class="h-2 w-2 rounded-full {cp.connected ? 'bg-success-400' : 'bg-surface-600'}"
						></div>
						<span class="text-surface-200">{cp.name}</span>
						{#if cp.role === 'gm'}
							<span class="text-warning-400 text-[0.6rem] font-bold">GM</span>
						{/if}
						{#if cp.name === mp.myPlayerName}
							<span class="text-surface-500 text-[0.6rem]">(you)</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Phase: Waiting -->
		{#if mp.roomPhase === 'waiting'}
			<div class="border-surface-500/20 rounded border p-4">
				<h2 class="text-surface-300 mb-3 text-sm font-semibold tracking-wider uppercase">
					Game Players ({gamePlayers.length})
				</h2>

				{#if gamePlayers.length === 0}
					<p class="text-surface-500 text-center text-sm">
						Players are added automatically when they join the room
					</p>
				{:else}
					<div class="flex flex-col gap-2">
						{#each gamePlayers as player (player.name)}
							<div
								class="border-surface-500/20 bg-surface-900/30 flex items-center justify-between gap-3 rounded border px-3 py-2"
							>
								<span class="text-surface-100 text-sm font-medium">{player.name}</span>

								{#if mp.iAmGM && player.name !== mp.myPlayerName}
									<button
										class="text-surface-500 hover:text-error-400 transition-colors"
										onclick={() => removePlayer(player.name)}
										title="Remove player"
									>
										<Icon icon="mdi:close" />
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

			{#if mp.iAmGM}
				<div class="flex flex-col gap-2">
					<Button onclick={startGame} disabled={starting || gamePlayers.length < 2}>
						{starting ? 'Starting...' : 'Start Game'}
					</Button>
					{#if gamePlayers.length < 2}
						<p class="text-surface-500 text-center text-sm">Need at least 2 players to start</p>
					{/if}
				</div>
			{:else}
				<div
					class="border-surface-500/30 bg-surface-900/30 flex items-center justify-center gap-2 rounded border py-6"
				>
					<Icon icon="mdi:timer-sand" class="text-surface-400 animate-pulse text-lg" />
					<span class="text-surface-400">Waiting for GM to start the game...</span>
				</div>
			{/if}

			<!-- Phase: Turn Order -->
		{:else if mp.roomPhase === 'turn_order'}
			<div class="border-surface-500/20 rounded border p-4">
				<h2 class="text-surface-300 mb-3 text-sm font-semibold tracking-wider uppercase">
					<Icon icon="mdi:sort-variant" class="mr-1 inline" />
					Determining Turn Order
				</h2>
				<p class="text-surface-400 mb-4 text-sm">Spin the wheel to determine play order!</p>

				{#if gs.game}
					{@const playerNames = gs.game.players.map((p) => p.name)}
					{@const orderedSoFar = gs.game.auditTrail
						.filter((msg) => msg.includes('position #'))
						.map((msg) => {
							const match = msg.match(/^(.+) gets position #(\d+)/);
							return match ? { name: match[1], position: parseInt(match[2]) } : null;
						})
						.filter(Boolean)}
					{#if orderedSoFar.length > 0}
						<div class="mb-4 flex flex-col gap-1.5">
							{#each orderedSoFar as entry (entry?.position)}
								{#if entry}
									<div
										class="border-success-500/30 bg-success-500/10 flex items-center gap-3 rounded border px-3 py-2"
									>
										<span class="text-success-400 font-mono text-sm font-bold"
											>#{entry.position}</span
										>
										<span class="text-surface-100 text-sm font-medium">{entry.name}</span>
										<Icon icon="mdi:check" class="text-success-400 ml-auto" />
									</div>
								{/if}
							{/each}
							{#each playerNames.filter((n) => !orderedSoFar.some((e) => e?.name === n)) as remaining (remaining)}
								<div
									class="border-surface-500/20 bg-surface-900/30 flex items-center gap-3 rounded border px-3 py-2 opacity-50"
								>
									<span class="text-surface-500 font-mono text-sm font-bold">?</span>
									<span class="text-surface-400 text-sm">{remaining}</span>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</div>

			<!-- Phase: Class Selection -->
		{:else if mp.roomPhase === 'class_selection'}
			<div class="border-surface-500/20 rounded border p-4">
				<h2 class="text-surface-300 mb-3 text-sm font-semibold tracking-wider uppercase">
					<Icon icon="mdi:shield-sword" class="mr-1 inline" />
					Choose Your Class
				</h2>
				<p class="text-surface-400 mb-4 text-sm">Each player spins to choose their class!</p>

				{#if gs.game}
					<div class="flex flex-col gap-1.5">
						{#each gs.game.players as player (player.name)}
							<div
								class="flex items-center gap-3 rounded border px-3 py-2
									{player.classType !== 'none'
									? 'border-success-500/30 bg-success-500/10'
									: 'border-surface-500/20 bg-surface-900/30 opacity-50'}"
							>
								{#if player.class.icon}
									<img
										src={player.class.icon}
										alt=""
										class="h-6 w-6"
										style="image-rendering: pixelated;"
									/>
								{:else}
									<span class="text-surface-500 text-lg">?</span>
								{/if}
								<span class="text-surface-100 text-sm font-medium">{player.name}</span>
								{#if player.classType !== 'none'}
									<span class="text-success-400 ml-auto text-sm font-semibold">
										{player.class.name}
									</span>
									<Icon icon="mdi:check" class="text-success-400" />
								{:else}
									<span class="text-surface-500 ml-auto text-sm italic">Waiting...</span>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<button
			class="text-surface-500 hover:text-error-400 text-sm transition-colors"
			onclick={leaveRoom}
		>
			Leave Room
		</button>
	</div>

	<!-- Wheel overlays for setup phases -->
	<CustomWheels />

	<!-- View 3: Not connected — lobby menu -->
{:else}
	<div class="mx-auto flex max-w-md flex-col items-center gap-6 pt-12">
		<h1 class="text-surface-100 text-3xl font-bold">Spin-Wheel Battle Royal</h1>
		<p class="text-surface-400 text-center">Play with friends on different devices</p>

		{#if error}
			<div
				class="border-error-500/50 bg-error-500/10 text-error-300 w-full rounded border px-4 py-2 text-sm"
			>
				{error}
			</div>
		{/if}

		{#if mode === 'menu'}
			<div class="flex w-full flex-col gap-3">
				<button
					class="border-primary-500/30 bg-primary-500/10 hover:border-primary-500/50 hover:bg-primary-500/20 flex items-center gap-3 rounded border px-6 py-4 text-left transition-all"
					onclick={() => (mode = 'create')}
				>
					<Icon icon="mdi:plus-circle" class="text-primary-400 text-2xl" />
					<div>
						<div class="text-surface-100 font-bold">Create Room</div>
						<div class="text-surface-400 text-sm">Host a new game as GM</div>
					</div>
				</button>

				<button
					class="border-secondary-500/30 bg-secondary-500/10 hover:border-secondary-500/50 hover:bg-secondary-500/20 flex items-center gap-3 rounded border px-6 py-4 text-left transition-all"
					onclick={() => (mode = 'join')}
				>
					<Icon icon="mdi:account-group" class="text-secondary-400 text-2xl" />
					<div>
						<div class="text-surface-100 font-bold">Join Room</div>
						<div class="text-surface-400 text-sm">Enter a room code to join</div>
					</div>
				</button>
			</div>
		{:else if mode === 'create'}
			<form
				class="flex w-full flex-col gap-4"
				onsubmit={(e) => {
					e.preventDefault();
					handleCreate();
				}}
			>
				<div>
					<label for="gm-name" class="text-surface-300 mb-1 block text-sm">Your Name</label>
					<input
						id="gm-name"
						type="text"
						bind:value={gmName}
						placeholder="Enter your name"
						class="border-surface-500/50 bg-surface-900 text-surface-100 placeholder:text-surface-600 focus:border-primary-500 w-full rounded border px-3 py-2 focus:outline-none"
						autocomplete="off"
					/>
				</div>
				<div>
					<label for="room-password" class="text-surface-300 mb-1 block text-sm"
						>Password (optional)</label
					>
					<input
						id="room-password"
						type="password"
						bind:value={password}
						placeholder="Leave empty for public room"
						class="border-surface-500/50 bg-surface-900 text-surface-100 placeholder:text-surface-600 focus:border-primary-500 w-full rounded border px-3 py-2 focus:outline-none"
					/>
				</div>
				<Button type="submit" disabled={loading}>
					{loading ? 'Creating...' : 'Create Room'}
				</Button>
				<button
					type="button"
					class="text-surface-500 hover:text-surface-300 text-sm"
					onclick={() => (mode = 'menu')}
				>
					Back
				</button>
			</form>
		{:else}
			<form
				class="flex w-full flex-col gap-4"
				onsubmit={(e) => {
					e.preventDefault();
					handleJoin();
				}}
			>
				<div>
					<label for="join-code" class="text-surface-300 mb-1 block text-sm">Room Code</label>
					<input
						id="join-code"
						type="text"
						bind:value={joinCode}
						placeholder="e.g. A3F9K2"
						class="border-surface-500/50 bg-surface-900 text-surface-100 placeholder:text-surface-600 focus:border-secondary-500 w-full rounded border px-3 py-2 font-mono text-lg tracking-widest uppercase focus:outline-none"
						autocomplete="off"
						maxlength="6"
					/>
				</div>
				<div>
					<label for="join-name" class="text-surface-300 mb-1 block text-sm">Your Name</label>
					<input
						id="join-name"
						type="text"
						bind:value={joinName}
						placeholder="Enter your name"
						class="border-surface-500/50 bg-surface-900 text-surface-100 placeholder:text-surface-600 focus:border-secondary-500 w-full rounded border px-3 py-2 focus:outline-none"
						autocomplete="off"
					/>
				</div>
				<div>
					<label for="join-password" class="text-surface-300 mb-1 block text-sm"
						>Password (if required)</label
					>
					<input
						id="join-password"
						type="password"
						bind:value={joinPassword}
						placeholder="Leave empty if none"
						class="border-surface-500/50 bg-surface-900 text-surface-100 placeholder:text-surface-600 focus:border-secondary-500 w-full rounded border px-3 py-2 focus:outline-none"
					/>
				</div>
				<Button type="submit" disabled={loading}>
					{loading ? 'Joining...' : 'Join Room'}
				</Button>
				<button
					type="button"
					class="text-surface-500 hover:text-surface-300 text-sm"
					onclick={() => (mode = 'menu')}
				>
					Back
				</button>
			</form>
		{/if}
	</div>
{/if}
