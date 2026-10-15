<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { WheelSpinParams } from '#lib/multiplayer/types.js';
	import { WHEEL_COLORS, quickMode } from './constants';

	interface Props {
		labels: string[];
		/** Server-provided ordering (indices into labels) so every client shows the same strip */
		shuffledOrder?: number[];
		/** Present once the server picked a result; starts the spin */
		spinParams?: WheelSpinParams;
		/** Accent colour for the selection window */
		accent: string;
		onLanded: (label: string) => void;
	}

	let { labels, shuffledOrder, spinParams, accent, onLanded }: Props = $props();

	const ROW_HEIGHT = 76;
	const VISIBLE_ROWS = 3;
	const CENTER_ROW = Math.floor(VISIBLE_ROWS / 2);
	const REVOLUTIONS = 5;
	// Enough copies of the strip to cover the start cycle, the full spin and the rows below the window
	const STRIP_COPIES = REVOLUTIONS + 4;

	let order = $derived(shuffledOrder ?? labels.map((_, i) => i));
	let strip = $derived(
		Array.from({ length: STRIP_COPIES }, (_, copy) =>
			order.map((labelIndex, slot) => ({ id: `${copy}-${slot}`, slot, label: labels[labelIndex] }))
		).flat()
	);

	// Start one cycle in so there are rows above the window before the first spin
	let offset = $derived(ROW_HEIGHT * order.length - ROW_HEIGHT * CENTER_ROW);
	let blur = $state(0);
	let landedSlot = $state<number | null>(null);
	let frame = 0;

	const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;

	function spinTo(slot: number) {
		const cycle = order.length * ROW_HEIGHT;
		const start = cycle - ROW_HEIGHT * CENTER_ROW;
		const target = start + REVOLUTIONS * cycle + slot * ROW_HEIGHT;
		const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const duration = quickMode.value || reduceMotion ? 450 : 3400;
		const begin = performance.now();
		let previous = start;

		landedSlot = null;
		const step = (now: number) => {
			const t = Math.min(1, (now - begin) / duration);
			offset = start + (target - start) * easeOutQuart(t);
			// Motion blur follows speed, so the strip sharpens as it slows into place
			blur = reduceMotion ? 0 : Math.min(6, Math.abs(offset - previous) / 12);
			previous = offset;
			if (t < 1) {
				frame = requestAnimationFrame(step);
				return;
			}
			blur = 0;
			landedSlot = slot;
			onLanded(labels[order[slot]]);
		};
		frame = requestAnimationFrame(step);
	}

	/** Runs when the server's spin parameters arrive (or are already present on rejoin) */
	const spinWhenReady: Attachment = () => {
		const slot = spinParams?.selectedIndex;
		// Only spinParams should restart the spin, not the quick-mode toggle or labels it reads
		if (slot !== undefined) untrack(() => spinTo(slot));
		return () => cancelAnimationFrame(frame);
	};
</script>

<div class="relative w-full max-w-md" style:--accent={accent}>
	<!-- Carved frame -->
	<div
		class="border-warning-700/60 from-surface-800 to-surface-950 rounded-xl border-2 bg-linear-to-b p-2 shadow-[inset_0_2px_0_rgba(255,255,255,0.06),0_12px_30px_rgba(0,0,0,0.6)]"
	>
		<div
			class="relative overflow-hidden rounded-lg bg-black"
			style:height="{ROW_HEIGHT * VISIBLE_ROWS}px"
		>
			<div
				class="absolute inset-x-0 top-0 will-change-transform"
				{@attach spinWhenReady}
				style:transform="translateY({-offset}px)"
				style:filter={blur > 0.3 ? `blur(${blur}px)` : undefined}
			>
				{#each strip as row (row.id)}
					{@const color = WHEEL_COLORS[row.slot % WHEEL_COLORS.length]}
					<div class="flex items-center gap-4 px-5" style:height="{ROW_HEIGHT}px">
						<div
							class="flex h-[64px] w-full items-center gap-4 rounded-md border border-white/8 bg-linear-to-r from-white/7 to-white/2 px-4"
						>
							<!-- Gem: tells neighbouring options apart at a glance while the strip moves -->
							<span
								class="size-6 shrink-0 rotate-45 rounded-[5px] border border-white/30 shadow-[inset_0_2px_3px_rgba(255,255,255,0.45),0_0_10px_var(--gem)]"
								style:--gem={color}
								style:background="radial-gradient(circle at 30% 30%, white -40%, {color} 55%)"
							></span>
							<span
								class="font-display text-surface-50 truncate text-2xl leading-none font-extrabold"
								>{row.label}</span
							>
						</div>
					</div>
				{/each}
			</div>

			<!-- Shade the rows that aren't selectable -->
			<div
				class="pointer-events-none absolute inset-0 bg-linear-to-b from-black/85 via-transparent to-black/85"
			></div>

			<!-- Selection window -->
			<div
				class="pointer-events-none absolute inset-x-1 rounded-md border-2 border-(--accent) transition-shadow duration-300
					{landedSlot !== null
					? 'shadow-[0_0_36px_color-mix(in_oklab,var(--accent)_70%,transparent),inset_0_0_24px_color-mix(in_oklab,var(--accent)_40%,transparent)]'
					: 'shadow-[0_0_16px_color-mix(in_oklab,var(--accent)_40%,transparent)]'}"
				style:top="{ROW_HEIGHT * CENTER_ROW + 4}px"
				style:height="{ROW_HEIGHT - 8}px"
			>
				{#if landedSlot !== null}
					<span
						class="animate-wheel-burst absolute inset-0 rounded-md border-2 border-(--accent) motion-reduce:hidden"
					></span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Pointer gems either side of the window -->
	{#each ['-left-2', '-right-2'] as side (side)}
		<span
			class="pointer-events-none absolute top-1/2 size-5 -translate-y-1/2 rotate-45 border-2 border-white/60 bg-(--accent) shadow-[0_0_14px_var(--accent)] {side}"
		></span>
	{/each}
</div>
