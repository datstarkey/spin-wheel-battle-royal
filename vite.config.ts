import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { socketIOPlugin } from './vite-plugin-socket';

export default defineConfig({
	server: {
		port: 7654
	},
	plugins: [tailwindcss(), socketIOPlugin(), sveltekit()]
});
