<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { getSocketStore } from '$lib/multiplayer/socketStore.svelte';
	import { localStorageStore } from '$lib/stores/localStorageStore.svelte';

	const socket = getSocketStore();

	interface Props {
		initialMode?: 'menu' | 'create' | 'join';
		initialJoinCode?: string;
	}

	let { initialMode = 'menu', initialJoinCode = '' }: Props = $props();

	let mode = $derived<'menu' | 'create' | 'join'>(initialMode);
	let password = $state('');
	let joinCode = $derived(initialJoinCode);
	let joinPassword = $state('');
	let error = $state('');
	let loading = $state(false);

	const savedName = localStorageStore<string>('playerName', '');
	let gmName = $state(savedName.value);
	let joinName = $state(savedName.value);

	async function handleCreate() {
		if (!gmName.trim()) {
			error = 'Please enter your name';
			return;
		}
		error = '';
		loading = true;
		try {
			socket.connect();
			const result = await socket.createRoom(gmName.trim(), password.trim() || undefined);
			if (result.success && result.roomCode) {
				savedName.value = gmName.trim();
			} else {
				error = result.error ?? 'Failed to create room';
			}
		} catch {
			error = 'Connection failed';
		}
		loading = false;
	}

	async function handleJoin() {
		if (!joinCode.trim() || !joinName.trim()) {
			error = 'Please fill in all fields';
			return;
		}
		error = '';
		loading = true;
		try {
			socket.connect();
			const result = await socket.joinRoom(
				joinCode.trim().toUpperCase(),
				joinName.trim(),
				joinPassword.trim() || undefined
			);
			if (result.success) {
				savedName.value = joinName.trim();
			} else {
				error = result.error ?? 'Failed to join room';
			}
		} catch {
			error = 'Connection failed';
		}
		loading = false;
	}
</script>

<div class="mx-auto flex max-w-md flex-col items-center gap-6 pt-12">
	<h1 class="text-surface-100 text-3xl font-bold">Spin-Wheel Battle Royal</h1>
	<p class="text-surface-400 text-center">Play with friends on different devices</p>

	{#if error}
		<div
			class="border-error-500/50 bg-error-500/10 text-error-300 w-full rounded border px-4 py-2 text-sm"
		>
			{error}
		</div>
	{/if}

	{#if mode === 'menu'}
		<div class="flex w-full flex-col gap-3">
			<button
				class="border-primary-500/30 bg-primary-500/10 hover:border-primary-500/50 hover:bg-primary-500/20 flex items-center gap-3 rounded border px-6 py-4 text-left transition-all"
				onclick={() => (mode = 'create')}
			>
				<Icon icon="mdi:plus-circle" class="text-primary-400 text-2xl" />
				<div>
					<div class="text-surface-100 font-bold">Create Room</div>
					<div class="text-surface-400 text-sm">Host a new game as GM</div>
				</div>
			</button>

			<button
				class="border-secondary-500/30 bg-secondary-500/10 hover:border-secondary-500/50 hover:bg-secondary-500/20 flex items-center gap-3 rounded border px-6 py-4 text-left transition-all"
				onclick={() => (mode = 'join')}
			>
				<Icon icon="mdi:account-group" class="text-secondary-400 text-2xl" />
				<div>
					<div class="text-surface-100 font-bold">Join Room</div>
					<div class="text-surface-400 text-sm">Enter a room code to join</div>
				</div>
			</button>
		</div>
	{:else if mode === 'create'}
		<form
			class="flex w-full flex-col gap-4"
			onsubmit={(e) => {
				e.preventDefault();
				handleCreate();
			}}
		>
			<div>
				<label for="gm-name" class="text-surface-300 mb-1 block text-sm">Your Name</label>
				<input
					id="gm-name"
					type="text"
					bind:value={gmName}
					placeholder="Enter your name"
					class="border-surface-500/50 bg-surface-900 text-surface-100 placeholder:text-surface-600 focus:border-primary-500 w-full rounded border px-3 py-2 focus:outline-none"
					autocomplete="off"
				/>
			</div>
			<div>
				<label for="room-password" class="text-surface-300 mb-1 block text-sm"
					>Password (optional)</label
				>
				<input
					id="room-password"
					type="password"
					bind:value={password}
					placeholder="Leave empty for public room"
					class="border-surface-500/50 bg-surface-900 text-surface-100 placeholder:text-surface-600 focus:border-primary-500 w-full rounded border px-3 py-2 focus:outline-none"
				/>
			</div>
			<Button type="submit" disabled={loading}>
				{loading ? 'Creating...' : 'Create Room'}
			</Button>
			<button
				type="button"
				class="text-surface-500 hover:text-surface-300 text-sm"
				onclick={() => (mode = 'menu')}
			>
				Back
			</button>
		</form>
	{:else}
		<form
			class="flex w-full flex-col gap-4"
			onsubmit={(e) => {
				e.preventDefault();
				handleJoin();
			}}
		>
			<div>
				<label for="join-code" class="text-surface-300 mb-1 block text-sm">Room Code</label>
				<input
					id="join-code"
					type="text"
					bind:value={joinCode}
					placeholder="e.g. A3F9K2"
					class="border-surface-500/50 bg-surface-900 text-surface-100 placeholder:text-surface-600 focus:border-secondary-500 w-full rounded border px-3 py-2 font-mono text-lg tracking-widest uppercase focus:outline-none"
					autocomplete="off"
					maxlength="6"
				/>
			</div>
			<div>
				<label for="join-name" class="text-surface-300 mb-1 block text-sm">Your Name</label>
				<input
					id="join-name"
					type="text"
					bind:value={joinName}
					placeholder="Enter your name"
					class="border-surface-500/50 bg-surface-900 text-surface-100 placeholder:text-surface-600 focus:border-secondary-500 w-full rounded border px-3 py-2 focus:outline-none"
					autocomplete="off"
				/>
			</div>
			<div>
				<label for="join-password" class="text-surface-300 mb-1 block text-sm"
					>Password (if required)</label
				>
				<input
					id="join-password"
					type="password"
					bind:value={joinPassword}
					placeholder="Leave empty if none"
					class="border-surface-500/50 bg-surface-900 text-surface-100 placeholder:text-surface-600 focus:border-secondary-500 w-full rounded border px-3 py-2 focus:outline-none"
				/>
			</div>
			<Button type="submit" disabled={loading}>
				{loading ? 'Joining...' : 'Join Room'}
			</Button>
			<button
				type="button"
				class="text-surface-500 hover:text-surface-300 text-sm"
				onclick={() => (mode = 'menu')}
			>
				Back
			</button>
		</form>
	{/if}
</div>
