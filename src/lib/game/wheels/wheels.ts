import type { SpinWheelItem, WheelTheme } from '$lib/components/wheel/types';

export type WheelBase = SpinWheelItem[];

export interface CustomWheelConfig {
	items: WheelBase;
	theme?: WheelTheme;
}

// Type that can be either the old array format or the new config format
export type CustomWheelData = WheelBase | CustomWheelConfig;

// Helper to normalize wheel data
export function normalizeWheelData(data: CustomWheelData): CustomWheelConfig {
	if (Array.isArray(data)) {
		return { items: data };
	}
	return data;
}
