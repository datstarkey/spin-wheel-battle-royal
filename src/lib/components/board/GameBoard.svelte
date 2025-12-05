<script lang="ts">
	import { BOARD_WIDTH, BOARD_HEIGHT, TILES } from '$lib/game/board/boardData';
	import { gameBoard, getTileAt } from '$lib/game/board/board.svelte';
	import type { Position } from '$lib/game/board/types';
	import { positionsEqual } from '$lib/game/board/types';
	import { currentGame } from '$lib/stores/gameStore.svelte';
	import BoardTile from './BoardTile.svelte';
	import PlayerToken from './PlayerToken.svelte';

	interface Props {
		tileSize?: number;
		onTileClick?: (position: Position) => void;
		showValidMoves?: boolean;
	}

	let { tileSize = 16, onTileClick, showValidMoves = true }: Props = $props();

	const boardWidth = $derived(BOARD_WIDTH * tileSize);
	const boardHeight = $derived(BOARD_HEIGHT * tileSize);

	// Get players at each position for rendering tokens
	function getPlayersAtPosition(pos: Position) {
		const playerNames = gameBoard.getPlayersAt(pos);
		if (!currentGame.value) return [];
		return currentGame.value.players.filter((p) => playerNames.includes(p.name));
	}

	function handleTileClick(position: Position) {
		if (onTileClick) {
			onTileClick(position);
		}
	}
</script>

<div class="game-board-container">
	<div
		class="game-board"
		style:width="{boardWidth}px"
		style:height="{boardHeight}px"
		style:--tile-size="{tileSize}px"
	>
		{#each TILES as row, y (y)}
			{#each row as tile, x (`${x}-${y}`)}
				{@const players = getPlayersAtPosition(tile.position)}
				{@const isHighlighted = showValidMoves && gameBoard.isHighlighted(tile.position)}
				{@const isSelected =
					gameBoard.selectedTile !== null && positionsEqual(gameBoard.selectedTile, tile.position)}
				<div class="tile-wrapper" style:grid-column={x + 1} style:grid-row={y + 1}>
					<BoardTile
						{tile}
						{isHighlighted}
						{isSelected}
						hasPlayer={players.length > 0}
						onClick={handleTileClick}
					/>
					{#if players.length > 0}
						<div class="player-tokens" class:multiple={players.length > 1}>
							{#each players as player (player.name)}
								<PlayerToken
									{player}
									isCurrentPlayer={currentGame.value?.currentPlayer === player}
									size={Math.max(12, tileSize - 4)}
								/>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		{/each}
	</div>
</div>

<style>
	.game-board-container {
		overflow: auto;
		max-width: 100%;
		max-height: 100%;
		border: 2px solid var(--color-surface-500, #666);
		border-radius: 8px;
		background: #000;
	}

	.game-board {
		display: grid;
		grid-template-columns: repeat(48, var(--tile-size));
		grid-template-rows: repeat(48, var(--tile-size));
		gap: 0;
		image-rendering: pixelated;
	}

	.tile-wrapper {
		position: relative;
		width: var(--tile-size);
		height: var(--tile-size);
	}

	.player-tokens {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		gap: 2px;
		z-index: 20;
		pointer-events: none;
	}

	.player-tokens.multiple {
		flex-wrap: wrap;
		max-width: calc(var(--tile-size) * 2);
		justify-content: center;
	}
</style>
