import type { GameContext } from '$lib/game/gameContext';

/**
 * Module-level server GameContext.
 * The server sets this before processing any action so that Player/tileActions/class code
 * can call wheel generators without importing a specific context implementation.
 *
 * This works because server action processing is synchronous —
 * the context won't change between setServerGameContext() and the action completing.
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
