<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import SoundCloudPlayer from '$lib/components/audio/SoundCloudPlayer.svelte';
	import GlobalGameStats from '$lib/components/game/GlobalGameStats.svelte';
	import ClassesHelpModal from '$lib/components/help/ClassesHelpModal.svelte';
	import ConnectionStatus from '$lib/components/multiplayer/ConnectionStatus.svelte';
	import { quickMode } from '$lib/components/wheel/SpinWheel.svelte';
	import { setGameStore } from '$lib/stores/gameStore.svelte';
	import { setAttackWindowStore } from '$lib/stores/attackWindowStore.svelte';
	import { setBattleMusicStore } from '$lib/stores/battleMusic.svelte';
	import { setMovementStore } from '$lib/stores/movementStore.svelte';
	import { setMultiplayerStore } from '$lib/multiplayer/multiplayerStore.svelte';
	import { setSocketStore } from '$lib/multiplayer/socketStore.svelte';
	import { Toaster } from 'svelte-sonner';
	import '../app.css';

	// Initialize all context stores (must happen synchronously during component init)
	// Order matters: gameStore and mpStore must be created before socketStore
	const gs = setGameStore();
	const mp = setMultiplayerStore();
	const socket = setSocketStore(gs, mp);
	const movementStore = setMovementStore(gs);
	movementStore.setSocketStore(socket);
	setAttackWindowStore();
	setBattleMusicStore();

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	// Auto-reconnect + force dark theme (run once on mount, not reactively)
	onMount(() => {
		socket.autoReconnect();
		document.documentElement.dataset.theme = 'battle-arena';
		document.documentElement.dataset.mode = 'dark';
	});
</script>

<!-- SoundCloud Battle Music Player -->
<SoundCloudPlayer />

<!-- Toast notifications -->
<Toaster richColors position="bottom-right" />

<!-- Modal portal target - renders above everything -->
<div id="modal-portal" class="contents"></div>

<!-- Custom layout replacing AppShell -->
<div class="flex h-full flex-col">
	<!-- Header/AppBar -->
	<header
		class="bg-surface-100-900 border-surface-300 flex items-center justify-between border-b px-4 py-3"
	>
		<h3 class="ml-2 text-xl font-semibold">Spin-Wheel Battle Royal</h3>
		<div class="flex items-center gap-3">
			<ConnectionStatus />
			{#if gs.game?.started}
				<!-- Round Counter -->
				<div
					class="border-secondary-500/30 bg-secondary-500/10 flex items-center gap-2 rounded border px-3 py-1.5 text-sm font-medium"
					title="Global round count (movement +1 every 5 rounds)"
				>
					<Icon icon="mdi:rotate-right" class="text-secondary-400 text-base" />
					<span class="text-secondary-300">Round {gs.game.globalTurnCount}</span>
					<span class="text-secondary-500/80 text-xs">(+{gs.game.globalMovementBonus} mov)</span>
				</div>
				<!-- Quick Mode Toggle -->
				<button
					onclick={() => (quickMode.value = !quickMode.value)}
					class="flex items-center gap-2 rounded border px-3 py-1.5 text-sm font-medium transition-all {quickMode.value
						? 'border-warning-500/50 bg-warning-500/20 text-warning-300 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
						: 'border-surface-500/30 bg-surface-800/50 text-surface-400 hover:border-surface-400/50 hover:text-surface-300'}"
					title="Toggle quick wheel spin mode"
				>
					<Icon icon="mdi:fast-forward" class="text-base" />
					<span>Quick</span>
				</button>
				<GlobalGameStats />
			{/if}
			{#if mp.isConnected}
				<button
					onclick={() => socket.disconnect()}
					class="border-surface-500/30 bg-surface-800/50 text-surface-400 hover:border-error-500/50 hover:text-error-400 flex items-center gap-1.5 rounded border px-3 py-1.5 text-sm font-medium transition-all"
					title="Leave room"
				>
					<Icon icon="mdi:exit-run" class="text-base" />
					<span>Leave</span>
				</button>
			{/if}
			<ClassesHelpModal />
		</div>
	</header>

	<!-- Main content -->
	<main class="flex-1 overflow-auto p-4">
		{@render children?.()}
	</main>
</div>
