<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	interface Props extends HTMLButtonAttributes {
		icon?: string | undefined;
		children?: import('svelte').Snippet;
	}

	let { icon = undefined, children, class: className, ...rest }: Props = $props();

	let isIconOnly = $derived(!!icon && !children);
	let classStr = $derived(typeof className === 'string' ? className : '');
	let isSmall = $derived(classStr.includes('btn-icon-sm'));
</script>

<button
	type="button"
	{...rest}
	class="{isIconOnly
		? isSmall
			? 'text-surface-300 hover:border-primary-500 hover:text-surface-100 flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 bg-white/5 transition-all hover:bg-white/10'
			: 'btn-icon preset-filled'
		: 'btn preset-filled'} {classStr.replace('btn-icon-sm', '')}"
>
	{#if icon}
		<Icon {icon} size={isSmall ? 'md' : 'xl'} />
	{/if}
	{@render children?.()}
</button>
