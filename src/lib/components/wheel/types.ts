export type SpinWheelItem = {
	label: string;
	weight?: number;
	data?: any;
	onWin?: (...args: never[]) => void;
};

export type WheelTheme = 'win' | 'lose' | 'loot' | 'casino' | 'shadow' | 'gambler' | 'damage' | 'button' | 'magic' | 'default';
