<script lang="ts">
	import { users, currentUser, socket, unreadCount, markMessagesAsRead, type User } from '$lib/socket';
	import { isSharing } from '$lib/webrtc';
	import { startCall } from '$lib/calling';
	import ProfileModal from './ProfileModal.svelte';
	import Settings from './Settings.svelte';

	export let activeView: 'chat' | 'draw' | 'screen' = 'chat';

	// Clear unread count when switching to chat view
	$: if (activeView === 'chat') {
		markMessagesAsRead();
	}

	let showProfileModal = false;
	let selectedUser: User | null = null;
	let isOwnProfile = false;
	let showSettings = false;

	function openProfile(user: User) {
		selectedUser = user;
		isOwnProfile = user.id === $currentUser?.id;
		showProfileModal = true;
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'active':
				return '#10b981';
			case 'away':
				return '#f59e0b';
			case 'busy':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	}

	async function handleVoiceCall(event: MouseEvent, user: User) {
		event.stopPropagation();
		if (!$socket || user.id === $currentUser?.id) return;
		try {
			await startCall($socket, user.id, false);
		} catch (error) {
			alert('Failed to start voice call. Please check microphone permissions.');
		}
	}

	async function handleVideoCall(event: MouseEvent, user: User) {
		event.stopPropagation();
		if (!$socket || user.id === $currentUser?.id) return;
		try {
			await startCall($socket, user.id, true);
		} catch (error) {
			alert('Failed to start video call. Please check camera and microphone permissions.');
		}
	}
</script>

<aside class="sidebar">
	<div class="logo">
		<img src="/wabi-logo.png" alt="Wabi" class="logo-img" />
		<button class="settings-btn" on:click={() => showSettings = true} title="Settings">
			⚙️
		</button>
	</div>

	<nav>
		<button
			class:active={activeView === 'chat'}
			on:click={() => activeView = 'chat'}
		>
			💬 Chat
			{#if $unreadCount > 0 && activeView !== 'chat'}
				<span class="unread-badge">{$unreadCount > 99 ? '99+' : $unreadCount}</span>
			{/if}
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
				<div class="user-container">
					<button class="user" on:click={() => openProfile(user)}>
						<!-- Profile Picture or Placeholder -->
						{#if user.profilePicture}
							<img src={user.profilePicture} alt={user.username} class="user-avatar" />
						{:else}
							<div class="user-avatar-placeholder" style="background-color: {user.color}">
								{user.username.charAt(0).toUpperCase()}
							</div>
						{/if}

						<!-- Username and Status -->
						<div class="user-info">
							<span class="user-name">
								{user.username}
								{#if user.id === $currentUser?.id}<span class="you-badge">(you)</span>{/if}
							</span>
							<div class="user-status">
								<span class="status-dot" style="background-color: {getStatusColor(user.status)}"></span>
								<span class="status-text">{user.status}</span>
							</div>
						</div>
					</button>

					<!-- Call buttons (only show for other users) -->
					{#if user.id !== $currentUser?.id}
						<div class="call-buttons">
							<button
								class="call-btn voice-call"
								on:click={(e) => handleVoiceCall(e, user)}
								title="Voice call"
							>
								📞
							</button>
							<button
								class="call-btn video-call"
								on:click={(e) => handleVideoCall(e, user)}
								title="Video call"
							>
								📹
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</aside>

<ProfileModal bind:isOpen={showProfileModal} bind:user={selectedUser} {isOwnProfile} />
<Settings bind:isOpen={showSettings} />

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
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo h2 {
		font-size: 1.5rem;
		color: var(--accent);
	}

	.logo-img {
		height: 50px;
		width: auto;
		filter: invert(1);
	}

	.settings-btn {
		background: transparent;
		border: none;
		font-size: 1.3rem;
		cursor: pointer;
		color: var(--text-secondary);
		padding: 0.5rem;
		transition: all 0.2s;
		border-radius: 6px;
	}

	.settings-btn:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
		transform: rotate(45deg);
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

	nav button {
		position: relative;
	}

	.unread-badge {
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
		background: #ef4444;
		color: white;
		font-size: 0.7rem;
		font-weight: 600;
		padding: 2px 6px;
		border-radius: 10px;
		min-width: 18px;
		text-align: center;
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

	.user-container {
		position: relative;
		margin-bottom: 0.5rem;
	}

	.user-container:hover .call-buttons {
		opacity: 1;
		pointer-events: auto;
	}

	.user {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem;
		border-radius: 8px;
		background: transparent;
		border: none;
		width: 100%;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s;
	}

	.user:hover {
		background: var(--bg-tertiary);
		transform: translateX(2px);
	}

	.user-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid var(--border);
	}

	.user-avatar-placeholder {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		color: white;
		font-size: 1rem;
		border: 2px solid var(--border);
	}

	.user-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.user-name {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.you-badge {
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-weight: normal;
		margin-left: 0.25rem;
	}

	.user-status {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.status-text {
		font-size: 0.75rem;
		color: var(--text-secondary);
		text-transform: capitalize;
	}

	.call-buttons {
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		gap: 0.25rem;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s;
	}

	.call-btn {
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 6px;
		background: var(--bg-tertiary);
		color: var(--text-primary);
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.call-btn:hover {
		transform: scale(1.1);
	}

	.voice-call:hover {
		background: #10b981;
	}

	.video-call:hover {
		background: #3b82f6;
	}
</style>
