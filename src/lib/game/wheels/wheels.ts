import type { SpinWheelItem, WheelTheme } from '$lib/components/wheel/types';

export type WheelBase = SpinWheelItem[];

export interface CustomWheelConfig {
	items: WheelBase;
	theme?: WheelTheme;
}
