import { get, writable } from 'svelte/store';
import { z } from 'zod';
export function createForm<T>(type: z.ZodType<T>, initialValue: T, onValid: (value: T) => void) {
	const errors = writable<Record<string, string>>({});
	const body = initialValue;

	function submit() {
		const result = type.safeParse(initialValue);
		if (!result.success) {
			errors.set({
				hasRan: 'true'
			});
			for (const issue of result.error.issues) {
				errors.update((updater) => {
					updater[issue.path.join('.')] = issue.message;
					return updater;
				});

				console.log(get(errors));
			}
		} else {
			onValid(body);
		}
	}

	return {
		body,
		submit,
		errors
	};
}

export function errorClass(key: string, errors: Record<string, string>) {
	if (!errors['hasRan']) return '';
	const result = errors[key] ? 'input-error' : 'input-success';
	console.log(result);
	return result;
}
