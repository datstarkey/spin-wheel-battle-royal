<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { Player } from '#lib/game/player/player.svelte.js';
	import { getSocketStore } from '#lib/multiplayer/socketStore.svelte.js';
	import { getBattleMusicStore } from '#lib/stores/battleMusic.svelte.js';

	interface Props {
		winner: Player;
		players: Player[];
	}

	let { winner, players }: Props = $props();

	const socket = getSocketStore();
	const music = getBattleMusicStore();

	// Winner first, then survivors by HP, then the fallen
	let standings = $derived(
		[...players].sort(
			(a, b) =>
				Number(b === winner) - Number(a === winner) ||
				Number(a.dead) - Number(b.dead) ||
				b.hp - a.hp
		)
	);

	const victoryFanfare: Attachment = () => {
		music.playVictoryMusic();
		return () => music.playBackgroundMusic();
	};
</script>

<div class="fixed inset-0 z-9998 bg-black/90 backdrop-blur-sm" aria-hidden="true">
	<div
		class="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(234,179,8,0.25)_0%,transparent_60%)]"
	></div>
</div>

<div
	class="fixed inset-0 z-9999 flex items-center justify-center overflow-y-auto p-4"
	role="dialog"
	aria-modal="true"
	aria-label="{winner.name} wins"
	{@attach victoryFanfare}
>
	<div
		class="border-warning-400/60 from-surface-900 to-surface-950 relative my-auto flex w-full max-w-lg flex-col items-center gap-6 rounded-2xl border-2 bg-linear-to-b px-6 py-8 text-center shadow-[0_0_120px_rgba(234,179,8,0.35)]"
	>
		<div class="relative">
			<span
				class="animate-wheel-burst border-warning-300 absolute inset-0 rounded-full border-4 motion-reduce:hidden"
			></span>
			<div
				class="border-warning-300 from-warning-400 to-warning-700 flex size-24 items-center justify-center rounded-full border-4 bg-linear-to-b text-5xl text-white shadow-[0_0_40px_rgba(234,179,8,0.6)]"
			>
				<iconify-icon icon="mdi:crown"></iconify-icon>
			</div>
		</div>

		<div>
			<h1 class="font-display text-warning-100 text-6xl leading-none font-extrabold">
				{winner.name} wins
			</h1>
			<p class="text-surface-400 mt-2">Last one standing in the arena</p>
		</div>

		<ol
			class="w-full divide-y divide-white/5 rounded-lg border border-white/10 bg-black/30 text-left"
		>
			{#each standings as player, i (player.name)}
				<li class="flex items-center gap-3 px-4 py-2.5 {player.dead ? 'opacity-50' : ''}">
					<span class="font-display text-surface-500 w-6 text-xl font-extrabold">{i + 1}</span>
					<span class="text-surface-100 flex-1 truncate font-semibold">{player.name}</span>
					<span class="text-surface-400 text-sm">{player.class.name}</span>
					<span
						class="w-16 text-right text-sm {player.dead ? 'text-error-400' : 'text-success-400'}"
					>
						{player.dead ? 'Fallen' : `${player.hp} HP`}
					</span>
				</li>
			{/each}
		</ol>

		<button
			class="border-warning-400 from-warning-600 to-warning-800 font-display h-12 w-full max-w-xs rounded-lg border-2 bg-linear-to-b text-2xl font-extrabold text-white shadow-[0_6px_0_#713f12] transition-transform hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-white/40 focus-visible:outline-none"
			onclick={() => socket.disconnect()}
		>
			Back to lobby
		</button>
	</div>
</div>
