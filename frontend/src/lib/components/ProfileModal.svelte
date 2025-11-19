<script lang="ts">
	import { updateProfile, currentUser, type User } from '$lib/socket';
	import { browser } from '$app/environment';

	export let isOpen = false;
	export let user: User | null = null;
	export let isOwnProfile = false;

	let selectedStatus: 'active' | 'away' | 'busy' = user?.status || 'active';
	let profilePictureUrl = user?.profilePicture || '';
	let imageFile: File | null = null;
	let previewUrl: string | null = null;
	let userNote = '';
	let isEditingNote = false;

	$: if (user) {
		selectedStatus = user.status;
		profilePictureUrl = user.profilePicture || '';
		loadUserNote();
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
		isOpen = false;
		imageFile = null;
		previewUrl = null;
		isEditingNote = false;
	}

	function handleFileInput(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (file && file.type.startsWith('image/')) {
			imageFile = file;
			const reader = new FileReader();
			reader.onload = (e) => {
				previewUrl = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function saveProfile() {
		if (!isOwnProfile) return;

		// Convert image to base64 if selected
		if (imageFile && previewUrl) {
			updateProfile(selectedStatus, previewUrl);
		} else if (selectedStatus !== user?.status) {
			updateProfile(selectedStatus, undefined);
		}

		closeModal();
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'active':
				return '#10b981'; // green
			case 'away':
				return '#f59e0b'; // amber
			case 'busy':
				return '#ef4444'; // red
			default:
				return '#6b7280'; // gray
		}
	}
</script>

{#if isOpen && user}
	<div class="modal-overlay" on:click={closeModal}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h2>{isOwnProfile ? 'Your Profile' : user.username}</h2>
				<button class="close-btn" on:click={closeModal}>&times;</button>
			</div>

			<div class="modal-body">
				<!-- Profile Picture -->
				<div class="profile-picture-section">
					<div class="profile-picture-container">
						{#if previewUrl || user.profilePicture}
							<img
								src={previewUrl || user.profilePicture}
								alt={user.username}
								class="profile-picture"
							/>
						{:else}
							<div class="profile-picture-placeholder" style="background-color: {user.color}">
								{user.username.charAt(0).toUpperCase()}
							</div>
						{/if}
					</div>

					{#if isOwnProfile}
						<div class="upload-section">
							<label for="profile-picture" class="upload-label">
								{previewUrl || user.profilePicture ? 'Change Picture' : 'Upload Picture'}
							</label>
							<input
								id="profile-picture"
								type="file"
								accept="image/*"
								on:change={handleFileInput}
								class="file-input"
							/>
						</div>
					{/if}
				</div>

				<!-- User Info -->
				<div class="user-info">
					<div class="info-row">
						<span class="info-label">Username:</span>
						<span class="info-value">{user.username}</span>
					</div>
				</div>

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

			{#if isOwnProfile}
				<div class="modal-footer">
					<button class="cancel-btn" on:click={closeModal}>Cancel</button>
					<button class="save-btn" on:click={saveProfile}>Save Changes</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		width: 90%;
		max-width: 500px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 2rem;
		color: #6b7280;
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
		background-color: #f3f4f6;
		color: #111827;
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
	}

	.profile-picture {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid #e5e7eb;
	}

	.profile-picture-placeholder {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
		font-weight: bold;
		color: white;
		border: 3px solid #e5e7eb;
	}

	.upload-section {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.upload-label {
		display: inline-block;
		padding: 0.5rem 1rem;
		background-color: #3b82f6;
		color: white;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.upload-label:hover {
		background-color: #2563eb;
	}

	.file-input {
		display: none;
	}

	.user-info {
		margin-bottom: 1.5rem;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f3f4f6;
	}

	.info-label {
		font-weight: 500;
		color: #6b7280;
	}

	.info-value {
		color: #111827;
		font-weight: 500;
	}

	.notes-section {
		margin-top: 1.5rem;
		padding: 1rem;
		background-color: #f9fafb;
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
		color: #374151;
		font-size: 0.875rem;
	}

	.edit-note-btn {
		padding: 0.375rem 0.75rem;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.edit-note-btn:hover {
		background-color: #2563eb;
	}

	.note-textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-family: inherit;
		font-size: 0.875rem;
		resize: vertical;
		min-height: 80px;
	}

	.note-textarea:focus {
		outline: none;
		border-color: #3b82f6;
		ring: 2px;
		ring-color: #3b82f6;
	}

	.note-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
		justify-content: flex-end;
	}

	.cancel-note-btn,
	.save-note-btn {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.cancel-note-btn {
		background: white;
		border: 1px solid #d1d5db;
		color: #374151;
	}

	.cancel-note-btn:hover {
		background-color: #f3f4f6;
	}

	.save-note-btn {
		background-color: #3b82f6;
		border: 1px solid #3b82f6;
		color: white;
	}

	.save-note-btn:hover {
		background-color: #2563eb;
	}

	.note-display {
		padding: 0.75rem;
		background: white;
		border-radius: 6px;
		font-size: 0.875rem;
		color: #374151;
		line-height: 1.5;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.note-placeholder {
		padding: 0.75rem;
		color: #9ca3af;
		font-size: 0.875rem;
		font-style: italic;
		text-align: center;
	}

	.status-section {
		margin-top: 1.5rem;
	}

	.status-label {
		display: block;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.75rem;
	}

	.status-options {
		display: flex;
		gap: 0.5rem;
	}

	.status-btn {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 2px solid #e5e7eb;
		background: white;
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		transition: all 0.2s;
	}

	.status-btn:hover {
		border-color: #3b82f6;
		background-color: #eff6ff;
	}

	.status-btn.selected {
		border-color: #3b82f6;
		background-color: #3b82f6;
		color: white;
	}

	.status-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		display: inline-block;
	}

	.status-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: #f9fafb;
		border-radius: 8px;
		margin-top: 1rem;
	}

	.status-text {
		font-weight: 500;
		color: #374151;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
		background-color: #f9fafb;
	}

	.cancel-btn,
	.save-btn {
		padding: 0.625rem 1.25rem;
		border-radius: 8px;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.cancel-btn {
		background: white;
		border: 1px solid #d1d5db;
		color: #374151;
	}

	.cancel-btn:hover {
		background-color: #f3f4f6;
		border-color: #9ca3af;
	}

	.save-btn {
		background-color: #3b82f6;
		border: 1px solid #3b82f6;
		color: white;
	}

	.save-btn:hover {
		background-color: #2563eb;
		border-color: #2563eb;
	}
</style>
