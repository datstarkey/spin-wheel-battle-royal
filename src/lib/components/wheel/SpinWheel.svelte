<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { Wheel } from 'spin-wheel';
	import type { WheelSpinParams } from '#lib/multiplayer/types.js';
	import { quickMode } from './constants';

	interface Props {
		/** Slice sizes follow the weights, so the odds are visible on the wheel itself */
		items: { label: string; weight: number; color: string }[];
		shuffledOrder?: number[];
		spinParams?: WheelSpinParams;
		accent: string;
		onLanded: (label: string) => void;
	}

	let { items, shuffledOrder, spinParams, accent, onLanded }: Props = $props();

	const STUDS = 16;

	let displayItems = $derived(shuffledOrder ? shuffledOrder.map((i) => items[i]) : items);
	let spinning = $state(false);
	let landed = $state(false);

	/** Owns the canvas wheel: builds it once and starts the spin when the server's params arrive */
	const wheel: Attachment<HTMLDivElement> = (container) => {
		const instance = new Wheel(container, {
			items: untrack(() => displayItems).map(({ label, weight }) => ({ label, weight })),
			isInteractive: false,
			itemBackgroundColors: untrack(() => displayItems).map((item) => item.color),
			itemLabelColors: ['#fefce8'],
			itemLabelFont: "'Grenze', Georgia, serif",
			itemLabelFontSizeMax: 44,
			itemLabelRadius: 0.88,
			itemLabelRadiusMax: 0.25,
			itemLabelAlign: 'right',
			itemLabelStrokeColor: 'rgba(0,0,0,0.65)',
			itemLabelStrokeWidth: 3,
			borderWidth: 0,
			lineColor: '#facc15',
			lineWidth: 3,
			radius: 0.97
		});
		instance.onSpin = () => (spinning = true);
		instance.onRest = (event) => {
			spinning = false;
			landed = true;
			onLanded(untrack(() => displayItems)[event.currentIndex].label);
		};

		const params = spinParams;
		if (params) {
			untrack(() => {
				const duration = quickMode.value ? 700 : params.duration;
				instance.spinToItem(
					params.selectedIndex,
					duration,
					true,
					params.numberOfRevolutions,
					params.direction
				);
			});
		}
		return () => instance.remove();
	};
</script>

<div class="relative size-[min(400px,78vw)]" style:--accent={accent}>
	<!-- Gold rim with studs that light up while the wheel turns -->
	<div
		class="from-warning-300 via-warning-600 to-warning-900 absolute -inset-3.5 rounded-full bg-linear-to-br shadow-[0_14px_40px_rgba(0,0,0,0.7),inset_0_2px_3px_rgba(255,255,255,0.4)]
			{landed ? 'shadow-[0_0_60px_color-mix(in_oklab,var(--accent)_60%,transparent)]' : ''}"
	>
		{#each { length: STUDS }, i (i)}
			<span
				class="absolute top-1/2 left-1/2 size-2 rounded-full transition-colors duration-300
					{spinning ? 'bg-warning-50 shadow-[0_0_8px_#fef08a]' : 'bg-warning-950/70'}"
				style:transform="rotate({(360 / STUDS) * i}deg) translateY(calc(min(200px, 39vw) + 7px))"
				style:margin="-4px"
			></span>
		{/each}
	</div>

	<div class="absolute inset-0 overflow-hidden rounded-full bg-black" {@attach wheel}></div>

	{#if landed}
		<span
			class="animate-wheel-burst pointer-events-none absolute -inset-3 rounded-full border-4 border-(--accent) motion-reduce:hidden"
		></span>
	{/if}

	<!-- Blade pointer -->
	<svg
		class="absolute -top-6 left-1/2 z-10 h-12 w-8 -translate-x-1/2 drop-shadow-[0_3px_4px_rgba(0,0,0,0.8)]"
		viewBox="0 0 32 48"
		aria-hidden="true"
	>
		<path d="M16 46 L4 12 L16 2 L28 12 Z" fill="#facc15" stroke="#713f12" stroke-width="2" />
		<path d="M16 40 L9 13 L16 7 Z" fill="#fef9c3" opacity="0.7" />
	</svg>

	<!-- Hub medallion -->
	<div
		class="border-warning-400 from-surface-700 to-surface-950 absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 bg-radial text-3xl text-(--accent) shadow-[0_0_20px_rgba(0,0,0,0.8)]"
	>
		<iconify-icon icon="mdi:sword-cross"></iconify-icon>
	</div>
</div>
