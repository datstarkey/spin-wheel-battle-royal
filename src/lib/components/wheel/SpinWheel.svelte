<script module lang="ts">
	import { localStorageStore } from '$lib/stores/localStorageStore.svelte';

	export const quickMode = localStorageStore<boolean>('wheel-quick-mode', false);
</script>

<script lang="ts">
	import { Wheel } from 'spin-wheel';
	import { onDestroy, onMount, type Snippet } from 'svelte';
	import Icon from '../Icon.svelte';
	import type { SpinWheelItem } from './types';
	import type { WheelSpinParams } from '$lib/multiplayer/types';

	import { shuffle } from './utils';

	let wheelEl = $state<HTMLDivElement>();

	interface Props {
		items: SpinWheelItem[];
		maxSpeed?: number;
		minSpeed?: number;
		rotationResistance?: number;
		removeOnWinner?: boolean;
		onWinner?: (item: SpinWheelItem, index: number) => void;
		/** If true, skip calling item.onWin() — used in multiplayer where closures don't exist on client */
		skipOnWin?: boolean;
		onSpin?: () => void;
		showSpin?: boolean;
		canSpin?: boolean;
		buttonText?: string;
		layout?: 'stacked' | 'side-by-side';
		children?: Snippet<[{ spin: (speed?: number) => void }]>;
		/** Server-provided spin parameters for synchronized spins */
		syncSpinParams?: WheelSpinParams;
		/** Called instead of local spin when in sync mode — requests server to initiate spin */
		onRequestSpin?: () => void;
		/** Called after the wheel comes to rest in sync mode */
		onSpinComplete?: () => void;
		/** Server-provided item ordering (array of original indices) */
		shuffledOrder?: number[];
	}

	let {
		items = $bindable(),
		maxSpeed = 2000,
		minSpeed = 500,
		rotationResistance: rotationResistanceProp,
		removeOnWinner = false,
		onSpin = () => {},
		onWinner = () => {},
		skipOnWin = false,
		showSpin = true,
		canSpin = true,
		buttonText = 'Spin',
		layout = 'stacked',
		children,
		syncSpinParams = undefined,
		onRequestSpin = undefined,
		onSpinComplete = undefined,
		shuffledOrder = undefined
	}: Props = $props();

	let rotationResistance = $derived(rotationResistanceProp ?? (maxSpeed / minSpeed) * 50 * -1);

	// Display items: derived from server shuffle order, or shuffled randomly for local mode.
	const localShuffled = shuffle([...items]);
	let displayItems = $derived(
		shuffledOrder ? shuffledOrder.map((i: number) => items[i]) : localShuffled
	);

	let wheel = $state<Wheel>();
	let hasSpun = $state(false);
	let selected: SpinWheelItem | null = $state(null);

	let spinning = $state(false);

	// Battle arena theme colors
	const wheelColors = [
		'#b91c1c', // primary-700 crimson
		'#1e293b', // surface-800 dark
		'#3b82f6', // secondary-500 blue
		'#a855f7', // tertiary-500 purple
		'#f59e0b', // warning-500 gold
		'#10b981' // success-500 emerald
	];

	function random(min: number, max: number) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}

	function shuff() {
		items = shuffle(items);
		if (wheel) {
			wheel.items = displayItems;
		}
	}

	function spin(speed = 0) {
		if (quickMode.value) maxSpeed = 100;
		if (speed == 0) speed = random(minSpeed, maxSpeed);
		if (wheel) {
			wheel.items = displayItems;
			hasSpun = true;
			onSpin?.();
			wheel.spin(speed);
		}
	}

	function handleSpinClick() {
		if (onRequestSpin) {
			// Sync mode: ask server to initiate the spin
			onRequestSpin();
		} else {
			// Local mode: spin directly
			spin();
		}
	}

	// Watch for server-provided spin params and execute deterministic spin
	$effect(() => {
		if (syncSpinParams && wheel) {
			hasSpun = true;
			onSpin?.();
			wheel.spinToItem(
				syncSpinParams.selectedIndex,
				syncSpinParams.duration,
				true,
				syncSpinParams.numberOfRevolutions,
				syncSpinParams.direction
			);
		}
	});

	function win(item: SpinWheelItem, index: number) {
		if (!skipOnWin && item.onWin) item.onWin();
		onWinner(item, index);
	}

	onMount(() => {
		wheel = new Wheel(wheelEl, {
			items: displayItems,
			isInteractive: false,
			itemBackgroundColors: wheelColors,
			itemLabelColors: ['#f1f5f9'], // surface-100 for readability
			borderColor: '#dc2626', // primary-600 crimson
			borderWidth: 3,
			lineColor: '#0f172a', // surface-950
			lineWidth: 1,
			radius: 0.9,
			itemLabelRadius: 0.9,
			itemLabelRadiusMax: 0,
			itemLabelFontSizeMax: 2000,
			itemLabelRotation: 0,
			itemLabelAlign: 'right',

			rotationSpeedMax: maxSpeed,
			rotationResistance: rotationResistance,
			itemLabelFont: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
			itemLabelStrokeColor: '#000',
			itemLabelStrokeWidth: 1
		});

		wheel.onSpin = () => {
			spinning = true;
		};

		wheel.onRest = (event) => {
			spinning = false;
			selected = displayItems[event.currentIndex];
			if (selected) win(selected, event.currentIndex);
			if (removeOnWinner) {
				items = items.filter((item) => item != selected);
			}
			onSpinComplete?.();
		};

		wheel.onCurrentIndexChange = (event) => {
			selected = displayItems[event.currentIndex];
		};
	});

	onDestroy(() => {
		wheel?.remove();
	});
</script>

<!-- Layout wrapper: side-by-side or stacked -->
<div class={layout === 'side-by-side' ? 'flex items-center gap-8' : ''}>
	<!-- Wheel Container with Battle Arena Frame -->
	<div class="relative mx-auto w-fit shrink-0">
		<!-- Outer decorative frame -->
		<div
			class="border-surface-600/30 from-surface-900/50 to-surface-950/50 absolute -inset-4 rounded-full border-2 bg-gradient-to-br via-transparent"
		></div>
		<div
			class="border-primary-500/20 absolute -inset-2 rounded-full border {spinning
				? 'animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.3)]'
				: ''}"
		></div>

		<!-- Corner accent brackets -->
		<div
			class="border-primary-500/50 pointer-events-none absolute -top-2 -left-2 h-6 w-6 border-t-2 border-l-2"
		></div>
		<div
			class="border-primary-500/50 pointer-events-none absolute -top-2 -right-2 h-6 w-6 border-t-2 border-r-2"
		></div>
		<div
			class="border-primary-500/50 pointer-events-none absolute -bottom-2 -left-2 h-6 w-6 border-b-2 border-l-2"
		></div>
		<div
			class="border-primary-500/50 pointer-events-none absolute -right-2 -bottom-2 h-6 w-6 border-r-2 border-b-2"
		></div>

		<!-- Wheel canvas -->
		<div bind:this={wheelEl} class="relative z-10 h-[500px] w-[500px]"></div>

		<!-- Pointer indicator -->
		<div class="absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-1">
			<div class="relative">
				<Icon
					icon="mdi:menu-down"
					class="text-primary-500 text-4xl drop-shadow-[0_0_8px_rgba(220,38,38,0.6)]"
				/>
				<div class="absolute inset-0 animate-pulse">
					<Icon icon="mdi:menu-down" class="text-primary-400/50 text-4xl" />
				</div>
			</div>
		</div>

		<!-- Center hub decoration -->
		<div
			class="pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
		>
			<div
				class="border-primary-500/60 from-surface-800 to-surface-950 h-12 w-12 rounded-full border-2 bg-gradient-to-br shadow-[0_0_15px_rgba(220,38,38,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)]"
			></div>
		</div>
	</div>

	<!-- Controls Panel (appears beside wheel in side-by-side mode, or below in stacked) -->
	<div class={layout === 'side-by-side' ? 'flex flex-col gap-4' : ''}>
		<!-- Selected Item Display -->
		{#if hasSpun && selected}
			<div class={layout === 'side-by-side' ? '' : 'mx-auto mt-6'}>
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
		{#if showSpin && canSpin && wheel && displayItems.length > 0}
			<div
				class={layout === 'side-by-side'
					? 'flex flex-col items-stretch gap-3'
					: 'mx-auto mt-6 mb-4 flex max-w-sm flex-col items-center gap-3'}
			>
				{#if children}{@render children({ spin })}{/if}

				<div class={layout === 'side-by-side' ? 'flex flex-col gap-3' : 'flex gap-3'}>
					{#if !shuffledOrder}
						<button
							onclick={() => shuff()}
							disabled={spinning}
							class="group border-warning-500/50 from-warning-600 to-warning-700 hover:border-warning-400 hover:from-warning-500 hover:to-warning-600 relative overflow-hidden rounded border bg-gradient-to-br px-5 py-2.5 font-semibold tracking-wider text-white uppercase shadow-lg transition-all hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
						>
							<span class="relative z-10 flex items-center justify-center gap-2">
								<Icon icon="mdi:shuffle-variant" class="text-lg" />
								Shuffle
							</span>
						</button>
					{/if}

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
</div>
