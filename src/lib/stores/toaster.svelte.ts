import { createToaster } from '@skeletonlabs/skeleton-svelte';

// Create a singleton toaster instance
export const toaster = createToaster({
	placement: 'bottom-end'
});

// Helper functions that match the svelte-french-toast API
export const toast = {
	success: (message: string) => {
		toaster.success({ title: 'Success', description: message });
	},
	error: (message: string) => {
		toaster.error({ title: 'Error', description: message });
	},
	info: (message: string) => {
		toaster.info({ title: 'Info', description: message });
	},
	warning: (message: string) => {
		toaster.warning({ title: 'Warning', description: message });
	}
};

export default toast;
