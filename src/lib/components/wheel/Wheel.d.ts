declare module 'spin-wheel' {
	class Wheel {
		constructor(container, props = {});

		remove(): void;
		spin(speed: number = 0);
		getCurrentIndex(): number;
		onSpin: () => void;
		onRest: (event: { currentIndex: number }) => void;
		onCurrentIndexChange: (event: { currentIndex: number }) => void;
		items: any[];
	}
}
