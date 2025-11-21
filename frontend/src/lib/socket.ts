import { writable } from 'svelte/store';
import { io, Socket } from 'socket.io-client';
import { browser } from '$app/environment';
import { showNotification } from './notifications';

export interface Message {
	id: string;
	user: string;
	userId: string;
	text: string;
	timestamp: number;
	type: 'text' | 'gif' | 'file';
	gifUrl?: string;
	fileUrl?: string;
	fileName?: string;
	fileSize?: number;
	isPinned?: boolean;
	isEdited?: boolean;
	replyTo?: string;
}

export interface User {
	id: string;
	username: string;
	color: string;
	status: 'active' | 'away' | 'busy';
	profilePicture?: string;
}

export const socket = writable<Socket | null>(null);
export const messages = writable<Message[]>([]);
export const users = writable<User[]>([]);
export const typingUsers = writable<string[]>([]);
export const currentUser = writable<User | null>(null);
export const connected = writable(false);
export const unreadCount = writable(0);
export const lastReadMessageId = writable<string | null>(null);

let socketInstance: Socket | null = null;

export function initSocket(username: string) {
	if (!browser) return;

	const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

	socketInstance = io(serverUrl);
	socket.set(socketInstance);

	socketInstance.on('connect', () => {
		console.log('Connected to server');
		connected.set(true);
		socketInstance?.emit('join', username);
	});

	socketInstance.on('disconnect', () => {
		console.log('Disconnected from server');
		connected.set(false);
	});

	socketInstance.on('init', (data: { messages: Message[]; users: User[]; excalidrawState: any }) => {
		messages.set(data.messages);
		users.set(data.users);

		// Find current user
		const user = data.users.find(u => u.id === socketInstance?.id);
		if (user) {
			currentUser.set(user);
		}
	});

	socketInstance.on('message', (message: Message) => {
		messages.update(msgs => [...msgs, message]);
		// Show notification for messages from other users
		const isCurrentUser = message.userId === socketInstance?.id;
		showNotification(message, isCurrentUser);

		// Increment unread count and track first unread if not from current user and page is hidden
		if (!isCurrentUser && document.hidden) {
			unreadCount.update(n => {
				// Set first unread message ID if this is the first unread
				if (n === 0) {
					lastReadMessageId.set(message.id);
				}
				return n + 1;
			});
		}
	});

	socketInstance.on('user-joined', (user: User) => {
		users.update(u => [...u, user]);
	});

	socketInstance.on('user-left', (data: { id: string; username: string }) => {
		users.update(u => u.filter(user => user.id !== data.id));
	});

	socketInstance.on('typing', (usernames: string[]) => {
		typingUsers.set(usernames);
	});

	socketInstance.on('profile-updated', (user: User) => {
		users.update(u => u.map(existingUser =>
			existingUser.id === user.id ? user : existingUser
		));
		// Update current user if it's them
		currentUser.update(cu => cu && cu.id === user.id ? user : cu);
	});

	socketInstance.on('message-edited', (data: { messageId: string; newText: string }) => {
		messages.update(msgs => msgs.map(msg =>
			msg.id === data.messageId ? { ...msg, text: data.newText, isEdited: true } : msg
		));
	});

	socketInstance.on('message-deleted', (messageId: string) => {
		messages.update(msgs => msgs.filter(msg => msg.id !== messageId));
	});

	socketInstance.on('message-pin-toggled', (data: { messageId: string; isPinned: boolean }) => {
		messages.update(msgs => msgs.map(msg =>
			msg.id === data.messageId ? { ...msg, isPinned: data.isPinned } : msg
		));
	});

	return socketInstance;
}

export function sendMessage(text: string, type: 'text' | 'gif' | 'file' = 'text', options?: {
	gifUrl?: string;
	fileUrl?: string;
	fileName?: string;
	fileSize?: number;
	replyTo?: string;
}) {
	socketInstance?.emit('message', { text, type, ...options });
}

export function editMessage(messageId: string, newText: string) {
	socketInstance?.emit('edit-message', { messageId, newText });
}

export function deleteMessage(messageId: string) {
	socketInstance?.emit('delete-message', messageId);
}

export function togglePinMessage(messageId: string) {
	socketInstance?.emit('toggle-pin-message', messageId);
}

export function sendTyping(isTyping: boolean) {
	socketInstance?.emit('typing', isTyping);
}

export function updateProfile(status?: 'active' | 'away' | 'busy', profilePicture?: string) {
	socketInstance?.emit('update-profile', { status, profilePicture });
}

export function disconnect() {
	socketInstance?.disconnect();
	socket.set(null);
	socketInstance = null;
}

export function markMessagesAsRead() {
	unreadCount.set(0);
	lastReadMessageId.set(null);
}
