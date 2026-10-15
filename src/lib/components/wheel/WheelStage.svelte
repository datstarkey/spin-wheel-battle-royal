<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { WheelPhase } from './types';
	import type { WheelThemeConfig } from './wheelThemes';

	interface Props {
		theme: WheelThemeConfig;
		/** Player who spins and confirms this wheel */
		spinnerName: string;
		canSpin: boolean;
		phase: WheelPhase;
		/** Winning label once the wheel has landed */
		result?: string;
		spinLabel?: string;
		/** Wheels waiting behind this one */
		queued?: number;
		onSpin: () => void;
		onContinue: () => void;
		/** Replaces the default title block (the battle shows its VS card here) */
		header?: Snippet;
		children: Snippet;
	}

	let {
		theme,
		spinnerName,
		canSpin,
		phase,
		result,
		spinLabel = 'Spin',
		queued = 0,
		onSpin,
		onContinue,
		header,
		children
	}: Props = $props();

	// Continue lands under the pointer that pressed Spin; focusing it makes Enter/Space work too
	const focusOnMount: Attachment<HTMLButtonElement> = (button) => button.focus();

	const actionButton =
		'relative h-12 w-full max-w-xs overflow-hidden rounded-lg border-2 font-display text-2xl font-extrabold tracking-wide text-white transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-white/40 focus-visible:outline-none active:translate-y-0';
</script>

<div
	class="fixed inset-0 z-9998 bg-black/85 backdrop-blur-sm"
	style:--accent={theme.accent}
	aria-hidden="true"
>
	<div
		class="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,color-mix(in_oklab,var(--accent)_22%,transparent)_0%,transparent_60%)]"
	></div>
</div>

<div
	class="fixed inset-0 z-9999 flex items-center justify-center overflow-y-auto p-3 sm:p-6"
	style:--accent={theme.accent}
	role="dialog"
	aria-modal="true"
	aria-label={theme.title}
>
	<div
		class="border-warning-500/35 from-surface-900 to-surface-950 relative my-auto w-full max-w-xl rounded-2xl border-2 bg-linear-to-b shadow-[0_0_80px_color-mix(in_oklab,var(--accent)_30%,transparent),inset_0_1px_0_rgba(255,255,255,0.08)]"
	>
		<!-- Gilded inner rim -->
		<div
			class="border-warning-300/10 pointer-events-none absolute inset-1.5 rounded-xl border"
		></div>

		{#if queued > 0}
			<div
				class="border-warning-500/40 text-warning-300 absolute top-3 left-3 flex items-center gap-1.5 rounded-full border bg-black/60 px-2.5 py-1 text-xs font-semibold"
			>
				<iconify-icon icon="mdi:layers-triple"></iconify-icon>
				{queued} more after this
			</div>
		{/if}

		<div class="flex flex-col items-center gap-5 px-4 pt-7 pb-6 sm:px-8">
			{#if header}
				{@render header()}
			{:else}
				<header class="flex flex-col items-center gap-1 text-center">
					<div
						class="border-warning-400/60 mb-1 flex size-14 items-center justify-center rounded-full border-2 bg-black/50 text-3xl text-(--accent) shadow-[0_0_24px_color-mix(in_oklab,var(--accent)_45%,transparent)]"
					>
						<iconify-icon icon={theme.icon}></iconify-icon>
					</div>
					<h2 class="font-display text-warning-100 text-4xl leading-none font-extrabold">
						{theme.title}
					</h2>
					<p class="text-surface-400 text-sm">
						{theme.subtitle} · <span class="text-surface-100 font-semibold">{spinnerName}</span>
					</p>
				</header>
			{/if}

			{@render children()}

			<!-- Fixed-size dock: nothing above or below it moves between Spin, spinning and Continue -->
			<div class="grid w-full justify-items-center gap-3">
				<div
					class="relative flex h-14 w-full max-w-sm items-center justify-center overflow-hidden rounded-lg border-2 px-4 text-center transition-colors duration-300
						{phase === 'landed'
						? 'animate-wheel-pop border-(--accent) bg-black/70 shadow-[0_0_32px_color-mix(in_oklab,var(--accent)_50%,transparent)]'
						: 'border-surface-700 border-dashed bg-black/30'}"
					aria-live="polite"
				>
					{#if phase === 'landed' && result}
						<span class="font-display text-warning-50 truncate text-2xl font-extrabold"
							>{result}</span
						>
						<span
							class="animate-wheel-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-white/25 to-transparent motion-reduce:hidden"
						></span>
					{:else}
						<span class="font-display text-surface-600 text-2xl font-extrabold">?</span>
					{/if}
				</div>

				<div class="flex h-12 w-full items-center justify-center">
					{#if phase === 'landed'}
						{#if canSpin}
							<button
								{@attach focusOnMount}
								class="{actionButton} border-warning-400 from-warning-600 to-warning-800 animate-wheel-rise bg-linear-to-b shadow-[0_6px_0_#713f12,0_0_24px_rgba(234,179,8,0.35)]"
								onclick={onContinue}
							>
								Continue
							</button>
						{:else}
							<p class="text-surface-400 text-sm">Waiting for {spinnerName} to continue</p>
						{/if}
					{:else if phase === 'spinning'}
						<p class="text-surface-300 flex items-center gap-2 text-sm">
							<iconify-icon icon="mdi:loading" class="animate-spin text-lg"></iconify-icon>
							{canSpin ? 'Spinning' : `${spinnerName} is spinning`}
						</p>
					{:else if canSpin}
						<button
							class="{actionButton} border-primary-400 from-primary-500 to-primary-800 bg-linear-to-b shadow-[0_6px_0_#450a0a,0_0_24px_rgba(220,38,38,0.4)]"
							onclick={onSpin}
						>
							{spinLabel}
						</button>
					{:else}
						<p class="text-surface-400 text-sm">Waiting for {spinnerName} to spin</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
