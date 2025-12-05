<script lang="ts">
	import type { Tile, Position } from '$lib/game/board/types';
	import { TILE_SVGS, TILE_NAMES, TILE_DESCRIPTIONS } from '$lib/game/board/tiles';

	interface Props {
		tile: Tile;
		isHighlighted?: boolean;
		isSelected?: boolean;
		hasPlayer?: boolean;
		onClick?: (position: Position) => void;
	}

	let { tile, isHighlighted = false, isSelected = false, hasPlayer = false, onClick }: Props =
		$props();

	function handleClick() {
		if (tile.walkable && onClick) {
			onClick(tile.position);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			handleClick();
		}
	}
</script>

<button
	class="board-tile"
	class:walkable={tile.walkable}
	class:highlighted={isHighlighted}
	class:selected={isSelected}
	class:has-player={hasPlayer}
	class:blocked={!tile.walkable}
	disabled={!tile.walkable}
	title={tile.walkable ? `${TILE_NAMES[tile.type]}: ${TILE_DESCRIPTIONS[tile.type]}` : ''}
	onclick={handleClick}
	onkeydown={handleKeydown}
>
	<img src={TILE_SVGS[tile.type]} alt={TILE_NAMES[tile.type]} class="tile-image" />
	{#if isHighlighted}
		<div class="highlight-overlay"></div>
	{/if}
	{#if isSelected}
		<div class="selected-overlay"></div>
	{/if}
</button>

<style>
	.board-tile {
		width: 100%;
		height: 100%;
		padding: 0;
		margin: 0;
		border: none;
		background: transparent;
		cursor: default;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.board-tile.walkable {
		cursor: pointer;
	}

	.board-tile.walkable:hover {
		filter: brightness(1.1);
	}

	.board-tile.blocked {
		cursor: not-allowed;
	}

	.tile-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		image-rendering: pixelated;
	}

	.highlight-overlay {
		position: absolute;
		inset: 0;
		background: rgba(255, 255, 0, 0.4);
		border: 2px solid rgba(255, 255, 0, 0.8);
		pointer-events: none;
		animation: pulse 1s ease-in-out infinite;
	}

	.selected-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 255, 0, 0.3);
		border: 2px solid rgba(0, 255, 0, 0.9);
		pointer-events: none;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
	}
</style>
