declare module 'spin-wheel' {
	class Wheel {
		constructor(container, props = {});

		remove(): void;
		spin(speed: number = 0);
		spinToItem(
			itemIndex: number,
			duration?: number,
			spinToCenter?: boolean,
			numberOfRevolutions?: number,
			direction?: number,
			easingFunction?: (n: number) => number
		): void;
		getCurrentIndex(): number;
		onSpin: () => void;
		onRest: (event: { currentIndex: number }) => void;
		onCurrentIndexChange: (event: { currentIndex: number }) => void;
		items: unknown[];
	}
}
