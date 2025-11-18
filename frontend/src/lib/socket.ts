import { writable } from 'svelte/store';
import { io, Socket } from 'socket.io-client';
import { browser } from '$app/environment';

export interface Message {
	id: string;
	user: string;
	text: string;
	timestamp: number;
	type: 'text' | 'gif';
	gifUrl?: string;
}

export interface User {
	id: string;
	username: string;
	color: string;
}

export const socket = writable<Socket | null>(null);
export const messages = writable<Message[]>([]);
export const users = writable<User[]>([]);
export const typingUsers = writable<string[]>([]);
export const currentUser = writable<User | null>(null);
export const connected = writable(false);

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

	return socketInstance;
}

export function sendMessage(text: string, type: 'text' | 'gif' = 'text', gifUrl?: string) {
	socketInstance?.emit('message', { text, type, gifUrl });
}

export function sendTyping(isTyping: boolean) {
	socketInstance?.emit('typing', isTyping);
}

export function disconnect() {
	socketInstance?.disconnect();
	socket.set(null);
	socketInstance = null;
}
