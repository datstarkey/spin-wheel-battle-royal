<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from '../Button.svelte';

	interface Props {
		position: 'left' | 'right' | 'top' | 'bottom';
		isOpen?: boolean;
		width?: string;
		height?: string;
		children: Snippet;
		trigger?: Snippet<[() => void]>;
	}

	let {
		position,
		isOpen = $bindable(false),
		width = '100%',
		height = '100%',
		children,
		trigger
	}: Props = $props();

	// Static store to track which menu is currently open

	// Calculate transform based on position
	let transformStyle = $derived.by(() => {
		const transforms = {
			left: `translateX(-100%)`,
			right: `translateX(100%)`,
			top: `translateY(-100%)`,
			bottom: `translateY(100%)`
		};
		return transforms[position];
	});

	// Calculate position styles
	let positionStyle = $derived.by(() => {
		const positions = {
			left: `left: 0; top: 0; height: 100%; width: ${width};`,
			right: `right: 0; top: 0; height: 100%; width: ${width};`,
			top: `top: 0; left: 0; width: 100%; height: ${height};`,
			bottom: `bottom: 0; left: 0; width: 100%; height: ${height};`
		};
		return positions[position];
	});

	function onTrigger() {
		isOpen = true;
	}
</script>

{@render trigger?.(onTrigger)}

<div
	class="menu-container bg-surface-100-800-token overflow-hidden"
	style="{positionStyle} transform: {isOpen ? 'translate(0)' : transformStyle}"
>
	<div class="absolute right-0 top-0 m-8">
		<Button icon="mdi:close" onclick={() => (isOpen = false)}></Button>
	</div>

	<div class="p-8">
		{@render children()}
	</div>
</div>

<style>
	.menu-container {
		position: fixed;
		transition: transform 0.3s ease-in-out;
		z-index: 1000;
	}
</style>
