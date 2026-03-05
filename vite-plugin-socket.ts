import type { Plugin, ViteDevServer } from 'vite';
import type { Server } from 'http';

/**
 * Vite plugin that attaches the socket.io server during development.
 * In production, socket.io is attached via hooks.server.ts.
 */
export function socketIOPlugin(): Plugin {
	return {
		name: 'socket-io-dev',
		configureServer(server: ViteDevServer) {
			if (!server.httpServer) return;

			// Use ssrLoadModule so Vite resolves $lib and other aliases
			server
				.ssrLoadModule('./src/lib/server/socketServer')
				.then(({ initSocketServer }) => {
					initSocketServer(server.httpServer as unknown as Server);
					console.log('[socket.io] Dev server attached');
				})
				.catch((err) => {
					console.error('[socket.io] Failed to initialize:', err);
				});
		}
	};
}
