<script lang="ts">
	import { users, currentUser } from '$lib/socket';
	import { isSharing } from '$lib/webrtc';

	export let activeView: 'chat' | 'draw' | 'screen' = 'chat';
</script>

<aside class="sidebar">
	<div class="logo">
		<h2>💬 Chat</h2>
	</div>

	<nav>
		<button
			class:active={activeView === 'chat'}
			on:click={() => activeView = 'chat'}
		>
			💬 Chat
		</button>
		<button
			class:active={activeView === 'draw'}
			on:click={() => activeView = 'draw'}
		>
			✏️ Draw
		</button>
		<button
			class:active={activeView === 'screen'}
			on:click={() => activeView = 'screen'}
		>
			🖥️ Screen Share
		</button>
	</nav>

	<div class="users">
		<h3>Online ({$users.length})</h3>
		<div class="user-list">
			{#each $users as user}
				<div class="user">
					<span class="user-dot" style="background: {user.color}"></span>
					<span class="user-name">
						{user.username}
						{#if user.id === $currentUser?.id}(you){/if}
					</span>
				</div>
			{/each}
		</div>
	</div>
</aside>

<style>
	.sidebar {
		width: 250px;
		background: var(--bg-secondary);
		border-right: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		padding: 1rem;
	}

	.logo {
		margin-bottom: 1.5rem;
	}

	.logo h2 {
		font-size: 1.5rem;
		color: var(--accent);
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	nav button {
		background: transparent;
		color: var(--text-secondary);
		text-align: left;
		padding: 0.75rem;
		border-radius: 4px;
		transition: all 0.2s;
	}

	nav button:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	nav button.active {
		background: var(--accent);
		color: white;
	}

	.users {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.users h3 {
		font-size: 0.85rem;
		text-transform: uppercase;
		color: var(--text-secondary);
		margin-bottom: 0.75rem;
	}

	.user-list {
		flex: 1;
		overflow-y: auto;
	}

	.user {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 4px;
		margin-bottom: 0.25rem;
	}

	.user:hover {
		background: var(--bg-tertiary);
	}

	.user-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.user-name {
		font-size: 0.9rem;
		color: var(--text-primary);
	}
</style>
