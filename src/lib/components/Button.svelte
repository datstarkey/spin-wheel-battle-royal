<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	interface Props extends HTMLButtonAttributes {
		icon?: string | undefined;
		children?: import('svelte').Snippet;
		[key: string]: any;
	}

	let { icon = undefined, children, ...rest }: Props = $props();

	let isIconOnly = $derived(!!icon && !children);
	let isSmall = $derived(rest.class?.includes('btn-icon-sm'));
</script>

<button
	type="button"
	{...rest}
	class="{isIconOnly
		? isSmall
			? 'flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 bg-white/5 text-surface-300 transition-all hover:border-primary-500 hover:bg-white/10 hover:text-surface-100'
			: 'btn-icon preset-filled'
		: 'btn preset-filled'} {rest.class?.replace('btn-icon-sm', '') ?? ''}"
>
	{#if icon}
		<Icon {icon} size={isSmall ? 'md' : 'xl'} />
	{/if}
	{@render children?.()}
</button>
