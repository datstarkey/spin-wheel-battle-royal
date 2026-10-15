<script lang="ts">
	import type { CombatState } from '#lib/multiplayer/types.js';
	import { getMultiplayerStore } from '#lib/multiplayer/multiplayerStore.svelte.js';
	import { getSocketStore } from '#lib/multiplayer/socketStore.svelte.js';
	import { getBattleMusicStore } from '#lib/stores/battleMusic.svelte.js';
	import type { Attachment } from 'svelte/attachments';
	import SpinWheel from '../wheel/SpinWheel.svelte';
	import WheelStage from '../wheel/WheelStage.svelte';
	import type { WheelPhase } from '../wheel/types';
	import { WHEEL_THEMES } from '../wheel/wheelThemes';

	interface Props {
		combat: CombatState;
	}

	let { combat }: Props = $props();

	const mp = getMultiplayerStore();
	const socket = getSocketStore();
	const music = getBattleMusicStore();

	const battleMusic: Attachment = () => {
		music.playBattleMusic();
		return () => music.endBattleAndResumeBackground();
	};
	const ATTACK_COLOR = '#b91c1c';
	const DEFENSE_COLOR = '#1d4ed8';

	let pending = $derived(mp.pendingWheels.find((w) => w.key === combat.wheelKey));
	let attackPct = $derived(
		Math.round((combat.attackWeight / (combat.attackWeight + combat.defenseWeight)) * 100)
	);
	let fighters = $derived(
		[
			{
				name: combat.attackerName,
				weight: combat.attackWeight,
				pct: attackPct,
				color: ATTACK_COLOR
			},
			{
				name: combat.defenderName,
				weight: combat.defenseWeight,
				pct: 100 - attackPct,
				color: DEFENSE_COLOR
			}
		].map((f) => ({ ...f, label: `${f.name} ${f.pct}%` }))
	);

	let winner = $state<string>();
	let phase = $derived<WheelPhase>(winner ? 'landed' : pending?.spinParams ? 'spinning' : 'ready');
	let canSpin = $derived(combat.attackerName === mp.myPlayerName || mp.iAmGM);
</script>

{#snippet versus()}
	<header class="flex w-full flex-col items-center gap-3">
		<h2 class="font-display text-warning-100 text-4xl leading-none font-extrabold">Battle</h2>
		<div class="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3">
			{#each fighters as fighter, i (fighter.name)}
				{#if i === 1}
					<span class="font-display text-surface-500 text-3xl font-extrabold">vs</span>
				{/if}
				<div
					class="flex min-w-0 flex-col gap-0.5 rounded-lg border-2 bg-black/40 px-3 py-2 {i === 0
						? 'items-start'
						: 'items-end'}"
					style:border-color={fighter.color}
					style:box-shadow="0 0 20px {fighter.color}55"
				>
					<span class="font-display text-surface-50 max-w-full truncate text-2xl font-extrabold"
						>{fighter.name}</span
					>
					<span class="text-surface-300 text-xs">
						{i === 0 ? 'Attack' : 'Defense'}
						{fighter.weight} · {fighter.pct}% to win
					</span>
				</div>
			{/each}
		</div>
	</header>
{/snippet}

<WheelStage
	theme={{ ...WHEEL_THEMES.damage, title: 'Battle' }}
	{phase}
	{canSpin}
	result={winner ? `${winner} wins` : undefined}
	spinnerName={combat.attackerName}
	spinLabel="Fight"
	header={versus}
	onSpin={() => socket.requestWheelSpin(combat.wheelKey)}
	onContinue={() => socket.confirmWheel(combat.wheelKey)}
>
	<div class="py-4" {@attach battleMusic}>
		<SpinWheel
			items={fighters}
			shuffledOrder={pending?.shuffledOrder}
			spinParams={pending?.spinParams}
			accent={WHEEL_THEMES.damage.accent}
			onLanded={(label) => (winner = fighters.find((f) => f.label === label)?.name)}
		/>
	</div>
</WheelStage>
