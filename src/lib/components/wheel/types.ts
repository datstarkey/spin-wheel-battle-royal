export type SpinWheelItem = {
	label: string;
	weight?: number;
	data?: any;
	onWin?: (...args: never[]) => void;
};
