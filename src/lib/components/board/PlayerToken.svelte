<script lang="ts">
	import type { Player } from '$lib/game/player/player.svelte';

	interface Props {
		player: Player;
		isCurrentPlayer?: boolean;
		size?: number;
	}

	let { player, isCurrentPlayer = false, size = 24 }: Props = $props();

	// Generate a consistent color based on player name
	function getPlayerColor(name: string): string {
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
		}
		const hue = Math.abs(hash % 360);
		return `hsl(${hue}, 70%, 50%)`;
	}

	const color = $derived(getPlayerColor(player.name));
	const initials = $derived(
		player.name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2)
	);
</script>

<div
	class="rounded-full border-2 border-white flex items-center justify-center relative font-bold text-white z-10
		{player.dead ? 'opacity-40 grayscale' : ''}
		{player.inShadowRealm ? 'border-[#430067] shadow-[0_0_8px_#6a00a3,0_2px_4px_rgba(0,0,0,0.3)]' : 'shadow-[0_2px_4px_rgba(0,0,0,0.3)]'}"
	style:background-color={color}
	style:width="{size}px"
	style:height="{size}px"
	style:font-size="{size * 0.4}px"
	style:text-shadow="0 1px 2px rgba(0,0,0,0.5)"
	title={`${player.name} (${player.hp} HP)`}
>
	{#if player.class.icon}
		<img
			src={player.class.icon}
			alt=""
			class="rounded-full"
			style="width: {size * 0.8}px; height: {size * 0.8}px; image-rendering: pixelated;"
		/>
	{:else}
		<span class="select-none">{initials}</span>
	{/if}
	{#if isCurrentPlayer}
		<div class="absolute -inset-1 border-2 border-yellow-400 rounded-full animate-pulse"></div>
	{/if}
	{#if player.inShadowRealm}
		<div
			class="absolute -inset-0.5 rounded-full pointer-events-none"
			style="background: radial-gradient(circle, transparent 60%, rgba(106, 0, 163, 0.4) 100%);"
		></div>
	{/if}
</div>
