import { z } from 'zod';
export function createForm<T>(type: z.ZodType<T>, initialValue: T, onValid: (value: T) => void) {
	let errors = $state<Record<string, string>>({});
	let body = $state(initialValue);

	function submit() {
		const result = type.safeParse(body);
		if (!result.success) {
			errors = {
				hasRan: 'true'
			};
			for (const issue of result.error.issues) {
				errors[issue.path.join('.')] = issue.message;
				// errors[issue.path.join('.')] = issue.message;
				// 	updater[issue.path.join('.')] = issue.message;
				// 	return updater;
				// });
				// console.log(errors);
			}
			console.log(errors);
		} else {
			onValid(body);
		}
	}

	return {
		get body() {
			return body;
		},
		set body(value) {
			body = value;
		},
		submit,
		get errors() {
			return errors;
		}
	};
}

export function errorClass(key: string, errors: Record<string, string>) {
	if (!errors['hasRan']) return '';
	const result = errors[key] ? 'input-error' : 'input-success';
	console.log(result);
	return result;
}
