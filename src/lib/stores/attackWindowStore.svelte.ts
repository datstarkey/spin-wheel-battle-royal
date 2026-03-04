type AttackWindow = {
	name: string;
	close: () => void;
} | null;

let _currentAttackWindow: AttackWindow = $state(null);

export function getCurrentAttackWindow(): AttackWindow {
	return _currentAttackWindow;
}

export function setCurrentAttackWindow(value: AttackWindow) {
	_currentAttackWindow = value;
}
