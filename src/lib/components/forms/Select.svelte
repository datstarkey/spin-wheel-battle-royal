<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';

	type Props = HTMLSelectAttributes & {
		label: string;
	};
	let { value = $bindable(), label, children, ...props }: Props = $props();
</script>

<label class="label">
	<span>{label}</span>
	<select class="select" bind:value {...props}>
		{@render children?.()}
	</select>
</label>
