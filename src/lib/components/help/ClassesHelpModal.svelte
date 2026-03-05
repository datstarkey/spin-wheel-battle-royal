<script lang="ts">
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import { classMap } from '$lib/game/classes/classType';
	import Icon from '../Icon.svelte';

	// Get all classes except 'none'
	const classes = Object.entries(classMap)
		.filter(([key]) => key !== 'none')
		.map(([key, classData]) => ({
			id: key,
			...classData
		}));

	// Class color themes
	const classColors: Record<string, { border: string; glow: string; icon: string }> = {
		swe: {
			border: 'border-secondary-500/50',
			glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
			icon: 'text-secondary-400'
		},
		poopmaster: {
			border: 'border-warning-500/50',
			glow: 'shadow-[0_0_15px_rgba(180,83,9,0.3)]',
			icon: 'text-warning-400'
		},
		gambler: {
			border: 'border-success-500/50',
			glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
			icon: 'text-success-400'
		},
		gigachad: {
			border: 'border-primary-500/50',
			glow: 'shadow-[0_0_15px_rgba(220,38,38,0.3)]',
			icon: 'text-primary-400'
		},
		absoluteUnit: {
			border: 'border-surface-400/50',
			glow: 'shadow-[0_0_15px_rgba(148,163,184,0.3)]',
			icon: 'text-surface-300'
		},
		shadeweaver: {
			border: 'border-tertiary-500/50',
			glow: 'shadow-[0_0_15px_rgba(139,92,246,0.3)]',
			icon: 'text-tertiary-400'
		}
	};

	function getClassColor(id: string) {
		return classColors[id] || classColors.absoluteUnit;
	}
</script>

<Dialog>
	<Dialog.Trigger class="btn btn-icon preset-tonal" aria-label="Class Guide">
		<Icon icon="mdi:help-circle-outline" size="xl" />
	</Dialog.Trigger>
	<Portal>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
		<Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
			<Dialog.Content
				class="border-surface-500/30 bg-surface-900/95 relative max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-lg border shadow-2xl"
			>
				<!-- Corner accents -->
				<div
					class="border-primary-500/50 pointer-events-none absolute top-0 left-0 h-8 w-8 border-t-2 border-l-2"
				></div>
				<div
					class="border-primary-500/50 pointer-events-none absolute top-0 right-0 h-8 w-8 border-t-2 border-r-2"
				></div>
				<div
					class="border-primary-500/50 pointer-events-none absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2"
				></div>
				<div
					class="border-primary-500/50 pointer-events-none absolute right-0 bottom-0 h-8 w-8 border-r-2 border-b-2"
				></div>

				<!-- Header -->
				<div
					class="border-surface-500/30 bg-surface-800/50 flex items-center justify-between border-b px-6 py-4"
				>
					<div class="flex items-center gap-3">
						<Icon icon="mdi:sword-cross" size="xl" class="text-primary-400 text-2xl" />
						<Dialog.Title class="text-surface-100 text-2xl font-bold tracking-wide">
							CLASS GUIDE
						</Dialog.Title>
					</div>
					<Dialog.CloseTrigger
						class="btn-icon preset-tonal-surface hover:preset-filled-error-500 transition-all"
					>
						<Icon icon="mdi:close" size="lg" />
					</Dialog.CloseTrigger>
				</div>

				<!-- Content -->
				<div class="overflow-y-auto p-6" style="max-height: calc(85vh - 80px);">
					<p class="text-surface-400 mb-6 text-sm">
						Choose your class wisely. Each brings unique abilities and playstyles to the battle
						arena.
					</p>

					<div class="grid gap-4 md:grid-cols-2">
						{#each classes as classData (classData.id)}
							{@const colors = getClassColor(classData.id)}
							<div
								class="group bg-surface-800/50 hover:bg-surface-800 relative rounded-lg border p-4 transition-all duration-300 {colors.border} hover:{colors.glow}"
							>
								<!-- Class header -->
								<div class="mb-3 flex items-center gap-3">
									<div
										class="bg-surface-700/50 flex h-10 w-10 items-center justify-center rounded-lg"
									>
										{#if classData.icon}
											<img
												src={classData.icon}
												alt=""
												class="h-8 w-8"
												style="image-rendering: pixelated;"
											/>
										{:else}
											<Icon icon="mdi:account" size="xl" class={colors.icon} />
										{/if}
									</div>
									<div>
										<h3 class="text-surface-100 text-lg font-bold">{classData.name}</h3>
									</div>
								</div>

								<!-- Description -->
								{#if classData.description}
									<p class="text-surface-300 mb-3 text-sm">{classData.description}</p>
								{/if}

								<!-- Stats grid -->
								<div class="mb-3 grid grid-cols-4 gap-2 text-center text-xs">
									<div class="bg-surface-700/50 rounded px-2 py-1.5">
										<div class="text-success-400 font-mono">{classData.hp}</div>
										<div class="text-surface-500">HP</div>
									</div>
									<div class="bg-surface-700/50 rounded px-2 py-1.5">
										<div class="text-primary-400 font-mono">{classData.attack}</div>
										<div class="text-surface-500">ATK</div>
									</div>
									<div class="bg-surface-700/50 rounded px-2 py-1.5">
										<div class="text-secondary-400 font-mono">{classData.defense}</div>
										<div class="text-surface-500">DEF</div>
									</div>
									<div class="bg-surface-700/50 rounded px-2 py-1.5">
										<div class="text-warning-400 font-mono">{classData.startingGold ?? 0}</div>
										<div class="text-surface-500">GOLD</div>
									</div>
								</div>

								<!-- Ability -->
								<div class="border-surface-600/50 bg-surface-900/50 rounded border px-3 py-2">
									<div class="text-surface-500 mb-1 flex items-center gap-1.5 text-xs">
										<Icon icon="mdi:flash" size="sm" class="text-warning-400" />
										ON WIN ABILITY
									</div>
									<p class="text-surface-200 text-sm">{classData.onWinAbility}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>
