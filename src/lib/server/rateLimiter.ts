/**
 * Per-socket rate limiter to prevent action spam.
 * Tracks the last action timestamp per socket and rejects actions
 * that arrive faster than the minimum interval.
 */
export class PerSocketRateLimiter {
	private lastActionTime = new Map<string, number>();
	private readonly minIntervalMs: number;

	constructor(minIntervalMs: number = 100) {
		this.minIntervalMs = minIntervalMs;
	}

	/** Returns true if the action should be throttled */
	isThrottled(socketId: string): boolean {
		const now = Date.now();
		const last = this.lastActionTime.get(socketId) ?? 0;
		if (now - last < this.minIntervalMs) return true;
		this.lastActionTime.set(socketId, now);
		return false;
	}

	/** Clean up tracking for a disconnected socket */
	removeSocket(socketId: string) {
		this.lastActionTime.delete(socketId);
	}
}
