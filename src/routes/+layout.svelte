<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import SoundCloudPlayer from '$lib/components/audio/SoundCloudPlayer.svelte';
	import GlobalGameStats from '$lib/components/game/GlobalGameStats.svelte';
	import ClassesHelpModal from '$lib/components/help/ClassesHelpModal.svelte';
	import { currentGame, resetGame } from '$lib/stores/gameStore.svelte';
	import { Toaster } from 'svelte-sonner';
	import '../app.css';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	// Force dark mode only
	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.dataset.theme = 'battle-arena';
			document.documentElement.dataset.mode = 'dark';
		}
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
	<header class="bg-surface-100-900 flex items-center justify-between border-b border-surface-300 px-4 py-3">
		<h3 class="ml-2 text-xl font-semibold">Spin-Wheel Battle Royal</h3>
		<div class="flex items-center gap-3">
			{#if currentGame.value?.started}
				<GlobalGameStats />
			{/if}
			{#if currentGame.value}
				<Button class="preset-filled-error-500" onclick={resetGame}>Reset Game</Button>
			{/if}
			<ClassesHelpModal />
		</div>
	</header>

	<!-- Main content -->
	<main class="flex-1 overflow-auto p-4">
		{@render children?.()}
	</main>
</div>
