export const MAX_NAME_LENGTH = 20;

/** Trim and collapse whitespace; undefined for names that are empty, too long or not strings */
export function normalizePlayerName(name: unknown): string | undefined {
	if (typeof name !== 'string') return undefined;
	const normalized = name.trim().replace(/\s+/g, ' ');
	return normalized.length > 0 && normalized.length <= MAX_NAME_LENGTH ? normalized : undefined;
}
