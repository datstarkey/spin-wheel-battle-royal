<script module lang="ts">
	import { quickMode } from './SpinWheel.svelte';
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import Icon from '../Icon.svelte';
	import type { SpinWheelItem } from './types';
	import type { WheelSpinParams } from '$lib/multiplayer/types';
	import { shuffle } from './utils';

	interface Props {
		items: SpinWheelItem[];
		removeOnWinner?: boolean;
		onWinner?: (item: SpinWheelItem, index: number) => void;
		skipOnWin?: boolean;
		onSpin?: () => void;
		showSpin?: boolean;
		canSpin?: boolean;
		buttonText?: string;
		syncSpinParams?: WheelSpinParams;
		onRequestSpin?: () => void;
		onSpinComplete?: () => void;
		shuffledOrder?: number[];
	}

	let {
		items = $bindable(),
		removeOnWinner = false,
		onSpin = () => {},
		onWinner = () => {},
		skipOnWin = false,
		showSpin = true,
		canSpin = true,
		buttonText = 'Spin',
		syncSpinParams = undefined,
		onRequestSpin = undefined,
		onSpinComplete = undefined,
		shuffledOrder = undefined
	}: Props = $props();

	// Battle arena theme colors for item backgrounds
	const slotColors = [
		'#b91c1c', // primary-700 crimson
		'#1e293b', // surface-800 dark
		'#3b82f6', // secondary-500 blue
		'#a855f7', // tertiary-500 purple
		'#f59e0b', // warning-500 gold
		'#10b981' // success-500 emerald
	];

	// Display items: server-shuffled or locally shuffled
	const localShuffled = shuffle([...items]);
	let displayItems = $derived(
		shuffledOrder ? shuffledOrder.map((i: number) => items[i]) : localShuffled
	);

	// How many items visible in the viewport (always odd for center highlight)
	const VISIBLE_COUNT = 3;
	const ITEM_HEIGHT = 80; // px per item slot
	const VIEWPORT_HEIGHT = VISIBLE_COUNT * ITEM_HEIGHT;

	// Revolutions-based spin: pick random number of full cycles, then
	// animate with constant deceleration (fast start, gradual slowdown).
	const MIN_REVOLUTIONS = 3;
	const MAX_REVOLUTIONS = 6;
	const REPEAT_COUNT = MAX_REVOLUTIONS + 4; // enough strip to cover max spin + starting position

	let reelItems = $derived.by(() => {
		const result: { item: SpinWheelItem; displayIndex: number }[] = [];
		for (let r = 0; r < REPEAT_COUNT; r++) {
			for (let i = 0; i < displayItems.length; i++) {
				result.push({ item: displayItems[i], displayIndex: i });
			}
		}
		return result;
	});

	let hasSpun = $state(false);
	let spinning = $state(false);
	let selected = $state<SpinWheelItem | null>(null);
	let currentOffset = $state(0);
	let animFrameId = $state(0);

	const centerSlotOffset = Math.floor(VISIBLE_COUNT / 2);

	function getColorForIndex(idx: number): string {
		return slotColors[idx % slotColors.length];
	}

	function animateSpin(targetDisplayIndex: number, revolutions: number, durationMs: number) {
		spinning = true;
		hasSpun = true;
		onSpin?.();

		const itemCount = displayItems.length;
		const cycleLength = itemCount * ITEM_HEIGHT;

		// Reset to a known start position (cycle 2) so we always have room ahead
		const startOffset = 2 * cycleLength;
		currentOffset = startOffset;

		// Target: revolutions full cycles + land on targetDisplayIndex, centered
		const targetOffset =
			(2 + revolutions) * cycleLength + (targetDisplayIndex - centerSlotOffset) * ITEM_HEIGHT;
		const totalDistance = targetOffset - startOffset;

		// Constant deceleration physics:
		// distance = v0 * t - 0.5 * a * t^2, where v0 = 2*distance/time (so we stop at t=duration)
		const duration = durationMs / 1000;
		const v0 = (2 * totalDistance) / duration;

		const startTime = performance.now();

		function tick(now: number) {
			const elapsed = Math.min((now - startTime) / 1000, duration);
			const progress = elapsed / duration;

			// position = v0*t - 0.5*(v0/duration)*t^2 = v0*t*(1 - t/(2*duration))
			const pos = v0 * elapsed * (1 - elapsed / (2 * duration));

			currentOffset = startOffset + pos;

			// Live preview: which item is in the center slot
			const centerItemIndex = Math.round(currentOffset / ITEM_HEIGHT) + centerSlotOffset;
			const wrappedIndex = ((centerItemIndex % itemCount) + itemCount) % itemCount;
			selected = displayItems[wrappedIndex];

			if (progress < 1) {
				animFrameId = requestAnimationFrame(tick);
			} else {
				currentOffset = targetOffset;
				spinning = false;
				selected = displayItems[targetDisplayIndex];

				if (!skipOnWin && selected.onWin) selected.onWin();
				onWinner(selected, targetDisplayIndex);

				if (removeOnWinner) {
					items = items.filter((item) => item !== selected);
				}
				onSpinComplete?.();
			}
		}

		animFrameId = requestAnimationFrame(tick);
	}

	function spin() {
		if (spinning) return;
		const revolutions = MIN_REVOLUTIONS + Math.random() * (MAX_REVOLUTIONS - MIN_REVOLUTIONS);
		const duration = quickMode.value ? 400 : 2000 + Math.random() * 1500; // 2-3.5s
		const targetIndex = Math.floor(Math.random() * displayItems.length);
		animateSpin(targetIndex, revolutions, duration);
	}

	function handleSpinClick() {
		if (onRequestSpin) {
			onRequestSpin();
		} else {
			spin();
		}
	}

	// Watch for server-provided spin params (multiplayer sync)
	$effect(() => {
		if (syncSpinParams) {
			const revolutions = 4;
			const duration = quickMode.value ? 400 : 2500;
			animateSpin(syncSpinParams.selectedIndex, revolutions, duration);
		}
	});

	onDestroy(() => {
		if (animFrameId) cancelAnimationFrame(animFrameId);
	});
</script>

<!-- Slot Reel Container -->
<div class="flex flex-col items-center">
	<!-- Reel viewport with battle arena frame -->
	<div class="relative mx-auto w-full max-w-md">
		<!-- Outer decorative frame -->
		<div
			class="border-surface-600/30 from-surface-900/50 to-surface-950/50 absolute -inset-3 rounded-lg border-2 bg-gradient-to-br via-transparent"
		></div>
		<div
			class="border-primary-500/20 absolute -inset-1.5 rounded-lg border {spinning
				? 'animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.3)]'
				: ''}"
		></div>

		<!-- Corner accent brackets -->
		<div
			class="border-primary-500/50 pointer-events-none absolute -top-1.5 -left-1.5 h-5 w-5 border-t-2 border-l-2"
		></div>
		<div
			class="border-primary-500/50 pointer-events-none absolute -top-1.5 -right-1.5 h-5 w-5 border-t-2 border-r-2"
		></div>
		<div
			class="border-primary-500/50 pointer-events-none absolute -bottom-1.5 -left-1.5 h-5 w-5 border-b-2 border-l-2"
		></div>
		<div
			class="border-primary-500/50 pointer-events-none absolute -right-1.5 -bottom-1.5 h-5 w-5 border-r-2 border-b-2"
		></div>

		<!-- Reel window -->
		<div
			class="bg-surface-950 border-surface-700/50 relative z-10 overflow-hidden rounded-lg border"
			style="height: {VIEWPORT_HEIGHT}px;"
		>
			<!-- Top fade gradient -->
			<div
				class="from-surface-950 pointer-events-none absolute inset-x-0 top-0 z-30 h-16 bg-gradient-to-b to-transparent"
			></div>
			<!-- Bottom fade gradient -->
			<div
				class="to-surface-950 pointer-events-none absolute inset-x-0 bottom-0 z-30 h-16 bg-gradient-to-b from-transparent"
			></div>

			<!-- Center highlight row -->
			<div
				class="border-primary-500/70 pointer-events-none absolute inset-x-0 z-20 border-y-2 shadow-[0_0_20px_rgba(220,38,38,0.25),inset_0_0_20px_rgba(220,38,38,0.1)]"
				style="top: {centerSlotOffset * ITEM_HEIGHT}px; height: {ITEM_HEIGHT}px;"
			>
				<!-- Left arrow indicator -->
				<div class="absolute top-1/2 -left-0.5 -translate-y-1/2">
					<Icon
						icon="mdi:menu-right"
						class="text-primary-500 text-2xl drop-shadow-[0_0_8px_rgba(220,38,38,0.6)]"
					/>
				</div>
				<!-- Right arrow indicator -->
				<div class="absolute top-1/2 -right-0.5 -translate-y-1/2">
					<Icon
						icon="mdi:menu-left"
						class="text-primary-500 text-2xl drop-shadow-[0_0_8px_rgba(220,38,38,0.6)]"
					/>
				</div>
			</div>

			<!-- Scrolling strip -->
			<div
				class="absolute inset-x-0 will-change-transform"
				style="transform: translateY(-{currentOffset}px);"
			>
				{#each reelItems as { item, displayIndex }, i (i)}
					<div
						class="flex items-center justify-center border-b border-white/5 px-6 font-mono text-lg font-bold tracking-wider text-white uppercase"
						style="height: {ITEM_HEIGHT}px; background: {getColorForIndex(displayIndex)};"
					>
						<span class="truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
							{item.label}
						</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Selected Item Display -->
	{#if hasSpun && selected && !spinning}
		<div class="mx-auto mt-6">
			<div
				class="border-primary-500/30 bg-surface-900/95 relative overflow-hidden rounded border px-4 py-3 shadow-[0_0_20px_rgba(220,38,38,0.15)]"
			>
				<div
					class="from-primary-500/5 to-primary-500/5 pointer-events-none absolute inset-0 bg-gradient-to-r via-transparent"
				></div>
				<div class="flex items-center justify-center gap-2 whitespace-nowrap">
					<Icon icon="mdi:trophy" class="text-warning-400 shrink-0 text-lg" />
					<span class="text-surface-100 text-lg font-bold tracking-wide uppercase"
						>{selected.label}</span
					>
				</div>
			</div>
		</div>
	{/if}

	<!-- Action Buttons -->
	{#if showSpin && canSpin && displayItems.length > 0}
		<div class="mx-auto mt-6 mb-4 flex max-w-sm flex-col items-center gap-3">
			<div class="flex gap-3">
				<button
					onclick={() => handleSpinClick()}
					disabled={spinning}
					class="group border-primary-500/50 from-primary-600 to-primary-700 hover:border-primary-400 hover:from-primary-500 hover:to-primary-600 relative overflow-hidden rounded border bg-gradient-to-br px-6 py-2.5 font-bold tracking-wider text-white uppercase shadow-lg transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:cursor-not-allowed disabled:opacity-50
					{spinning ? 'animate-pulse' : ''}"
				>
					<span class="relative z-10 flex items-center justify-center gap-2">
						{#if spinning}
							<Icon icon="mdi:loading" class="animate-spin text-lg" />
							Spinning...
						{:else}
							<Icon icon="mdi:play" class="text-lg" />
							{buttonText}
						{/if}
					</span>
				</button>
			</div>
		</div>
	{/if}
</div>
