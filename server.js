import { createServer } from 'node:http';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Create the HTTP server and expose it globally BEFORE importing handler.js.
// handler.js triggers SvelteKit's init hook (hooks.server.ts), which reads
// globalThis.__httpServer and attaches socket.io to it.
const httpServer = createServer();
globalThis.__httpServer = httpServer;

// Importing handler.js runs top-level await: server.init() → hooks init()
const { handler } = await import('./build/handler.js');

httpServer.on('request', handler);

httpServer.listen(+PORT, HOST, () => {
	console.log(`[server] Listening on http://${HOST}:${PORT}`);
});

// Graceful shutdown
function shutdown() {
	httpServer.closeIdleConnections();
	httpServer.close(() => process.exit(0));
	setTimeout(() => httpServer.closeAllConnections(), 30_000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
