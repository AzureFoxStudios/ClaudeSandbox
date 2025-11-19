<script lang="ts">
	import type { Message } from '$lib/socket';
	import { currentUser } from '$lib/socket';

	export let message: Message;
	export let x: number = 0;
	export let y: number = 0;
	export let visible: boolean = false;
	export let onEdit: () => void;
	export let onDelete: () => void;
	export let onPin: () => void;
	export let onReply: () => void;

	$: isOwnMessage = message.userId === $currentUser?.id;
</script>

{#if visible}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="context-menu-overlay"
		on:click={() => (visible = false)}
	>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="context-menu"
			style="top: {y}px; left: {x}px;"
			on:click|stopPropagation
		>
			<button class="menu-item" on:click={onReply}>
				<span class="menu-icon">💬</span>
				Reply
			</button>

			{#if isOwnMessage}
				<button class="menu-item" on:click={onEdit}>
					<span class="menu-icon">✏️</span>
					Edit Message
				</button>
			{/if}

			<button class="menu-item" on:click={onPin}>
				<span class="menu-icon">{message.isPinned ? '📌' : '📍'}</span>
				{message.isPinned ? 'Unpin' : 'Pin'} Message
			</button>

			<button class="menu-item copy" on:click={() => {
				navigator.clipboard.writeText(message.text);
				visible = false;
			}}>
				<span class="menu-icon">📋</span>
				Copy Text
			</button>

			{#if isOwnMessage}
				<div class="menu-divider"></div>
				<button class="menu-item delete" on:click={onDelete}>
					<span class="menu-icon">🗑️</span>
					Delete Message
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.context-menu-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 999;
	}

	.context-menu {
		position: fixed;
		background: white;
		border-radius: 8px;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
		padding: 0.5rem;
		min-width: 180px;
		z-index: 1000;
		border: 1px solid #e5e7eb;
	}

	.menu-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.75rem;
		background: none;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		color: #374151;
		text-align: left;
		transition: background-color 0.15s;
	}

	.menu-item:hover {
		background-color: #f3f4f6;
	}

	.menu-item.delete {
		color: #dc2626;
	}

	.menu-item.delete:hover {
		background-color: #fee2e2;
	}

	.menu-icon {
		font-size: 1rem;
		width: 20px;
		display: inline-block;
	}

	.menu-divider {
		height: 1px;
		background-color: #e5e7eb;
		margin: 0.5rem 0;
	}
</style>
