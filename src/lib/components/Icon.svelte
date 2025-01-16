<script module lang="ts">
	import 'iconify-icon';
</script>

<script lang="ts">
	interface Props {
		icon: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		onclick?: (() => void) | undefined;
		[key: string]: any;
	}

	let { icon, size = 'md', onclick = undefined, ...rest }: Props = $props();

	let role = $derived(onclick ? 'button' : 'img');

	const map = {
		sm: 'text-sm',
		md: 'text-md',
		lg: 'text-lg',
		xl: 'text-xl'
	};
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<iconify-icon
	{role}
	tabindex="0"
	{icon}
	class="{map[size]} {rest.class}"
	onclick={() => {
		if (onclick) {
			onclick();
		}
	}}
></iconify-icon>
