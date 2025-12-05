<script lang="ts">
	import { onMount } from 'svelte';
	import { mount, unmount } from 'svelte';

	interface Props {
		children: import('svelte').Snippet;
		target?: string;
	}

	let { children, target = '#modal-portal' }: Props = $props();

	let portalContainer: HTMLDivElement | null = $state(null);
	let targetEl: Element | null = $state(null);

	onMount(() => {
		targetEl = document.querySelector(target);
		if (targetEl && portalContainer) {
			targetEl.appendChild(portalContainer);
		}

		return () => {
			if (portalContainer && portalContainer.parentNode) {
				portalContainer.parentNode.removeChild(portalContainer);
			}
		};
	});
</script>

<div bind:this={portalContainer} class="contents">
	{@render children()}
</div>
