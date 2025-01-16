<script lang="ts">
	import { addPlayer, currentGame } from '$lib/stores/gameStore.svelte';
	import toast from 'svelte-french-toast';
	import { z } from 'zod';
	import Button from '../Button.svelte';
	import { createForm, errorClass } from '../forms/utils.svelte';

	const newPlayer = z.object({
		name: z.string({ required_error: 'Name is required' }).min(1, { message: 'Name is required' })
	});

	let { body, submit, errors } = createForm(
		newPlayer,
		{
			name: ''
		},
		(res) => {
			console.log('ayoo');
			if (
				currentGame.value?.players.some((x) => x.name.toLowerCase() == res.name.toLocaleLowerCase())
			) {
				toast.error('Player already exists');
				return;
			}
			addPlayer(res.name);
			body.name = '';
		}
	);
</script>

<form class="card flex w-full items-center gap-3 p-4">
	<label class="label flex-auto">
		<span>Name</span>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			class="input {errorClass('name', errors)} "
			type="text"
			placeholder="Input"
			autofocus
			bind:value={body.name}
			onkeypress={(e) => {
				if (e.key === 'Enter') {
					submit();
				}
			}}
		/>
	</label>

	<Button class="variant-filled-success ml-3 mt-6" icon="mdi:plus" onclick={submit}></Button>
</form>
