<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import Icon from '../Icon.svelte';

	interface ButtonProps {
		onclick: () => void;
		icon?: string;
		text?: string;
		disabled?: boolean;
	}
	interface Props extends HTMLAttributes<HTMLDivElement> {
		buttons: ButtonProps[];
	}
	let { buttons, ...props }: Props = $props();
</script>

<div {...props} class="btn-group {props.class}">
	{#each buttons as button}
		<button onclick={button.onclick} disabled={button.disabled}>
			{#if button.icon}
				<Icon icon={button.icon} size="xl" />
			{/if}
			{button.text}</button
		>
	{/each}
</div>
