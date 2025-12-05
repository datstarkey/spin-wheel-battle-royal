<script lang="ts">
	import { BOARD_WIDTH, BOARD_HEIGHT, TILES } from '$lib/game/board/boardData';
	import { gameBoard } from '$lib/game/board/board.svelte';
	import type { Position, Tile } from '$lib/game/board/types';
	import { positionsEqual } from '$lib/game/board/types';
	import {
		currentGame,
		getIsMovementMode,
		moveCurrentPlayerTo
	} from '$lib/stores/gameStore.svelte';
	import PlayerToken from './PlayerToken.svelte';

	interface Props {
		tileSize?: number;
		onTileClick?: (position: Position) => void;
		showValidMoves?: boolean;
	}

	// Default tile size of 16px to match SVG pixels (30x30 grid = 480px)
	let { tileSize = 16, onTileClick, showValidMoves = true }: Props = $props();

	// Derive movement mode state
	let isMovementMode = $derived(getIsMovementMode());

	// Only render interactive overlays for walkable tiles
	const walkableTiles = $derived(
		TILES.flat().filter((tile: Tile) => tile.walkable)
	);

	// Pan and zoom state
	let scale = $state(0.8);
	let panX = $state(0);
	let panY = $state(0);
	let isPanning = $state(false);
	let startPanX = 0;
	let startPanY = 0;
	let startMouseX = 0;
	let startMouseY = 0;

	// Zoom limits
	const MIN_SCALE = 0.3;
	const MAX_SCALE = 3;

	const boardWidth = $derived(BOARD_WIDTH * tileSize);
	const boardHeight = $derived(BOARD_HEIGHT * tileSize);

	// Reference to the container element
	let containerEl: HTMLDivElement | null = $state(null);

	// Currently hovered tile for debug info
	let hoveredTile: Tile | null = $state(null);

	// Get players at each position for rendering tokens
	function getPlayersAtPosition(pos: Position) {
		const playerNames = gameBoard.getPlayersAt(pos);
		if (!currentGame.value) return [];
		return currentGame.value.players.filter((p) => playerNames.includes(p.name));
	}

	function handleTileClick(position: Position) {
		// If in movement mode, try to move the player
		if (isMovementMode) {
			moveCurrentPlayerTo(position);
			return;
		}

		// Otherwise, call the external handler if provided
		if (onTileClick) {
			onTileClick(position);
		}
	}

	// Handle mouse down for panning
	function handleMouseDown(e: MouseEvent) {
		if (e.button === 0 || e.button === 1) {
			isPanning = true;
			startPanX = panX;
			startPanY = panY;
			startMouseX = e.clientX;
			startMouseY = e.clientY;
			e.preventDefault();
		}
	}

	// Handle mouse move for panning
	function handleMouseMove(e: MouseEvent) {
		if (!isPanning) return;
		const dx = e.clientX - startMouseX;
		const dy = e.clientY - startMouseY;
		panX = startPanX + dx;
		panY = startPanY + dy;
	}

	// Handle mouse up to stop panning
	function handleMouseUp() {
		isPanning = false;
	}

	// Handle touch events for mobile
	let lastTouchDist = 0;
	let lastTouchCenterX = 0;
	let lastTouchCenterY = 0;

	function getTouchDistance(touches: TouchList): number {
		if (touches.length < 2) return 0;
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length === 1) {
			isPanning = true;
			startPanX = panX;
			startPanY = panY;
			startMouseX = e.touches[0].clientX;
			startMouseY = e.touches[0].clientY;
		} else if (e.touches.length === 2) {
			lastTouchDist = getTouchDistance(e.touches);
			lastTouchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
			lastTouchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
		}
	}

	function handleTouchMove(e: TouchEvent) {
		e.preventDefault();

		if (e.touches.length === 1 && isPanning) {
			const dx = e.touches[0].clientX - startMouseX;
			const dy = e.touches[0].clientY - startMouseY;
			panX = startPanX + dx;
			panY = startPanY + dy;
		} else if (e.touches.length === 2 && containerEl) {
			const newDist = getTouchDistance(e.touches);
			const newCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
			const newCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

			if (lastTouchDist > 0) {
				const scaleChange = newDist / lastTouchDist;
				const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * scaleChange));

				if (newScale !== scale) {
					const rect = containerEl.getBoundingClientRect();
					const centerX = newCenterX - rect.left;
					const centerY = newCenterY - rect.top;
					const scaleRatio = newScale / scale;
					panX = centerX - (centerX - panX) * scaleRatio;
					panY = centerY - (centerY - panY) * scaleRatio;
					scale = newScale;
				}
			}

			// Also pan while pinching
			panX += newCenterX - lastTouchCenterX;
			panY += newCenterY - lastTouchCenterY;

			lastTouchDist = newDist;
			lastTouchCenterX = newCenterX;
			lastTouchCenterY = newCenterY;
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (e.touches.length === 0) {
			isPanning = false;
		}
		lastTouchDist = 0;
	}

	// Center board initially
	$effect(() => {
		if (typeof window !== 'undefined') {
			panX = (window.innerWidth - boardWidth * scale) / 2;
			panY = (window.innerHeight - 60 - boardHeight * scale) / 2;
		}
	});

	// Add wheel listener with passive: false to allow preventDefault
	$effect(() => {
		if (!containerEl) return;

		function onWheel(e: WheelEvent) {
			e.preventDefault();

			if (!containerEl) return;

			const rect = containerEl.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;

			// Calculate zoom (smaller multiplier = less sensitive)
			const delta = e.deltaY > 0 ? 0.95 : 1.05;
			const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * delta));

			if (newScale !== scale) {
				// Zoom toward mouse position
				const scaleRatio = newScale / scale;
				panX = mouseX - (mouseX - panX) * scaleRatio;
				panY = mouseY - (mouseY - panY) * scaleRatio;
				scale = newScale;
			}
		}

		containerEl.addEventListener('wheel', onWheel, { passive: false });

		return () => {
			containerEl?.removeEventListener('wheel', onWheel);
		};
	});
</script>

<svelte:window onmouseup={handleMouseUp} onmousemove={handleMouseMove} />

<!-- Fullscreen pannable/zoomable board -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={containerEl}
	class="fixed inset-0 top-[60px] z-0 overflow-hidden bg-black"
	onmousedown={handleMouseDown}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
>
	<div
		class="origin-top-left will-change-transform"
		style:transform="translate({panX}px, {panY}px) scale({scale})"
	>
		<!-- Single background image for the entire map -->
		<div
			class="relative"
			style:width="{boardWidth}px"
			style:height="{boardHeight}px"
			style:background-image="url('/Map.svg')"
			style:background-size="{boardWidth}px {boardHeight}px"
			style:image-rendering="pixelated"
		>
			<!-- Only render overlays for walkable tiles (much fewer elements) -->
			{#each walkableTiles as tile (tile.position.x + '-' + tile.position.y)}
				{@const players = getPlayersAtPosition(tile.position)}
				{@const isHighlighted = showValidMoves && gameBoard.isHighlighted(tile.position)}
				{@const isSelected =
					gameBoard.selectedTile !== null &&
					positionsEqual(gameBoard.selectedTile, tile.position)}
				<button
					class="absolute box-border border border-transparent bg-transparent p-0 hover:border-white/50"
					class:cursor-pointer={tile.walkable}
					class:hover:brightness-110={tile.walkable}
					style:left="{tile.position.x * tileSize}px"
					style:top="{tile.position.y * tileSize}px"
					style:width="{tileSize}px"
					style:height="{tileSize}px"
					onclick={() => handleTileClick(tile.position)}
					onmouseenter={() => (hoveredTile = tile)}
					onmouseleave={() => (hoveredTile = null)}
				>
					{#if isHighlighted}
						<div class="absolute inset-0 animate-pulse border-2 border-yellow-400/80 bg-yellow-400/40"></div>
					{/if}
					{#if isSelected}
						<div class="absolute inset-0 border-2 border-green-400/90 bg-green-400/30"></div>
					{/if}
				</button>
				{#if players.length > 0}
					<div
						class="pointer-events-none absolute z-20 flex -translate-x-1/2 -translate-y-1/2 gap-0.5"
						class:flex-wrap={players.length > 1}
						class:justify-center={players.length > 1}
						style:left="{tile.position.x * tileSize + tileSize / 2}px"
						style:top="{tile.position.y * tileSize + tileSize / 2}px"
						style:max-width="{tileSize * 2}px"
					>
						{#each players as player (player.name)}
							<PlayerToken
								{player}
								isCurrentPlayer={currentGame.value?.currentPlayer === player}
								size={Math.max(12, tileSize - 4)}
							/>
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	</div>

	<!-- Zoom controls -->
	<div class="absolute bottom-4 right-4 flex flex-col gap-2">
		<button
			class="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-800/80 text-xl text-surface-100 backdrop-blur-sm transition hover:bg-surface-700"
			onclick={() => (scale = Math.min(MAX_SCALE, scale * 1.2))}
			aria-label="Zoom in"
		>
			+
		</button>
		<button
			class="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-800/80 text-xl text-surface-100 backdrop-blur-sm transition hover:bg-surface-700"
			onclick={() => (scale = Math.max(MIN_SCALE, scale * 0.8))}
			aria-label="Zoom out"
		>
			−
		</button>
		<button
			class="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-800/80 text-xs text-surface-100 backdrop-blur-sm transition hover:bg-surface-700"
			onclick={() => {
				scale = 0.8;
				panX = (window.innerWidth - boardWidth * scale) / 2;
				panY = (window.innerHeight - 60 - boardHeight * scale) / 2;
			}}
			aria-label="Reset view"
		>
			<iconify-icon icon="mdi:fit-to-screen" width="20"></iconify-icon>
		</button>
	</div>

	<!-- Scale indicator -->
	<div
		class="absolute bottom-4 left-4 rounded bg-surface-800/80 px-2 py-1 text-xs text-surface-300 backdrop-blur-sm"
	>
		{Math.round(scale * 100)}%
	</div>

	<!-- Tile debug info -->
	{#if hoveredTile}
		<div
			class="absolute bottom-16 right-4 rounded-lg bg-surface-800/90 px-3 py-2 text-xs text-surface-100 backdrop-blur-sm"
		>
			<div class="font-bold text-surface-50">Tile Info</div>
			<div class="mt-1 space-y-0.5 text-surface-300">
				<div>Position: ({hoveredTile.position.x}, {hoveredTile.position.y})</div>
				<div>Type: <span class="text-primary-400">{hoveredTile.type}</span></div>
				<div>Walkable: {hoveredTile.walkable ? 'Yes' : 'No'}</div>
				<div>Connections: {hoveredTile.connections.join(', ') || 'None'}</div>
				{#if hoveredTile.spawnZone}
					<div>Spawn Zone: {hoveredTile.spawnZone}</div>
				{/if}
				{#if hoveredTile.teleporterGroup !== undefined}
					<div>Teleporter Group: {hoveredTile.teleporterGroup}</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
