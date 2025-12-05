<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import AddPlayerButton from '$lib/components/game/AddPlayerButton.svelte';
	import AddPlayerStep from '$lib/components/game/initalizationSteps/AddPlayerStep.svelte';
	import ChooseClasses from '$lib/components/game/initalizationSteps/ChooseClasses.svelte';
	import ChooseGameOrder from '$lib/components/game/initalizationSteps/ChooseGameOrder.svelte';
	import { currentGame, startGame } from '$lib/stores/gameStore.svelte';

	const STEPS = [
		{ title: 'Players', description: 'Add players to the game', icon: 'mdi:account-group' },
		{ title: 'Battle Order', description: 'Determine who goes first', icon: 'mdi:sort-numeric-ascending' },
		{ title: 'Classes', description: 'Choose your class', icon: 'mdi:sword-cross' }
	] as const;

	const MIN_PLAYERS = 2;

	// Compute initial step based on current game state
	function getInitialStep(): number {
		if (!currentGame.value?.players) return 0;

		const hasEnoughPlayers = currentGame.value.players.length >= MIN_PLAYERS;
		if (!hasEnoughPlayers) return 0;

		const playerCount = currentGame.value.players.length;
		const orderCount = Object.keys(currentGame.value.playerOrder).length;
		const uniqueNames = new Set(Object.values(currentGame.value.playerOrder));
		const hasValidOrder = orderCount === playerCount && uniqueNames.size === playerCount;
		if (!hasValidOrder) return 1;

		const allHaveClasses = !currentGame.value.players.some((x) => x.class.name === 'None');
		if (!allHaveClasses) return 2;

		// All steps complete, stay on last step
		return 2;
	}

	let currentStep = $state(getInitialStep());

	// Step validation
	let step1Valid = $derived(
		currentGame.value?.players ? currentGame.value.players.length >= MIN_PLAYERS : false
	);

	let step2Valid = $derived.by(() => {
		if (!currentGame.value?.players) return false;
		const playerCount = currentGame.value.players.length;
		const orderCount = Object.keys(currentGame.value.playerOrder).length;
		const uniqueNames = new Set(Object.values(currentGame.value.playerOrder));
		return orderCount === playerCount && uniqueNames.size === playerCount;
	});

	let step3Valid = $derived(
		currentGame.value?.players
			? !currentGame.value.players.some((x) => x.class.name === 'None')
			: false
	);

	function canProceed(step: number): boolean {
		if (step === 0) return step1Valid;
		if (step === 1) return step2Valid;
		if (step === 2) return step3Valid;
		return false;
	}

	function getStepStatus(index: number): 'complete' | 'current' | 'upcoming' {
		if (index < currentStep) return 'complete';
		if (index === currentStep) return 'current';
		return 'upcoming';
	}

	function handleNext() {
		if (currentStep < STEPS.length - 1 && canProceed(currentStep)) {
			currentStep++;
		} else if (currentStep === STEPS.length - 1 && canProceed(currentStep)) {
			startGame();
		}
	}

	function handlePrev() {
		if (currentStep > 0) {
			if (currentStep === 2 && currentGame.value) {
				currentGame.value.players.forEach((player) => {
					player.assignClass('none');
				});
			}
			if (currentStep === 1 && currentGame.value) {
				currentGame.value.playerOrder = {};
			}
			currentStep--;
		}
	}

	function handleStepClick(index: number) {
		if (index < currentStep) {
			if (index < 2 && currentStep >= 2 && currentGame.value) {
				currentGame.value.players.forEach((player) => {
					player.assignClass('none');
				});
			}
			if (index < 1 && currentStep >= 1 && currentGame.value) {
				currentGame.value.playerOrder = {};
			}
			currentStep = index;
		}
	}

	let playerCount = $derived(currentGame.value?.players?.length ?? 0);
</script>

<div class="w-full max-w-2xl">
	<!-- Header -->
	<div class="mb-8 text-center">
		<h1 class="mb-2 text-3xl font-bold tracking-wider text-surface-100 uppercase">
			Battle Setup
		</h1>
		<p class="text-sm tracking-wide text-surface-400">Prepare for combat</p>
	</div>

	<!-- Step Indicators -->
	<div class="relative mb-8">
		<!-- Progress line background -->
		<div class="absolute top-6 left-0 h-0.5 w-full bg-surface-700"></div>
		<!-- Progress line filled -->
		<div
			class="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-500 ease-out"
			style="width: {(currentStep / (STEPS.length - 1)) * 100}%"
		></div>

		<div class="relative flex justify-between">
			{#each STEPS as step, index (step.title)}
				{@const status = getStepStatus(index)}
				<button
					type="button"
					onclick={() => handleStepClick(index)}
					disabled={status === 'upcoming'}
					class="group flex flex-col items-center gap-2 transition-all duration-300
						{status === 'upcoming' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
				>
					<!-- Step circle -->
					<div class="relative flex h-12 w-12 items-center justify-center rounded-sm transition-all duration-300
						{status === 'complete'
							? 'bg-primary-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]'
							: status === 'current'
								? 'bg-surface-800 border-2 border-primary-500 shadow-[0_0_25px_rgba(220,38,38,0.3)] animate-pulse'
								: 'bg-surface-800 border border-surface-600'}"
					>
						{#if status === 'complete'}
							<Icon icon="mdi:check" class="text-surface-50" size="lg" />
						{:else}
							<Icon
								icon={step.icon}
								class={status === 'current' ? 'text-primary-400' : 'text-surface-400'}
								size="lg"
							/>
						{/if}

						<!-- Corner accents for current step -->
						{#if status === 'current'}
							<div class="absolute -top-0.5 -left-0.5 h-2 w-2 border-t-2 border-l-2 border-primary-400"></div>
							<div class="absolute -top-0.5 -right-0.5 h-2 w-2 border-t-2 border-r-2 border-primary-400"></div>
							<div class="absolute -bottom-0.5 -left-0.5 h-2 w-2 border-b-2 border-l-2 border-primary-400"></div>
							<div class="absolute -bottom-0.5 -right-0.5 h-2 w-2 border-b-2 border-r-2 border-primary-400"></div>
						{/if}
					</div>

					<!-- Step label -->
					<div class="text-center">
						<p class="text-xs font-bold tracking-wider uppercase
							{status === 'current' ? 'text-primary-400' : status === 'complete' ? 'text-surface-200' : 'text-surface-500'}">
							{step.title}
						</p>
						<p class="hidden text-[10px] text-surface-500 sm:block">{step.description}</p>
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Content Panel -->
	<div class="relative overflow-hidden rounded-sm border border-surface-700 bg-surface-900/80 backdrop-blur-sm">
		<!-- Corner accents -->
		<div class="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-primary-500/50"></div>
		<div class="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-primary-500/50"></div>
		<div class="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-primary-500/50"></div>
		<div class="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-primary-500/50"></div>

		<!-- Header bar -->
		<div class="flex items-center justify-between border-b border-surface-700 bg-surface-800/50 px-4 py-3">
			<div class="flex items-center gap-2">
				<Icon icon={STEPS[currentStep].icon} class="text-primary-400" />
				<span class="text-sm font-bold tracking-wider text-surface-200 uppercase">
					{STEPS[currentStep].title}
				</span>
			</div>
			<div class="flex items-center gap-2 text-xs text-surface-400">
				<span>Step {currentStep + 1} of {STEPS.length}</span>
			</div>
		</div>

		<!-- Step content -->
		<div class="p-6">
			{#if currentStep === 0}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-sm bg-surface-800 border border-surface-600">
								<span class="text-sm font-bold text-primary-400">{playerCount}</span>
							</div>
							<span class="text-sm text-surface-300">Players added</span>
						</div>
						{#if !step1Valid}
							<div class="flex items-center gap-2 text-xs text-warning-400">
								<Icon icon="mdi:alert" size="sm" />
								<span>Need {MIN_PLAYERS - playerCount} more</span>
							</div>
						{:else}
							<div class="flex items-center gap-2 text-xs text-success-400">
								<Icon icon="mdi:check-circle" size="sm" />
								<span>Ready to proceed</span>
							</div>
						{/if}
					</div>
					<AddPlayerStep />
					<AddPlayerButton />
				</div>
			{:else if currentStep === 1}
				<ChooseGameOrder />
			{:else if currentStep === 2}
				<ChooseClasses />
			{/if}
		</div>
	</div>

	<!-- Navigation -->
	<div class="mt-6 flex items-center justify-between">
		<button
			type="button"
			onclick={handlePrev}
			disabled={currentStep === 0}
			class="group flex items-center gap-2 px-4 py-2 text-sm font-bold tracking-wider uppercase transition-all duration-200
				{currentStep === 0
					? 'cursor-not-allowed text-surface-600'
					: 'text-surface-300 hover:text-surface-100'}"
		>
			<Icon
				icon="mdi:chevron-left"
				class="transition-transform duration-200 {currentStep > 0 ? 'group-hover:-translate-x-1' : ''}"
			/>
			<span>Back</span>
		</button>

		<button
			type="button"
			onclick={handleNext}
			disabled={!canProceed(currentStep)}
			class="group relative flex items-center gap-2 overflow-hidden rounded-sm px-6 py-3 text-sm font-bold tracking-wider uppercase transition-all duration-300
				{canProceed(currentStep)
					? 'bg-gradient-to-r from-primary-600 to-primary-500 text-surface-50 shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:scale-105'
					: 'cursor-not-allowed bg-surface-800 text-surface-500'}"
		>
			{#if currentStep === STEPS.length - 1}
				<Icon icon="mdi:sword-cross" />
				<span>Enter Battle</span>
			{:else}
				<span>Continue</span>
				<Icon
					icon="mdi:chevron-right"
					class="transition-transform duration-200 {canProceed(currentStep) ? 'group-hover:translate-x-1' : ''}"
				/>
			{/if}

			<!-- Shine effect on hover -->
			{#if canProceed(currentStep)}
				<div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"></div>
			{/if}
		</button>
	</div>
</div>
