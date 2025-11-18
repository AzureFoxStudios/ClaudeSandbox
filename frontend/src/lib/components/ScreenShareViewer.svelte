<script lang="ts">
	import { onMount } from 'svelte';
	import { socket } from '$lib/socket';
	import {
		screenShares,
		isSharing,
		startScreenShare,
		stopScreenShare,
		createOffer,
		handleOffer,
		handleAnswer,
		handleIceCandidate,
		removeScreenShare
	} from '$lib/webrtc';
	import { users } from '$lib/socket';

	let localStream: MediaStream | null = null;
	let error = '';

	async function handleStartShare() {
		try {
			if (!$socket) return;

			localStream = await startScreenShare($socket);
			error = '';
		} catch (err) {
			error = 'Failed to start screen sharing. Please grant permissions.';
			console.error(err);
		}
	}

	function handleStopShare() {
		if (!$socket) return;
		stopScreenShare($socket);
		localStream = null;
	}

	onMount(() => {
		if (!$socket) return;

		$socket.on('screen-share-started', async (data: { userId: string; username: string }) => {
			if (!$socket) return;
			// Viewer receives notification that someone started sharing
			// They will receive an offer next
		});

		$socket.on('screen-share-stopped', (userId: string) => {
			removeScreenShare(userId);
		});

		$socket.on('webrtc-offer', async (data: { offer: RTCSessionDescriptionInit; senderId: string }) => {
			if (!$socket) return;

			const user = $users.find(u => u.id === data.senderId);
			if (user) {
				await handleOffer($socket, data.senderId, user.username, data.offer);
			}
		});

		$socket.on('webrtc-answer', async (data: { answer: RTCSessionDescriptionInit; senderId: string }) => {
			await handleAnswer(data.senderId, data.answer);
		});

		$socket.on('webrtc-ice-candidate', async (data: { candidate: RTCIceCandidateInit; senderId: string }) => {
			await handleIceCandidate(data.senderId, data.candidate);
		});

		// When someone joins and we're sharing, create an offer for them
		$socket.on('user-joined', async (user: any) => {
			if ($isSharing && $socket) {
				setTimeout(() => {
					if ($socket) {
						createOffer($socket, user.id);
					}
				}, 1000);
			}
		});
	});
</script>

<div class="screen-share-container">
	<div class="header">
		<h2>🖥️ Screen Sharing</h2>
		{#if $isSharing}
			<button on:click={handleStopShare} class="stop-btn">
				Stop Sharing
			</button>
		{:else}
			<button on:click={handleStartShare}>
				Start Sharing
			</button>
		{/if}
	</div>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	<div class="screens">
		{#if $isSharing && localStream}
			<div class="screen-item">
				<div class="screen-header">
					<span class="badge">Your Screen</span>
				</div>
				<video
					srcObject={localStream}
					autoplay
					muted
					playsinline
				></video>
			</div>
		{/if}

		{#each $screenShares as share (share.userId)}
			<div class="screen-item">
				<div class="screen-header">
					<span class="username">{share.username}'s Screen</span>
				</div>
				<video
					srcObject={share.stream}
					autoplay
					playsinline
				></video>
			</div>
		{/each}

		{#if !$isSharing && $screenShares.length === 0}
			<div class="empty-state">
				<p>No active screen shares</p>
				<p class="hint">Click "Start Sharing" to share your screen</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.screen-share-container {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
	}

	.header {
		padding: 1rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header h2 {
		font-size: 1.25rem;
	}

	.stop-btn {
		background: var(--error);
	}

	.stop-btn:hover {
		background: #dd3030;
	}

	.error {
		padding: 1rem;
		background: rgba(255, 74, 74, 0.1);
		color: var(--error);
		border-left: 3px solid var(--error);
		margin: 1rem;
	}

	.screens {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 1rem;
		align-content: start;
	}

	.screen-item {
		background: var(--bg-secondary);
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid var(--border);
	}

	.screen-header {
		padding: 0.75rem;
		background: var(--bg-tertiary);
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.badge {
		background: var(--accent);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.username {
		font-weight: 600;
		color: var(--accent);
	}

	video {
		width: 100%;
		aspect-ratio: 16 / 9;
		background: black;
		display: block;
	}

	.empty-state {
		grid-column: 1 / -1;
		text-align: center;
		padding: 4rem 2rem;
		color: var(--text-secondary);
	}

	.empty-state p {
		margin-bottom: 0.5rem;
	}

	.hint {
		font-size: 0.85rem;
		color: var(--text-secondary);
		opacity: 0.7;
	}
</style>
