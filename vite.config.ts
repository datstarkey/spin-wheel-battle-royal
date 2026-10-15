import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { socketIOPlugin } from './vite-plugin-socket.ts';

export default defineConfig({
	server: { port: 7654 },
	plugins: [
		tailwindcss(),
		socketIOPlugin(),
		sveltekit({
			preprocess: [vitePreprocess()],
			adapter: adapter()
		})
	]
});
