<script lang="ts">
	import type { WheelTheme } from '$lib/components/wheel/types';
	import type { WheelBase } from '$lib/game/wheels/wheels';
	import { untrack } from 'svelte';
	import SpinWheel from './SpinWheel.svelte';

	interface Props {
		key: string;
		wheel: WheelBase;
		theme?: WheelTheme;
		onComplete: () => void;
		onCancel?: () => void;
	}

	let { key, wheel, theme, onComplete, onCancel }: Props = $props();

	let hasWon = $state(false);
	let winningLabel = $state<string | null>(null);
	let resultSection = $state<HTMLDivElement | null>(null);

	// Use provided theme or derive from key for backward compatibility
	let wheelTheme = $derived.by((): WheelTheme => {
		// If theme is explicitly provided, use it
		if (theme) return theme;
		// Otherwise, derive from key
		const lowerKey = key.toLowerCase();
		if (lowerKey.includes('win wheel')) return 'win';
		if (lowerKey.includes('lose wheel')) return 'lose';
		if (lowerKey.includes('loot')) return 'loot';
		if (lowerKey.includes('casino')) return 'casino';
		if (lowerKey.includes('shadow')) return 'shadow';
		if (lowerKey.includes('gambler')) return 'gambler';
		if (lowerKey.includes('damage')) return 'damage';
		if (lowerKey.includes('button')) return 'button';
		return 'default';
	});

	// Theme configurations
	const themes: Record<
		WheelTheme,
		{
			icon: string;
			title: string;
			subtitle: string;
			borderColor: string;
			glowColor: string;
			bgGradient: string;
			accentColor: string;
			pulseColor: string;
		}
	> = {
		win: {
			icon: 'mdi:trophy',
			title: 'VICTORY SPOILS',
			subtitle: 'Claim your reward',
			borderColor: 'border-warning-500/50',
			glowColor: 'shadow-[0_0_60px_rgba(234,179,8,0.3)]',
			bgGradient: 'from-warning-500/10 via-transparent to-warning-500/5',
			accentColor: 'text-warning-400',
			pulseColor: 'rgba(234,179,8,0.15)'
		},
		lose: {
			icon: 'mdi:skull',
			title: "FATE'S PENALTY",
			subtitle: 'Accept your consequence',
			borderColor: 'border-error-500/50',
			glowColor: 'shadow-[0_0_60px_rgba(220,38,38,0.3)]',
			bgGradient: 'from-error-500/10 via-transparent to-error-500/5',
			accentColor: 'text-error-400',
			pulseColor: 'rgba(220,38,38,0.15)'
		},
		loot: {
			icon: 'mdi:treasure-chest',
			title: 'TREASURE VAULT',
			subtitle: 'Fortune awaits',
			borderColor: 'border-warning-500/50',
			glowColor: 'shadow-[0_0_60px_rgba(234,179,8,0.25)]',
			bgGradient: 'from-warning-600/10 via-transparent to-success-500/5',
			accentColor: 'text-warning-400',
			pulseColor: 'rgba(234,179,8,0.12)'
		},
		casino: {
			icon: 'mdi:slot-machine',
			title: 'HIGH ROLLER',
			subtitle: 'Test your luck',
			borderColor: 'border-success-500/50',
			glowColor: 'shadow-[0_0_60px_rgba(16,185,129,0.3)]',
			bgGradient: 'from-success-500/10 via-warning-500/5 to-error-500/5',
			accentColor: 'text-success-400',
			pulseColor: 'rgba(16,185,129,0.15)'
		},
		shadow: {
			icon: 'mdi:ghost',
			title: 'SHADOW REALM',
			subtitle: 'The void speaks',
			borderColor: 'border-tertiary-500/50',
			glowColor: 'shadow-[0_0_60px_rgba(168,85,247,0.4)]',
			bgGradient: 'from-tertiary-500/15 via-tertiary-900/10 to-tertiary-500/10',
			accentColor: 'text-tertiary-400',
			pulseColor: 'rgba(168,85,247,0.2)'
		},
		gambler: {
			icon: 'mdi:cards-playing',
			title: "GAMBLER'S FATE",
			subtitle: 'All in or nothing',
			borderColor: 'border-warning-500/50',
			glowColor: 'shadow-[0_0_60px_rgba(234,179,8,0.35)]',
			bgGradient: 'from-warning-500/15 via-error-500/5 to-success-500/5',
			accentColor: 'text-warning-400',
			pulseColor: 'rgba(234,179,8,0.18)'
		},
		damage: {
			icon: 'mdi:sword-cross',
			title: 'DAMAGE DEALT',
			subtitle: 'Pain awaits',
			borderColor: 'border-primary-500/50',
			glowColor: 'shadow-[0_0_60px_rgba(220,38,38,0.35)]',
			bgGradient: 'from-primary-500/10 via-error-500/5 to-primary-500/5',
			accentColor: 'text-primary-400',
			pulseColor: 'rgba(220,38,38,0.15)'
		},
		button: {
			icon: 'mdi:gesture-tap-button',
			title: 'MYSTERY BUTTON',
			subtitle: 'What will happen?',
			borderColor: 'border-secondary-500/50',
			glowColor: 'shadow-[0_0_60px_rgba(59,130,246,0.3)]',
			bgGradient: 'from-secondary-500/10 via-transparent to-secondary-500/5',
			accentColor: 'text-secondary-400',
			pulseColor: 'rgba(59,130,246,0.15)'
		},
		magic: {
			icon: 'mdi:wizard-hat',
			title: 'ARCANE WHEEL',
			subtitle: 'Channel your power',
			borderColor: 'border-tertiary-500/50',
			glowColor: 'shadow-[0_0_60px_rgba(139,92,246,0.4)]',
			bgGradient: 'from-tertiary-500/15 via-secondary-500/5 to-tertiary-500/10',
			accentColor: 'text-tertiary-400',
			pulseColor: 'rgba(139,92,246,0.2)'
		},
		default: {
			icon: 'mdi:star-four-points',
			title: 'WHEEL OF FATE',
			subtitle: 'Destiny awaits',
			borderColor: 'border-primary-500/50',
			glowColor: 'shadow-[0_0_60px_rgba(220,38,38,0.25)]',
			bgGradient: 'from-primary-500/10 via-transparent to-primary-500/5',
			accentColor: 'text-primary-400',
			pulseColor: 'rgba(220,38,38,0.15)'
		}
	};

	let currentTheme = $derived(themes[wheelTheme]);

	// Extract player name from key
	let playerName = $derived.by(() => {
		const match = key.match(/(?:for|-)?\s*([A-Za-z0-9_]+)(?:\s*-\s*\d+)?$/);
		return match ? match[1] : '';
	});

	// If the wheel is empty, we can just complete the wheel, no need to spin it, happens if there is a bug
	$effect(() => {
		if (wheel.length == 0) {
			untrack(() => {
				onComplete();
			});
		}
	});

	// Auto-scroll the result section into view when it appears
	$effect(() => {
		if (hasWon && resultSection) {
			// Use setTimeout to ensure DOM is fully rendered and layout is complete
			setTimeout(() => {
				resultSection?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}, 100);
		}
	});
</script>

<div class="relative flex min-h-full flex-col overflow-y-auto">
	<!-- Global animated background glow (covers entire modal) -->
	<div
		class="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(ellipse_at_top_center,var(--pulse-color)_0%,transparent_60%)]"
		style="--pulse-color: {currentTheme.pulseColor}"
	></div>

	<!-- Cancel/Close Button (top right, absolute) -->
	{#if onCancel}
		<button
			onclick={() => onCancel()}
			class="text-surface-400 hover:border-error-500/50 hover:bg-error-500/20 absolute top-4 right-4 z-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/50 transition-all hover:text-white"
			title="Cancel wheel"
			aria-label="Cancel wheel"
		>
			<iconify-icon icon="mdi:close" width="20"></iconify-icon>
		</button>
	{/if}

	<!-- Epic Header Section -->
	<div class="relative mb-6 px-4 pt-6 text-center">
		<!-- Decorative top line -->
		<div
			class="absolute top-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-current to-transparent {currentTheme.accentColor} opacity-50"
		></div>

		<!-- Icon with glow -->
		<div class="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
			<div
				class="absolute inset-0 animate-ping rounded-full bg-current opacity-20 {currentTheme.accentColor}"
				style="animation-duration: 2s;"
			></div>
			<div
				class="absolute inset-0 rounded-full bg-gradient-to-br from-current/20 to-transparent {currentTheme.accentColor}"
			></div>
			<iconify-icon
				icon={currentTheme.icon}
				class="relative z-10 text-5xl {currentTheme.accentColor} drop-shadow-[0_0_20px_currentColor]"
			></iconify-icon>
		</div>

		<!-- Title -->
		<h1
			class="mb-1 font-mono text-3xl font-black tracking-[0.2em] text-white uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
		>
			{currentTheme.title}
		</h1>

		<!-- Subtitle -->
		<p class="text-sm font-medium tracking-widest uppercase {currentTheme.accentColor}">
			{currentTheme.subtitle}
		</p>

		<!-- Player name badge -->
		{#if playerName}
			<div
				class="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-1.5 backdrop-blur-sm"
			>
				<iconify-icon icon="mdi:account" class="text-surface-400"></iconify-icon>
				<span class="font-mono text-sm font-bold tracking-wider text-white uppercase"
					>{playerName}</span
				>
			</div>
		{/if}

		<!-- Decorative bottom corners -->
		<div
			class="absolute bottom-0 left-4 h-4 w-4 border-b border-l {currentTheme.borderColor}"
		></div>
		<div
			class="absolute right-4 bottom-0 h-4 w-4 border-r border-b {currentTheme.borderColor}"
		></div>
	</div>

	<!-- Wheel Section -->
	<div class="relative flex-1 px-4">
		<SpinWheel
			items={wheel}
			buttonText="SPIN"
			showSpin={!hasWon}
			onWinner={(item) => {
				hasWon = true;
				winningLabel = item.label;
			}}
		></SpinWheel>
	</div>

	<!-- Result & Continue Section -->
	{#if hasWon}
		<div bind:this={resultSection} class="relative mt-6 px-4 pb-8">
			<!-- Result announcement -->
			<div
				class="relative mx-auto mb-6 max-w-md overflow-hidden rounded-lg border-2 {currentTheme.borderColor} from-surface-900 to-surface-950 bg-gradient-to-br p-6 {currentTheme.glowColor}"
			>
				<!-- Sparkle effects -->
				<div class="pointer-events-none absolute inset-0 overflow-hidden">
					<div
						class="bg-warning-400/60 absolute top-2 left-1/4 h-1.5 w-1.5 animate-ping rounded-full"
						style="animation-delay: 0s;"
					></div>
					<div
						class="absolute top-4 right-1/3 h-1 w-1 animate-ping rounded-full bg-white/40"
						style="animation-delay: 0.3s;"
					></div>
					<div
						class="absolute bottom-3 left-1/3 h-1.5 w-1.5 animate-ping rounded-full {currentTheme.accentColor.replace(
							'text-',
							'bg-'
						)}/60"
						style="animation-delay: 0.6s;"
					></div>
				</div>

				<!-- Inner glow -->
				<div
					class="pointer-events-none absolute inset-0 bg-gradient-to-b {currentTheme.bgGradient}"
				></div>

				<div class="relative text-center">
					<div class="mb-2 flex items-center justify-center gap-2">
						<iconify-icon
							icon="mdi:star-four-points"
							class="{currentTheme.accentColor} animate-pulse text-xl"
						></iconify-icon>
						<span class="text-xs font-bold tracking-[0.3em] uppercase {currentTheme.accentColor}"
							>Result</span
						>
						<iconify-icon
							icon="mdi:star-four-points"
							class="{currentTheme.accentColor} animate-pulse text-xl"
						></iconify-icon>
					</div>
					<p
						class="font-mono text-xl font-black tracking-wide text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
					>
						{winningLabel}
					</p>
				</div>
			</div>

			<!-- Continue button -->
			<button
				onclick={() => onComplete()}
				class="group relative mx-auto flex w-full max-w-md items-center justify-center gap-3 overflow-hidden rounded-lg border-2 {currentTheme.borderColor} from-surface-800 to-surface-900 hover:from-surface-700 hover:to-surface-800 bg-gradient-to-br px-8 py-4 font-mono text-lg font-black tracking-widest text-white uppercase transition-all duration-300 hover:scale-[1.02] {currentTheme.glowColor}"
			>
				<!-- Shine effect on hover -->
				<div
					class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full"
				></div>

				<span class="relative z-10">Continue</span>
				<iconify-icon
					icon="mdi:chevron-right"
					class="relative z-10 text-2xl transition-transform group-hover:translate-x-1"
				></iconify-icon>
			</button>
		</div>
	{/if}
</div>
