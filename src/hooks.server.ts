import type { Handle } from '@sveltejs/kit';
import { initSocketServer } from '$lib/server/socketServer';

let socketInitialized = false;

export const handle: Handle = async ({ event, resolve }) => {
	// Attach socket.io in production (adapter-node provides the HTTP server)
	if (!socketInitialized && event.platform) {
		const httpServer = (event.platform as Record<string, unknown>).server;
		if (httpServer) {
			initSocketServer(httpServer as import('http').Server);
			socketInitialized = true;
		}
	}

	const response = await resolve(event);

	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	return response;
};
