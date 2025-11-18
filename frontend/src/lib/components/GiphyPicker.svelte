<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { GiphyFetch } from '@giphy/js-fetch-api';

	const dispatch = createEventDispatcher<{
		select: string;
		close: void;
	}>();

	let searchQuery = '';
	let gifs: any[] = [];
	let loading = false;

	// Use a public API key for demo purposes
	// In production, use environment variable
	const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY || 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh');

	async function searchGifs() {
		if (!searchQuery.trim()) {
			loadTrending();
			return;
		}

		loading = true;
		try {
			const { data } = await gf.search(searchQuery, { limit: 20 });
			gifs = data;
		} catch (error) {
			console.error('Error fetching GIFs:', error);
		}
		loading = false;
	}

	async function loadTrending() {
		loading = true;
		try {
			const { data } = await gf.trending({ limit: 20 });
			gifs = data;
		} catch (error) {
			console.error('Error fetching trending GIFs:', error);
		}
		loading = false;
	}

	function selectGif(gif: any) {
		dispatch('select', gif.images.fixed_height.url);
	}

	onMount(() => {
		loadTrending();
	});
</script>

<div class="giphy-picker">
	<div class="giphy-header">
		<input
			type="text"
			bind:value={searchQuery}
			on:input={searchGifs}
			placeholder="Search GIFs..."
		/>
		<button on:click={() => dispatch('close')} class="close-btn">✕</button>
	</div>

	<div class="gif-grid">
		{#if loading}
			<div class="loading">Loading...</div>
		{:else if gifs.length === 0}
			<div class="no-results">No GIFs found</div>
		{:else}
			{#each gifs as gif (gif.id)}
				<button class="gif-item" on:click={() => selectGif(gif)}>
					<img src={gif.images.fixed_height_small.url} alt={gif.title} />
				</button>
			{/each}
		{/if}
	</div>
</div>

<style>
	.giphy-picker {
		position: absolute;
		bottom: 70px;
		left: 1rem;
		right: 1rem;
		max-width: 500px;
		height: 400px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
		z-index: 100;
	}

	.giphy-header {
		padding: 1rem;
		border-bottom: 1px solid var(--border);
		display: flex;
		gap: 0.5rem;
	}

	.giphy-header input {
		flex: 1;
	}

	.close-btn {
		background: transparent;
		color: var(--text-secondary);
		padding: 0.5rem;
		width: 40px;
	}

	.close-btn:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.gif-grid {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.5rem;
		align-content: start;
	}

	.gif-item {
		background: transparent;
		padding: 0;
		border-radius: 4px;
		overflow: hidden;
		cursor: pointer;
		aspect-ratio: 1;
	}

	.gif-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.2s;
	}

	.gif-item:hover img {
		transform: scale(1.05);
	}

	.loading,
	.no-results {
		grid-column: 1 / -1;
		text-align: center;
		padding: 2rem;
		color: var(--text-secondary);
	}
</style>
