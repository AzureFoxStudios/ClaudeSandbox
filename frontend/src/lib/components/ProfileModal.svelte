<script lang="ts">
	import { updateProfile, currentUser, type User, channels, createDM, sendMessage, dmPanelSignal } from '$lib/socket';
	import { browser } from '$app/environment';
	import { get } from 'svelte/store';
	import AvatarEditor from './AvatarEditor.svelte';

	export let isOpen = false;
	export let user: User | null = null;
	export let isOwnProfile = false;

	// State for pending changes
	let originalStatus: 'active' | 'away' | 'busy';
	let selectedStatus: 'active' | 'away' | 'busy';
	let pendingPfpFile: File | null = null;
	let pendingPfpUrl: string | null = null;

	let userNote = '';
	let isEditingNote = false;
	let dmMessage = '';
	let showAvatarEditor = false;
	let isLoading = false;
	let error = '';

	// Detect if there are any pending changes
	$: statusChanged = selectedStatus !== originalStatus;
	$: pfpChanged = pendingPfpUrl !== null;
	$: hasPendingChanges = statusChanged || pfpChanged;

	// When the modal opens, initialize the pending state from the user prop
	$: if (isOpen && user) {
		originalStatus = user.status;
		selectedStatus = user.status;
		pendingPfpFile = null;
		pendingPfpUrl = null;
		loadUserNote();
		dmMessage = '';
		showAvatarEditor = false;
		isLoading = false;
		error = '';
	}

	function cancelChanges() {
		selectedStatus = originalStatus;
		pendingPfpFile = null;
		pendingPfpUrl = null;
		error = '';
	}

	function loadUserNote() {
		if (!browser || !user) return;
		const notes = JSON.parse(localStorage.getItem('userNotes') || '{}');
		userNote = notes[user.id] || '';
	}

	function saveUserNote() {
		if (!browser || !user) return;
		const notes = JSON.parse(localStorage.getItem('userNotes') || '{}');
		if (userNote.trim()) {
			notes[user.id] = userNote;
		} else {
			delete notes[user.id];
		}
		localStorage.setItem('userNotes', JSON.stringify(notes));
		isEditingNote = false;
	}

	function closeModal() {
		if (isLoading) return;
		isOpen = false;
	}

	function handleAvatarChange(event: CustomEvent<{ file: File; dataUrl: string }>) {
		pendingPfpFile = event.detail.file;
		pendingPfpUrl = event.detail.dataUrl;
	}

	async function saveProfile() {
		if (!isOwnProfile || isLoading || !user) return;

		isLoading = true;
		error = '';
		let newPfpUrl: string | undefined = undefined;

		try {
			// 1. If there's a new PFP file, upload it first
			if (pendingPfpFile) {
				const formData = new FormData();
				formData.append('file', pendingPfpFile);
				
				const serverUrl = window.location.origin.includes(':5173') ? 'http://localhost:3000' : window.location.origin;
				const response = await fetch(`${serverUrl}/api/upload`, {
					method: 'POST',
					body: formData
				});

				if (!response.ok) throw new Error('Image upload failed.');
				
				const result = await response.json();
				if (!result.success) throw new Error(result.error || 'Image upload failed.');
				
				newPfpUrl = result.fileUrl;
			}

			// 2. Check if any data has actually changed
			const statusChanged = selectedStatus !== user.status;
			const pfpChanged = newPfpUrl !== undefined;

			if (statusChanged || pfpChanged) {
				// 3. Send a single update event with all changes
				updateProfile(
					statusChanged ? selectedStatus : undefined,
					pfpChanged ? newPfpUrl : undefined
				);
			}

			closeModal();

		} catch (e: any) {
			error = e.message;
		} finally {
			isLoading = false;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'active': return 'var(--status-online)';
			case 'away': return 'var(--status-away)';
			case 'busy': return 'var(--status-busy)';
			default: return 'var(--status-offline)';
		}
	}
	
	async function handleSendDM() {
		if (!dmMessage.trim() || !user) return;

		const self = get(currentUser);
		if (!self) return;

		const memberIds = [self.id, user.id].sort();
		const dmId = `dm-${memberIds.join('-')}`;
		
		const allChannels = get(channels);
		const existingDM = allChannels.find(ch => ch.id === dmId);

		if (existingDM) {
			sendMessage(dmId, dmMessage.trim());
			dmPanelSignal.set({ channelId: dmId, otherUser: user });
			closeModal();
		} else {
			createDM(user.id);
			const unsubscribe = channels.subscribe(chs => {
				const newDM = chs.find(ch => ch.id === dmId);
				if (newDM) {
					sendMessage(dmId, dmMessage.trim());
					dmPanelSignal.set({ channelId: dmId, otherUser: user });
					unsubscribe();
					closeModal();
				}
			});
		}
	}
</script>

{#if isOpen && user}
	<div class="modal-overlay" on:click={closeModal}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h2>{isOwnProfile ? 'Your Profile' : user.username}</h2>
				<button class="close-btn" on:click={closeModal} disabled={isLoading}>&times;</button>
			</div>

			<div class="modal-body">
				<!-- Profile Picture -->
				<div class="profile-picture-section">
					<button class="profile-picture-container" class:has-pending={pfpChanged} on:click={() => isOwnProfile && (showAvatarEditor = true)} disabled={!isOwnProfile}>
						{#if pendingPfpUrl || (isOwnProfile ? $currentUser?.profilePicture : user.profilePicture)}
							<img
								src={pendingPfpUrl || (isOwnProfile ? $currentUser?.profilePicture : user.profilePicture)}
								alt={user.username}
								class="profile-picture"
							/>
						{:else}
							<div class="profile-picture-placeholder" style="background-color: {user.color}">
								{user.username.charAt(0).toUpperCase()}
							</div>
						{/if}
						{#if isOwnProfile && !pfpChanged}
							<div class="edit-overlay">Click to Edit</div>
						{/if}
					</button>
					{#if pfpChanged}
						<span class="pending-badge">New image selected</span>
					{/if}
				</div>

				<!-- User Info -->
				<div class="user-info">
					<div class="info-row">
						<span class="info-label">Username:</span>
						<span class="info-value">{user.username}</span>
					</div>
				</div>
				
				{#if !isOwnProfile}
				<div class="dm-section">
					<textarea class="dm-input" bind:value={dmMessage} placeholder="Send a message to {user.username}" rows="1"></textarea>
					<button class="dm-send-btn" on:click={handleSendDM} disabled={!dmMessage.trim()}>Send</button>
				</div>
				{/if}

				<!-- Personal Notes Section (for other users) -->
				{#if !isOwnProfile}
					<div class="notes-section">
						<div class="notes-header">
							<label class="notes-label">Personal Notes:</label>
							{#if !isEditingNote}
								<button class="edit-note-btn" on:click={() => (isEditingNote = true)}>
									{userNote ? 'Edit' : 'Add Note'}
								</button>
							{/if}
						</div>

						{#if isEditingNote}
							<textarea
								bind:value={userNote}
								placeholder="Add personal notes (e.g., nickname, birthday, interests...)"
								class="note-textarea"
								rows="3"
							></textarea>
							<div class="note-actions">
								<button class="cancel-note-btn" on:click={() => { isEditingNote = false; loadUserNote(); }}>
									Cancel
								</button>
								<button class="save-note-btn" on:click={saveUserNote}>
									Save Note
								</button>
							</div>
						{:else if userNote}
							<div class="note-display">
								{userNote}
							</div>
						{:else}
							<div class="note-placeholder">
								No notes yet. Click "Add Note" to remember details about this user.
							</div>
						{/if}
					</div>
				{/if}

				<!-- Status Selector (only for own profile) -->
				{#if isOwnProfile}
					<div class="status-section">
						<label class="status-label">Status:</label>
						<div class="status-options">
							<button
								class="status-btn {selectedStatus === 'active' ? 'selected' : ''}"
								on:click={() => (selectedStatus = 'active')}
							>
								<span class="status-dot" style="background-color: {getStatusColor('active')}"></span>
								Active
							</button>
							<button
								class="status-btn {selectedStatus === 'away' ? 'selected' : ''}"
								on:click={() => (selectedStatus = 'away')}
							>
								<span class="status-dot" style="background-color: {getStatusColor('away')}"></span>
								Away
							</button>
							<button
								class="status-btn {selectedStatus === 'busy' ? 'selected' : ''}"
								on:click={() => (selectedStatus = 'busy')}
							>
								<span class="status-dot" style="background-color: {getStatusColor('busy')}"></span>
								Busy
							</button>
						</div>
					</div>
				{:else}
					<div class="status-display">
						<span class="status-dot" style="background-color: {getStatusColor(user.status)}"></span>
						<span class="status-text">{user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span>
					</div>
				{/if}
			</div>

			{#if isOwnProfile && hasPendingChanges}
				<div class="modal-footer">
					{#if error}<p class="error">{error}</p>{/if}
					<button class="cancel-btn" on:click={cancelChanges} disabled={isLoading}>Discard Changes</button>
					<button class="save-btn" on:click={saveProfile} disabled={isLoading}>
						{#if isLoading}Saving...{:else}Save Changes{/if}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if showAvatarEditor}
	<AvatarEditor bind:isOpen={showAvatarEditor} on:change={handleAvatarChange} />
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--modal-overlay);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
	}

	.modal-content {
		background: var(--modal-bg);
		border-radius: 12px;
		width: 90%;
		max-width: 500px;
		box-shadow: 0 8px 32px 0 var(--shadow-lg);
		overflow: hidden;
		border: var(--modal-border);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		background-color: var(--modal-header-bg);
		border-bottom: var(--modal-border);
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--modal-text);
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 2rem;
		color: var(--modal-text-secondary);
		cursor: pointer;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		transition: background-color 0.2s;
	}

	.close-btn:hover {
		background-color: var(--ui-bg-light);
		color: var(--modal-text);
	}

	.modal-body {
		padding: 2rem 1.5rem;
	}

	.profile-picture-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 2rem;
	}

	.profile-picture-container {
		width: 120px;
		height: 120px;
		margin-bottom: 1rem;
		position: relative;
		cursor: default;
		border-radius: 50%;
		overflow: hidden;
		background: transparent;
		border: none;
		padding: 0;
	}

	.profile-picture-container[disabled] {
		cursor: default;
	}

	.profile-picture-container:not([disabled]) {
		cursor: pointer;
	}

	.profile-picture {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.profile-picture-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
		font-weight: bold;
		color: var(--text-primary);
	}
	
	.edit-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0,0,0,0.5);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.2s;
		font-weight: 600;
	}

	.profile-picture-container:not([disabled]):hover .edit-overlay {
		opacity: 1;
	}

	.profile-picture-container.has-pending {
		border: 3px solid var(--accent);
	}

	.pending-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		background: var(--accent);
		color: white;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: 12px;
	}

	.user-info {
		margin-bottom: 1.5rem;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--ui-bg-lighter);
	}

	.info-label {
		font-weight: 500;
		color: var(--modal-text-secondary);
	}

	.info-value {
		color: var(--modal-text);
		font-weight: 500;
	}

	.dm-section {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.dm-input {
		flex: 1;
		resize: none;
		padding: 0.75rem;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--bg-tertiary);
		color: var(--text-primary);
		font-family: inherit;
		font-size: 0.9rem;
	}

	.dm-input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.dm-send-btn {
		padding: 0.75rem 1rem;
		background: var(--accent);
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.dm-send-btn:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.dm-send-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.notes-section {
		margin-top: 1.5rem;
		padding: 1rem;
		background-color: var(--ui-bg-lighter);
		border-radius: 8px;
	}

	.notes-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.notes-label {
		font-weight: 500;
		color: var(--ui-text);
		font-size: 0.875rem;
	}

	.edit-note-btn {
		background: var(--accent);
		color: var(--text-primary);
	}

	.edit-note-btn:hover {
		background: var(--accent-hover);
	}

	.note-textarea {
		width: 100%;
		padding: 0.75rem;
		border: none;
		border-radius: 6px;
		font-family: inherit;
		font-size: 0.875rem;
		resize: vertical;
		min-height: 80px;
		background-color: var(--ui-bg-light);
		color: var(--text-primary);
	}

	.note-textarea:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--accent);
	}

	.cancel-note-btn,
	.save-note-btn {
		border: none;
	}

	.cancel-note-btn {
		background: var(--ui-bg-light);
		color: var(--text-primary);
	}

	.cancel-note-btn:hover {
		background-color: var(--bg-hover);
	}

	.save-note-btn {
		background: var(--accent);
		color: var(--text-primary);
	}

	.save-note-btn:hover {
		background: var(--accent-hover);
	}

	.note-display {
		padding: 0.75rem;
		background: var(--ui-bg-light);
		border-radius: 6px;
		font-size: 0.875rem;
		color: var(--ui-text);
		line-height: 1.5;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.note-placeholder {
		padding: 0.75rem;
		color: var(--modal-text-muted);
		font-size: 0.875rem;
		font-style: italic;
		text-align: center;
	}

	.status-label {
		color: var(--modal-text);
	}

	.status-btn {
		background: var(--ui-bg-lighter);
		color: var(--modal-text);
		border: 2px solid transparent;
	}

	.status-btn:hover {
		background-color: var(--bg-hover);
		border-color: var(--accent);
	}

	.status-btn.selected {
		background-color: var(--accent);
		color: var(--text-primary);
		border-color: var(--accent);
	}

	.status-text {
		color: var(--modal-text);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 0.75rem;
		padding: 1.25rem 1.5rem;
		border-top: var(--modal-border);
		background-color: var(--modal-header-bg);
	}

	.modal-footer .error {
		margin: 0;
		margin-right: auto;
		color: var(--color-danger);
		font-size: 0.875rem;
	}

	.cancel-btn,
	.save-btn {
		border: none;
	}

	.cancel-btn {
		background: var(--ui-bg-light);
		color: var(--text-primary);
	}

	.cancel-btn:hover {
		background-color: var(--bg-hover);
	}

	.save-btn {
		background: var(--accent);
		color: var(--text-primary);
	}

	.save-btn:hover {
		background: var(--accent-hover);
	}
</style>