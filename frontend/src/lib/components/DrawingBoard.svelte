<script lang="ts">
	import { onMount } from 'svelte';
	import { socket } from '$lib/socket';
	import { browser } from '$app/environment';

	let excalidrawContainer: HTMLDivElement;
	let Excalidraw: any;
	let excalidrawAPI: any;
	let isLoading = true;

	onMount(async () => {
		if (!browser) return;

		try {
			// Dynamically import Excalidraw
			const module = await import('@excalidraw/excalidraw');
			Excalidraw = module.Excalidraw;

			isLoading = false;

			// Set up collaboration
			if ($socket) {
				$socket.on('excalidraw-update', (state: any) => {
					if (excalidrawAPI && state) {
						excalidrawAPI.updateScene(state);
					}
				});

				$socket.on('init', (data: any) => {
					if (excalidrawAPI && data.excalidrawState) {
						excalidrawAPI.updateScene(data.excalidrawState);
					}
				});
			}
		} catch (error) {
			console.error('Failed to load Excalidraw:', error);
			isLoading = false;
		}
	});

	function handleChange(elements: any, appState: any) {
		if (!$socket || !elements) return;

		// Broadcast changes to other users (throttled)
		const state = {
			elements,
			appState: {
				viewBackgroundColor: appState.viewBackgroundColor
			}
		};

		$socket.emit('excalidraw-update', state);
	}

	let changeTimeout: number;
	function throttledChange(elements: any, appState: any) {
		if (changeTimeout) {
			clearTimeout(changeTimeout);
		}

		changeTimeout = setTimeout(() => {
			handleChange(elements, appState);
		}, 500) as unknown as number;
	}
</script>

<div class="drawing-container">
	<div class="header">
		<h2>✏️ Collaborative Drawing</h2>
	</div>

	{#if isLoading}
		<div class="loading">Loading Excalidraw...</div>
	{:else if Excalidraw}
		<div class="excalidraw-wrapper" bind:this={excalidrawContainer}>
			<svelte:component
				this={Excalidraw}
				onChange={throttledChange}
				excalidrawAPI={(api) => excalidrawAPI = api}
			/>
		</div>
	{:else}
		<div class="error">Failed to load drawing board</div>
	{/if}
</div>

<style>
	.drawing-container {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
	}

	.header {
		padding: 1rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border);
	}

	.header h2 {
		font-size: 1.25rem;
	}

	.excalidraw-wrapper {
		flex: 1;
		overflow: hidden;
	}

	.loading,
	.error {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
		font-size: 1.1rem;
	}

	.error {
		color: var(--error);
	}

	:global(.excalidraw) {
		height: 100% !important;
	}

	:global(.excalidraw .App-menu_top) {
		background: var(--bg-secondary) !important;
	}
</style>
