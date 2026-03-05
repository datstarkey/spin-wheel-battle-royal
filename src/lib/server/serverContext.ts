import type { GameContext } from '$lib/game/gameContext';

/**
 * @deprecated Use `$lib/game/serverContext` instead. This module exists for backward
 * compatibility — the canonical server context lives in `$lib/game/` because it's
 * imported by shared game logic that also runs on the client during deserialization.
 * SvelteKit forbids `$lib/server/` imports from reaching the browser.
 */
let _ctx: GameContext | null = null;

export function setServerGameContext(ctx: GameContext) {
	_ctx = ctx;
}

export function getServerGameContext(): GameContext {
	if (!_ctx)
		throw new Error('No server game context — setServerGameContext() must be called first');
	return _ctx;
}
