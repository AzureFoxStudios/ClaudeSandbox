<script lang="ts">
	import type { Message } from '$lib/socket';

	export let messages: Message[];

	function formatTime(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

{#each messages as message (message.id)}
	<div class="message">
		<div class="message-header">
			<span class="username">{message.user}</span>
			<span class="timestamp">{formatTime(message.timestamp)}</span>
		</div>
		<div class="message-content">
			{#if message.type === 'gif' && message.gifUrl}
				<img src={message.gifUrl} alt="GIF" class="gif" />
			{:else}
				<p>{message.text}</p>
			{/if}
		</div>
	</div>
{/each}

<style>
	.message {
		background: var(--bg-secondary);
		padding: 0.75rem;
		border-radius: 8px;
		border-left: 3px solid var(--accent);
	}

	.message-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.username {
		font-weight: 600;
		color: var(--accent);
		font-size: 0.9rem;
	}

	.timestamp {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.message-content p {
		color: var(--text-primary);
		line-height: 1.5;
		word-wrap: break-word;
	}

	.gif {
		max-width: 100%;
		max-height: 300px;
		border-radius: 4px;
		display: block;
	}
</style>
