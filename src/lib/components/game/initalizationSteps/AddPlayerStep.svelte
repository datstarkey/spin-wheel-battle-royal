<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { currentGame, removePlayer } from '$lib/stores/gameStore';
</script>

<div class="table-container">
	<table class="table">
		<thead>
			<tr>
				<th>Name</th>
				<!-- <th>Class</th> -->
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#if $currentGame}
				{#each $currentGame.players as player}
					<tr>
						<td class="w-full py-2">
							<h2 class="ml-3">
								{player.name}
							</h2>
						</td>
						<!-- <td> <span class="variant-filled chip">{classMap[player.class].name}</span></td> -->
						<td>
							<Button
								icon="mdi:delete"
								class="variant-filled-error"
								on:click={() => removePlayer(player)}
							></Button>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
