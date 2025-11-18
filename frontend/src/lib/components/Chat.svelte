<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { messages, typingUsers, sendMessage, sendTyping } from '$lib/socket';
	import GiphyPicker from './GiphyPicker.svelte';
	import MessageList from './MessageList.svelte';
	import ExportButton from './ExportButton.svelte';

	let messageInput = '';
	let chatContainer: HTMLElement;
	let typingTimeout: number;
	let showGiphyPicker = false;

	async function scrollToBottom() {
		await tick();
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	$: if ($messages.length) {
		scrollToBottom();
	}

	function handleInput() {
		sendTyping(true);

		if (typingTimeout) {
			clearTimeout(typingTimeout);
		}

		typingTimeout = setTimeout(() => {
			sendTyping(false);
		}, 1000) as unknown as number;
	}

	function handleSubmit() {
		if (messageInput.trim()) {
			sendMessage(messageInput.trim());
			messageInput = '';
			sendTyping(false);

			if (typingTimeout) {
				clearTimeout(typingTimeout);
			}
		}
	}

	function handleGifSelect(event: CustomEvent<string>) {
		sendMessage('', 'gif', event.detail);
		showGiphyPicker = false;
	}

	onMount(() => {
		scrollToBottom();
	});
</script>

<div class="chat-container">
	<div class="chat-header">
		<h2>💬 Chat</h2>
		<ExportButton />
	</div>

	<div class="messages" bind:this={chatContainer}>
		<MessageList messages={$messages} />

		{#if $typingUsers.length > 0}
			<div class="typing-indicator">
				<span class="typing-dots"></span>
				<span>{$typingUsers.join(', ')} {$typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
			</div>
		{/if}
	</div>

	{#if showGiphyPicker}
		<GiphyPicker
			on:select={handleGifSelect}
			on:close={() => showGiphyPicker = false}
		/>
	{/if}

	<div class="input-container">
		<button
			class="gif-button"
			on:click={() => showGiphyPicker = !showGiphyPicker}
			title="Add GIF"
		>
			GIF
		</button>
		<input
			type="text"
			bind:value={messageInput}
			on:input={handleInput}
			on:keydown={(e) => e.key === 'Enter' && handleSubmit()}
			placeholder="Type a message..."
			maxlength="500"
		/>
		<button on:click={handleSubmit} disabled={!messageInput.trim()}>
			Send
		</button>
	</div>
</div>

<style>
	.chat-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		position: relative;
	}

	.chat-header {
		padding: 1rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.chat-header h2 {
		font-size: 1.25rem;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.typing-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-style: italic;
		padding: 0.5rem;
	}

	.typing-dots {
		display: inline-block;
		width: 4px;
		height: 4px;
		background: var(--accent);
		border-radius: 50%;
		animation: typing 1.4s infinite;
		position: relative;
	}

	.typing-dots::before,
	.typing-dots::after {
		content: '';
		position: absolute;
		width: 4px;
		height: 4px;
		background: var(--accent);
		border-radius: 50%;
		animation: typing 1.4s infinite;
	}

	.typing-dots::before {
		left: -8px;
		animation-delay: 0.2s;
	}

	.typing-dots::after {
		left: 8px;
		animation-delay: 0.4s;
	}

	@keyframes typing {
		0%, 60%, 100% {
			opacity: 0.3;
		}
		30% {
			opacity: 1;
		}
	}

	.input-container {
		padding: 1rem;
		background: var(--bg-secondary);
		border-top: 1px solid var(--border);
		display: flex;
		gap: 0.5rem;
	}

	.gif-button {
		background: var(--bg-tertiary);
		color: var(--accent);
		font-weight: 600;
		padding: 0.5rem 0.75rem;
	}

	.gif-button:hover {
		background: var(--border);
	}

	input {
		flex: 1;
	}
</style>
