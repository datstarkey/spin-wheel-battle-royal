<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import CustomWheels from '$lib/components/wheel/CustomWheels.svelte';
	import { getMultiplayerStore } from '$lib/multiplayer/multiplayerStore.svelte';
	import { getSocketStore } from '$lib/multiplayer/socketStore.svelte';
	import { getGameStore } from '$lib/stores/gameStore.svelte';

	const gs = getGameStore();
	const mp = getMultiplayerStore();
	const socket = getSocketStore();

	let gamePlayers = $derived(gs.game?.players ?? []);
	let starting = $state(false);

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

<div class="mx-auto flex max-w-2xl flex-col gap-6 pt-8">
	<!-- Room Header -->
	<div class="text-center">
		<p class="text-surface-400 mb-1 text-sm">Room Code</p>
		<h1 class="text-primary-400 font-mono text-5xl font-bold tracking-widest">{mp.roomCode}</h1>
		<p class="text-surface-500 mt-2 text-sm">
			Share this link to invite friends:
			<span class="text-surface-300 font-mono text-xs">{page.url.origin}?lobby={mp.roomCode}</span>
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
									<span class="text-success-400 font-mono text-sm font-bold">#{entry.position}</span
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
