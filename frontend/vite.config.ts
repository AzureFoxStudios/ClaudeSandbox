import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		allowedHosts: ['ungruff-subtarsal-libby.ngrok-free.dev']
	},
	define: {
		'process.env': {}
	},
	plugins: [
		sveltekit()
	]
});
