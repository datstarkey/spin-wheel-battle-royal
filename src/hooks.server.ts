import type { Handle, ServerInit } from '@sveltejs/kit';
import type { Server as HttpServer } from 'http';
import { initSocketServer } from '$lib/server/socketServer';

declare global {
	// eslint-disable-next-line no-var
	var __httpServer: HttpServer | undefined;
}

// In production, the custom server.js sets globalThis.__httpServer before importing handler.js.
// The init hook runs during that import, so socket.io attaches before the server starts listening.
export const init: ServerInit = async () => {
	if (globalThis.__httpServer) {
		initSocketServer(globalThis.__httpServer);
		console.log('[socket.io] Attached to production HTTP server');
	}
};

const ICONIFY_APIS = 'https://api.iconify.design https://api.unisvg.com https://api.simplesvg.com';

const CSP_DIRECTIVES = [
	"default-src 'self'",
	// SvelteKit requires inline scripts/styles for hydration
	"script-src 'self' 'unsafe-inline'",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
	// WebSocket connections for socket.io, Iconify icon data
	`connect-src 'self' ws: wss: ${ICONIFY_APIS}`,
	"img-src 'self' data:",
	"font-src 'self' https://fonts.gstatic.com",
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self'",
	"frame-ancestors 'none'"
].join('; ');

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Content-Security-Policy', CSP_DIRECTIVES);

	return response;
};
