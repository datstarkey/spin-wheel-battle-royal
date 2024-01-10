<script lang="ts">
	import { Wheel } from 'spin-wheel';
	import { onDestroy, onMount } from 'svelte';
	import Button from '../Button.svelte';
	import type { SpinWheelItem } from './types';
	import Icon from '../Icon.svelte';
	import { shuffle } from './utils';

	let wheelEl: HTMLDivElement;

	export let items: SpinWheelItem[];

	export let maxSpeed: number = 2000;
	export let minSpeed: number = 500;
	export let rotationResistance: number = (maxSpeed / minSpeed) * 50 * -1;
	export let removeOnWinner: boolean = false;
	export let onWinner: (item: SpinWheelItem) => void = () => {};
	export let showSpin = true;
	export let buttonText = 'Spin';

	console.log(items);
	items = shuffle(items);
	console.log(items);

	let wheel: Wheel;
	let hasSpun = false;
	let selected: SpinWheelItem | null = null;

	let spinning = false;

	function random(min: number, max: number) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}

	function shuff() {
		items = shuffle(items);
		wheel.items = items;
	}

	function spin(speed = 0) {
		if (speed == 0) speed = random(minSpeed, maxSpeed);
		wheel.items = items;
		hasSpun = true;
		wheel.spin(speed);
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
			if (selected) onWinner(selected);
			if (removeOnWinner) {
				items = items.filter((item) => item != selected);
				if (items.length == 1) {
					selected = items[0] as SpinWheelItem;
					onWinner(selected);
				}
			}
		};

		wheel.onCurrentIndexChange = (event) => {
			selected = items[event.currentIndex];
		};
	});

	onDestroy(() => {
		wheel.remove();
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
		<slot {spin}>
			<div class="flex-auto"></div>
		</slot>

		<div class="flex-auto">
			<Button on:click={() => shuff()} class="variant-filled-warning" disabled={spinning}
				>Shuffle</Button
			>
		</div>
		<div class="flex-auto">
			<Button on:click={() => spin()} disabled={spinning}>{buttonText}</Button>
		</div>
	</div>
{/if}
