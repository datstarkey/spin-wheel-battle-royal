<script lang="ts">
	import type { Tile, Position } from '$lib/game/board/types';
	import { TILE_NAMES, TILE_DESCRIPTIONS } from '$lib/game/board/tiles';

	interface Props {
		tile: Tile;
		tileSize: number;
		isHighlighted?: boolean;
		isSelected?: boolean;
		hasPlayer?: boolean;
		onClick?: (position: Position) => void;
	}

	let {
		tile,
		tileSize,
		isHighlighted = false,
		isSelected = false,
		hasPlayer = false,
		onClick
	}: Props = $props();

	// Each logical tile is 16x16 pixels in the original SVG (30x30 grid)
	// We show that section of the Map.svg using background-position
	const SVG_PIXELS_PER_TILE = 16;
	const bgPosX = $derived(tile.position.x * SVG_PIXELS_PER_TILE);
	const bgPosY = $derived(tile.position.y * SVG_PIXELS_PER_TILE);

	// The background size needs to scale with tile size
	// Original SVG is 480x480, we scale it to fit our tile grid
	const bgSize = $derived((480 / SVG_PIXELS_PER_TILE) * tileSize); // 30 * tileSize

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
	style:width="{tileSize}px"
	style:height="{tileSize}px"
	style:background-image="url('/Map.svg')"
	style:background-position="-{bgPosX * (tileSize / SVG_PIXELS_PER_TILE)}px -{bgPosY * (tileSize / SVG_PIXELS_PER_TILE)}px"
	style:background-size="{bgSize}px {bgSize}px"
>
	{#if isHighlighted}
		<div class="highlight-overlay"></div>
	{/if}
	{#if isSelected}
		<div class="selected-overlay"></div>
	{/if}
</button>

<style>
	.board-tile {
		padding: 0;
		margin: 0;
		border: none;
		box-sizing: border-box;
		cursor: default;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		image-rendering: pixelated;
		background-repeat: no-repeat;
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
