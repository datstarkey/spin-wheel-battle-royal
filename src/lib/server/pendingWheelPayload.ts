import type { PendingWheelPayload } from '$lib/multiplayer/types';
import type { PendingWheel } from './gameRooms';

interface PendingWheelPayloadOptions {
	spinState?: PendingWheelPayload['spinState'];
	spinParams?: PendingWheelPayload['spinParams'];
}

export function toPendingWheelPayload(
	key: string,
	wheel: PendingWheel,
	options: PendingWheelPayloadOptions = {}
): PendingWheelPayload {
	return {
		key,
		items: wheel.items.map((item) => ({
			label: item.label,
			weight: item.weight
		})),
		theme: wheel.theme,
		forPlayerName: wheel.forPlayerName,
		shuffledOrder: wheel.shuffledOrder,
		spinState: options.spinState,
		spinParams: options.spinParams
	};
}
