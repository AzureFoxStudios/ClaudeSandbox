<script lang="ts">
	import '../app.css';
	import '$lib/prism-theme.css';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { initSocket, currentUser } from '$lib/socket';
	import IncomingCallModal from '$lib/components/IncomingCallModal.svelte';
	import CallView from '$lib/components/CallView.svelte';

	// Accept data prop to suppress warning (we don't use it in root layout)
	export let data: PageData;

	onMount(() => {
		// A proper user management system would be needed here.
		// For now, we'll use a hardcoded username or prompt the user.
		const username = localStorage.getItem('username') || `User${Math.floor(Math.random() * 1000)}`;
		localStorage.setItem('username', username);

		if (!$currentUser) {
			initSocket(username);
		}
	});
</script>

<IncomingCallModal />
<CallView />

<main>
	{#if $currentUser}
		<slot />
	{:else}
		<div class="loading-screen">
			<h1>Connecting...</h1>
			<p>Please wait while we connect to the server.</p>
		</div>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
	}
	.loading-screen {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100%;
		background-color: #282c34;
		color: white;
	}
</style>
