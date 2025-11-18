<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ login: string }>();

	let username = '';

	function handleSubmit() {
		if (username.trim()) {
			dispatch('login', username.trim());
		}
	}
</script>

<div class="login-container">
	<div class="login-box">
		<h1>Community Chat</h1>
		<p>Self-hosted ephemeral chat with screen sharing</p>

		<form on:submit|preventDefault={handleSubmit}>
			<input
				type="text"
				bind:value={username}
				placeholder="Enter your username"
				maxlength="20"
				required
				autofocus
			/>
			<button type="submit">Join Chat</button>
		</form>
	</div>
</div>

<style>
	.login-container {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100vh;
		background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
	}

	.login-box {
		background: var(--bg-secondary);
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		width: 100%;
		max-width: 400px;
		text-align: center;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 0.5rem;
		color: var(--accent);
	}

	p {
		color: var(--text-secondary);
		margin-bottom: 2rem;
		font-size: 0.9rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		font-size: 1rem;
	}

	button {
		padding: 0.75rem;
		font-size: 1rem;
		font-weight: 600;
	}
</style>
