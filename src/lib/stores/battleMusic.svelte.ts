/**
 * Game Music Controller - State Machine
 * Uses HTML5 Audio for background, battle, and victory music
 *
 * States: 'idle' | 'background' | 'battle' | 'victory'
 * Only one track plays at a time. Background position is preserved.
 */

// LocalStorage keys
const STORAGE_KEY_MUTED = 'battleMusic:muted';
const STORAGE_KEY_VOLUME = 'battleMusic:volume';

// Load initial state from localStorage
function loadMutedState(): boolean {
	if (typeof window === 'undefined') return false;
	return localStorage.getItem(STORAGE_KEY_MUTED) === 'true';
}

function loadVolumeState(): number {
	if (typeof window === 'undefined') return 50;
	const stored = localStorage.getItem(STORAGE_KEY_VOLUME);
	return stored ? Math.max(0, Math.min(100, Number(stored))) : 50;
}

// Audio elements
let backgroundAudio: HTMLAudioElement | null = null;
let battleAudio: HTMLAudioElement | null = null;
let victoryAudio: HTMLAudioElement | null = null;

// Track background position for resuming
let backgroundPosition = 0;

// State machine
type MusicState = 'idle' | 'background' | 'battle' | 'victory';
let currentState = $state<MusicState>('idle');
let isReady = $state(false);
let isMuted = $state(loadMutedState());
let volume = $state(loadVolumeState());

/**
 * Stop all audio elements without changing state
 */
function stopAllAudio(): void {
	if (backgroundAudio && !backgroundAudio.paused) {
		backgroundPosition = backgroundAudio.currentTime;
		backgroundAudio.pause();
	}
	if (battleAudio) battleAudio.pause();
	if (victoryAudio) victoryAudio.pause();
}

/**
 * Transition to a new state
 */
function transitionTo(newState: MusicState): void {
	if (currentState === newState) return;

	// Save background position before stopping
	if (currentState === 'background' && backgroundAudio) {
		backgroundPosition = backgroundAudio.currentTime;
	}

	// Stop all audio
	stopAllAudio();

	// Update state
	currentState = newState;

	// If muted, don't play anything
	if (isMuted) return;

	// Start the appropriate audio
	switch (newState) {
		case 'background':
			if (backgroundAudio) {
				backgroundAudio.currentTime = backgroundPosition;
				backgroundAudio.play().catch(() => {});
			}
			break;
		case 'battle':
			if (battleAudio) {
				battleAudio.currentTime = 0;
				battleAudio.play().catch(() => {});
			}
			break;
		case 'victory':
			if (victoryAudio) {
				victoryAudio.currentTime = 0;
				victoryAudio.play().catch(() => {});
			}
			break;
		case 'idle':
			// Nothing to play
			break;
	}
}

/**
 * Initialize audio elements (call this on mount)
 */
export function initAudio(): void {
	if (typeof window === 'undefined') return;
	if (isReady) return; // Already initialized

	// Create audio elements
	backgroundAudio = new Audio('/audio/background.mp3');
	battleAudio = new Audio('/audio/battle.mp3');
	victoryAudio = new Audio('/audio/victory.mp3');

	// Configure looping
	backgroundAudio.loop = true;
	battleAudio.loop = true;
	victoryAudio.loop = false;

	// Set initial volume
	const vol = volume / 100;
	backgroundAudio.volume = vol;
	battleAudio.volume = vol;
	victoryAudio.volume = vol;

	// When victory ends, return to background
	victoryAudio.addEventListener('ended', () => {
		transitionTo('background');
	});

	// Mark as ready once background audio can play
	const checkReady = () => {
		if (backgroundAudio && backgroundAudio.readyState >= 3) {
			isReady = true;
		}
	};
	backgroundAudio.addEventListener('canplaythrough', checkReady);

	// Preload
	backgroundAudio.load();
	battleAudio.load();
	victoryAudio.load();

	// Check immediately in case audio is already cached
	checkReady();
}

/**
 * Play background music
 */
export function playBackgroundMusic(): void {
	transitionTo('background');
}

/**
 * Play battle music (pauses background, saves position)
 */
export function playBattleMusic(): void {
	transitionTo('battle');
}

/**
 * Play victory music (pauses battle)
 */
export function playVictoryMusic(): void {
	transitionTo('victory');
}

/**
 * Stop battle/victory music and resume background
 */
export function endBattleAndResumeBackground(): void {
	transitionTo('background');
}

/**
 * Stop all music
 */
export function stopAllMusic(): void {
	transitionTo('idle');
}

/**
 * Set volume (0-100)
 */
export function setMusicVolume(newVolume: number): void {
	volume = Math.max(0, Math.min(100, newVolume));
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY_VOLUME, String(volume));
	}
	const vol = volume / 100;
	if (backgroundAudio) backgroundAudio.volume = vol;
	if (battleAudio) battleAudio.volume = vol;
	if (victoryAudio) victoryAudio.volume = vol;
}

/**
 * Toggle mute state
 */
export function toggleMute(): void {
	isMuted = !isMuted;
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY_MUTED, String(isMuted));
	}
	if (isMuted) {
		stopAllAudio();
	} else if (currentState !== 'idle') {
		// Resume current state when unmuting
		const state = currentState;
		currentState = 'idle'; // Force re-transition
		transitionTo(state);
	}
}

/**
 * Set mute state directly
 */
export function setMuted(muted: boolean): void {
	if (isMuted === muted) return;
	isMuted = muted;
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY_MUTED, String(isMuted));
	}
	if (isMuted) {
		stopAllAudio();
	} else if (currentState !== 'idle') {
		// Resume current state when unmuting
		const state = currentState;
		currentState = 'idle';
		transitionTo(state);
	}
}

/**
 * Reactive state exports
 */
export function getBattleMusicState() {
	return {
		get isPlaying() {
			return currentState !== 'idle';
		},
		get isBackgroundPlaying() {
			return currentState === 'background';
		},
		get isBattlePlaying() {
			return currentState === 'battle';
		},
		get isVictoryPlaying() {
			return currentState === 'victory';
		},
		get currentState() {
			return currentState;
		},
		get isReady() {
			return isReady;
		},
		get isMuted() {
			return isMuted;
		},
		get volume() {
			return volume;
		}
	};
}
