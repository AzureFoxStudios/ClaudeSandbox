<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { socket } from '$lib/socket';
	import { browser } from '$app/environment';

	let excalidrawContainer: HTMLDivElement;
	let excalidrawAPI: any = null;
	let isLoading = true;
	let errorMessage = '';

	onMount(async () => {
		if (!browser) return;

		try {
			// First, hide the loading state to render the container
			isLoading = false;

			// Wait for Svelte to update the DOM
			await tick();

			// Now the container should be available
			if (!excalidrawContainer) {
				throw new Error('Excalidraw container not found after DOM update');
			}

			// Dynamically import Excalidraw and React
			const [excalidrawModule, reactModule, reactDomModule] = await Promise.all([
				import('@excalidraw/excalidraw'),
				import('react'),
				import('react-dom/client')
			]);

			const React = reactModule.default;
			const ReactDOM = reactDomModule.default;
			const { Excalidraw } = excalidrawModule;

			console.log('Excalidraw and React loaded successfully');

			// Create React root and render Excalidraw
			const root = ReactDOM.createRoot(excalidrawContainer);

			root.render(
				React.createElement(Excalidraw, {
					onChange: (elements: any, appState: any) => {
						throttledChange(elements, appState);
					},
					excalidrawAPI: (api: any) => {
						handleExcalidrawAPI(api);
					}
				})
			);

			// Set up collaboration
			if ($socket) {
				$socket.on('excalidraw-update', (state: any) => {
					if (excalidrawAPI && state) {
						try {
							excalidrawAPI.updateScene(state);
						} catch (error) {
							console.error('Error updating scene:', error);
						}
					}
				});

				$socket.on('init', (data: any) => {
					if (excalidrawAPI && data.excalidrawState) {
						try {
							excalidrawAPI.updateScene(data.excalidrawState);
						} catch (error) {
							console.error('Error updating scene from init:', error);
						}
					}
				});
			}
		} catch (error) {
			console.error('Failed to load Excalidraw:', error);
			errorMessage = error instanceof Error ? error.message : 'Unknown error';
		}
	});

	onDestroy(() => {
		if ($socket) {
			$socket.off('excalidraw-update');
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

	function handleExcalidrawAPI(api: any) {
		excalidrawAPI = api;
		console.log('Excalidraw API initialized:', api);
	}
</script>

<div class="drawing-container">
	<div class="header">
		<h2>✏️ Collaborative Drawing</h2>
	</div>

	{#if isLoading}
		<div class="loading">Loading Excalidraw...</div>
	{:else if errorMessage}
		<div class="error">
			Failed to load drawing board: {errorMessage}
			<br />
			Please check the console for more details.
		</div>
	{:else}
		<div class="excalidraw-wrapper" bind:this={excalidrawContainer}></div>
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
