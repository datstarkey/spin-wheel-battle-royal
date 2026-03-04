<script lang="ts">
	import { onMount } from 'svelte';
	import {
		initAudio,
		getBattleMusicState,
		setMusicVolume,
		toggleMute,
		playBackgroundMusic
	} from '$lib/stores/battleMusic.svelte';

	let showControls = $state(false);
	let userHasInteracted = $state(false);
	const musicState = getBattleMusicState();

	onMount(() => {
		initAudio();

		// Listen for any user interaction to enable audio
		const enableAudio = () => {
			userHasInteracted = true;
			// Remove listeners after first interaction
			document.removeEventListener('click', enableAudio);
			document.removeEventListener('keydown', enableAudio);
			document.removeEventListener('touchstart', enableAudio);
		};

		document.addEventListener('click', enableAudio);
		document.addEventListener('keydown', enableAudio);
		document.addEventListener('touchstart', enableAudio);

		return () => {
			document.removeEventListener('click', enableAudio);
			document.removeEventListener('keydown', enableAudio);
			document.removeEventListener('touchstart', enableAudio);
		};
	});

	// Auto-start background music when ready, user has interacted, and not muted
	$effect(() => {
		if (musicState.isReady && userHasInteracted && !musicState.isMuted && !musicState.isPlaying) {
			playBackgroundMusic();
		}
	});
</script>

<!-- Floating music indicator/controls -->
{#if musicState.isReady}
	<div class="fixed right-4 bottom-4 z-40">
		<button
			onclick={() => (showControls = !showControls)}
			class="bg-surface-800 text-surface-100 hover:bg-surface-700 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all {musicState.isMuted
				? 'opacity-50'
				: ''}"
			aria-label="Music controls"
		>
			{#if musicState.isMuted}
				<span class="text-surface-500">♪</span>
			{:else if musicState.isBattlePlaying}
				<span class="text-primary-400 animate-pulse">⚔</span>
			{:else if musicState.isVictoryPlaying}
				<span class="text-warning-400 animate-pulse">🏆</span>
			{:else if musicState.isBackgroundPlaying}
				<span class="text-success-400 animate-pulse">♪</span>
			{:else}
				<span class="text-surface-400">♪</span>
			{/if}
		</button>

		{#if showControls}
			<div
				class="border-surface-700 bg-surface-800 absolute right-0 bottom-12 w-52 rounded-lg border p-3 shadow-xl"
			>
				<div class="mb-3 flex items-center justify-between">
					<div>
						<p class="text-surface-300 text-xs font-medium">Music</p>
						<p class="text-surface-500 text-[10px]">
							{#if musicState.isBattlePlaying}
								Battle
							{:else if musicState.isVictoryPlaying}
								Victory
							{:else if musicState.isBackgroundPlaying}
								Background
							{:else}
								Stopped
							{/if}
						</p>
					</div>
					<button
						onclick={toggleMute}
						class="flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors {musicState.isMuted
							? 'bg-error-500/20 text-error-400 hover:bg-error-500/30'
							: 'bg-success-500/20 text-success-400 hover:bg-success-500/30'}"
					>
						{#if musicState.isMuted}
							<span>Muted</span>
						{:else}
							<span>On</span>
						{/if}
					</button>
				</div>

				<div class:opacity-50={musicState.isMuted}>
					<p class="text-surface-400 mb-1 text-xs">Volume</p>
					<input
						type="range"
						min="0"
						max="100"
						value={musicState.volume}
						oninput={(e) => setMusicVolume(Number(e.currentTarget.value))}
						disabled={musicState.isMuted}
						class="w-full"
					/>
					<p class="text-surface-500 mt-1 text-center text-xs">{musicState.volume}%</p>
				</div>
			</div>
		{/if}
	</div>
{/if}
