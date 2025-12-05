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
	class="player-token"
	class:current={isCurrentPlayer}
	class:dead={player.dead}
	class:shadow-realm={player.inShadowRealm}
	style:--player-color={color}
	style:--size={`${size}px`}
	title={`${player.name} (${player.hp} HP)`}
>
	<span class="initials">{initials}</span>
	{#if isCurrentPlayer}
		<div class="current-indicator"></div>
	{/if}
	{#if player.inShadowRealm}
		<div class="shadow-realm-indicator"></div>
	{/if}
</div>

<style>
	.player-token {
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		background: var(--player-color);
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		font-size: calc(var(--size) * 0.4);
		font-weight: bold;
		color: white;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
		z-index: 10;
	}

	.player-token.dead {
		opacity: 0.4;
		filter: grayscale(1);
	}

	.player-token.shadow-realm {
		border-color: #430067;
		box-shadow:
			0 0 8px #6a00a3,
			0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.current-indicator {
		position: absolute;
		inset: -4px;
		border: 2px solid gold;
		border-radius: 50%;
		animation: current-pulse 1.5s ease-in-out infinite;
	}

	.shadow-realm-indicator {
		position: absolute;
		inset: -2px;
		border-radius: 50%;
		background: radial-gradient(circle, transparent 60%, rgba(106, 0, 163, 0.4) 100%);
		pointer-events: none;
	}

	.initials {
		user-select: none;
	}

	@keyframes current-pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.1);
			opacity: 0.7;
		}
	}
</style>
