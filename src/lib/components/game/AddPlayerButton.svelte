<script lang="ts">
	import { addPlayer, currentGame } from '$lib/stores/gameStore';
	import Button from '../Button.svelte';
	import { z } from 'zod';
	import { createForm, errorClass } from '../forms/utils';
	import toast from 'svelte-french-toast';

	const newPlayer = z.object({
		name: z.string({ required_error: 'Name is required' }).min(1, { message: 'Name is required' })
	});

	let { body, submit, errors } = createForm(
		newPlayer,
		{
			name: ''
		},
		(res) => {
			if ($currentGame?.players.some((x) => x.name.toLowerCase() == res.name.toLocaleLowerCase())) {
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
		<!-- svelte-ignore a11y-autofocus -->
		<input
			class="input {errorClass('name', $errors)} "
			type="text"
			placeholder="Input"
			autofocus
			bind:value={body.name}
			on:keypress={(e) => {
				if (e.key === 'Enter') {
					submit();
				}
			}}
		/>
	</label>

	<Button class="variant-filled-success ml-3 mt-6" icon="mdi:plus" on:click={submit}></Button>
</form>
