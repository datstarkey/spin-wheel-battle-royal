<script lang="ts">
	import { Wheel } from 'spin-wheel';
	import { onDestroy, onMount } from 'svelte';
	import Button from '../Button.svelte';
	import Icon from '../Icon.svelte';
	import type { SpinWheelItem } from './types';

	import { shuffle } from './utils';

	let wheelEl = $state<HTMLDivElement>();

	interface Props {
		items: SpinWheelItem[];
		maxSpeed?: number;
		minSpeed?: number;
		rotationResistance?: number;
		removeOnWinner?: boolean;
		onWinner?: (item: SpinWheelItem) => void;
		showSpin?: boolean;
		buttonText?: string;
		children?: import('svelte').Snippet<[any]>;
	}

	let {
		items = $bindable(),
		maxSpeed = 2000,
		minSpeed = 500,
		rotationResistance = (maxSpeed / minSpeed) * 50 * -1,
		removeOnWinner = false,
		onWinner = () => {},
		showSpin = true,
		buttonText = 'Spin',
		children
	}: Props = $props();

	items = shuffle(items);

	let wheel = $state<Wheel>();
	let hasSpun = $state(false);
	let selected: SpinWheelItem | null = $state(null);

	let spinning = $state(false);

	function random(min: number, max: number) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}

	function shuff() {
		items = shuffle(items);
		if (wheel) {
			wheel.items = items;
		}
	}

	function spin(speed = 0) {
		if (speed == 0) speed = random(minSpeed, maxSpeed);
		if (wheel) {
			wheel.items = items;
			hasSpun = true;
			wheel.spin(speed);
		}
	}

	function win(item: SpinWheelItem) {
		if (item.onWin) item.onWin();
		onWinner(item);
	}

	onMount(() => {
		wheel = new Wheel(wheelEl, {
			items: items,
			isInteractive: false,
			itemBackgroundColors: ['#D4163C', '#2B2E40', '#4685AF', '#E4C25E', '#C0B6B4'],
			rotationSpeedMax: maxSpeed,
			rotationResistance: rotationResistance,
			itemLabelFont:
				" Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
		});

		wheel.onSpin = () => {
			spinning = true;
		};

		wheel.onRest = (event) => {
			spinning = false;
			selected = items[event.currentIndex];
			if (selected) win(selected);
			if (removeOnWinner) {
				items = items.filter((item) => item != selected);
				if (items.length == 1) {
					selected = items[0] as SpinWheelItem;
					win(selected);
				}
			}
		};

		wheel.onCurrentIndexChange = (event) => {
			selected = items[event.currentIndex];
		};
	});

	onDestroy(() => {
		wheel?.remove();
	});
</script>

<div class="relative">
	<div bind:this={wheelEl}></div>

	{#if hasSpun && selected}
		<p class="absolute -top-6 right-1/2 translate-x-1/2">{selected.label}</p>
	{/if}
	<div class="absolute right-1/2 top-0 translate-x-1/2 text-xl">
		<Icon icon="akar-icons:pointer-down-fill" class=" text-white"></Icon>
	</div>
</div>

{#if showSpin && wheel && items.length > 1}
	<div class="flex justify-between">
		{#if children}{@render children({ spin })}{:else}
			<div class="flex-auto"></div>
		{/if}

		<div class="flex-auto">
			<Button onclick={() => shuff()} class="variant-filled-warning" disabled={spinning}
				>Shuffle</Button
			>
		</div>
		<div class="flex-auto">
			<Button onclick={() => spin()} disabled={spinning}>{buttonText}</Button>
		</div>
	</div>
{/if}
