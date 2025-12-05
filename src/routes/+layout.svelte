<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { currentGame, resetGame } from '$lib/stores/gameStore.svelte';
	import { toaster } from '$lib/stores/toaster.svelte';
	import { Toast } from '@skeletonlabs/skeleton-svelte';
	import '../app.css';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	// Theme toggle - check initial state from localStorage or system preference
	let isDark = $state(
		typeof window !== 'undefined'
			? localStorage.getItem('theme') === 'dark' ||
					(!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
			: true
	);

	// Apply initial theme on mount
	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.dataset.theme = 'battle-arena';
			document.documentElement.dataset.mode = isDark ? 'dark' : 'light';
			localStorage.setItem('theme', isDark ? 'dark' : 'light');
		}
	});

	function toggleTheme() {
		isDark = !isDark;
	}
</script>

<!-- Toast notifications -->
<Toast.Group {toaster}>
	{#snippet children(toast)}
		<Toast {toast}>
			<Toast.Message>
				<Toast.Title>{toast.title}</Toast.Title>
				<Toast.Description>{toast.description}</Toast.Description>
			</Toast.Message>
			<Toast.CloseTrigger />
		</Toast>
	{/snippet}
</Toast.Group>

<!-- Custom layout replacing AppShell -->
<div class="flex h-full flex-col">
	<!-- Header/AppBar -->
	<header class="bg-surface-100-900 flex items-center justify-between border-b border-surface-300 px-4 py-3">
		<h3 class="ml-2 text-xl font-semibold">Spin-Wheel Battle Royal</h3>
		<div class="flex items-center gap-3">
			{#if currentGame.value}
				<Button class="preset-filled-error-500" onclick={resetGame}>Reset Game</Button>
			{/if}
			<button
				type="button"
				class="btn preset-filled-surface-200-800 rounded-lg p-2"
				onclick={toggleTheme}
				aria-label="Toggle theme"
			>
				{#if isDark}
					<iconify-icon icon="mdi:weather-sunny" width="20"></iconify-icon>
				{:else}
					<iconify-icon icon="mdi:weather-night" width="20"></iconify-icon>
				{/if}
			</button>
		</div>
	</header>

	<!-- Main content -->
	<main class="flex-1 overflow-auto">
		<div class="flex w-full flex-col items-center p-4">
			{@render children?.()}
		</div>
	</main>
</div>
