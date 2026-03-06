/**
 * Game Music Controller - State Machine
 * Uses HTML5 Audio for background, battle, and victory music
 *
 * States: 'idle' | 'background' | 'battle' | 'victory'
 * Only one track plays at a time. Background position is preserved.
 */

import { createContext } from 'svelte';

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

type MusicState = 'idle' | 'background' | 'battle' | 'victory';

class BattleMusicStore {
	// Audio elements (not reactive — internal only)
	private backgroundAudio: HTMLAudioElement | null = null;
	private battleAudio: HTMLAudioElement | null = null;
	private victoryAudio: HTMLAudioElement | null = null;
	private backgroundPosition = 0;

	// Reactive state
	private _currentState = $state<MusicState>('idle');
	private _isReady = $state(false);
	private _isMuted = $state(loadMutedState());
	private _volume = $state(loadVolumeState());

	// Reactive getters
	get isPlaying() {
		return this._currentState !== 'idle';
	}
	get isBackgroundPlaying() {
		return this._currentState === 'background';
	}
	get isBattlePlaying() {
		return this._currentState === 'battle';
	}
	get isVictoryPlaying() {
		return this._currentState === 'victory';
	}
	get currentState() {
		return this._currentState;
	}
	get isReady() {
		return this._isReady;
	}
	get isMuted() {
		return this._isMuted;
	}
	get volume() {
		return this._volume;
	}

	// -----------------------------------------------------------
	// Internal helpers
	// -----------------------------------------------------------

	private stopAllAudio(): void {
		if (this.backgroundAudio && !this.backgroundAudio.paused) {
			this.backgroundPosition = this.backgroundAudio.currentTime;
			this.backgroundAudio.pause();
		}
		if (this.battleAudio) this.battleAudio.pause();
		if (this.victoryAudio) this.victoryAudio.pause();
	}

	private transitionTo(newState: MusicState): void {
		if (this._currentState === newState) return;

		// Save background position before stopping
		if (this._currentState === 'background' && this.backgroundAudio) {
			this.backgroundPosition = this.backgroundAudio.currentTime;
		}

		this.stopAllAudio();
		this._currentState = newState;

		// If muted, don't play anything
		if (this._isMuted) return;

		switch (newState) {
			case 'background':
				if (this.backgroundAudio) {
					this.backgroundAudio.currentTime = this.backgroundPosition;
					this.backgroundAudio.play().catch(() => {});
				}
				break;
			case 'battle':
				if (this.battleAudio) {
					this.battleAudio.currentTime = 0;
					this.battleAudio.play().catch(() => {});
				}
				break;
			case 'victory':
				if (this.victoryAudio) {
					this.victoryAudio.currentTime = 0;
					this.victoryAudio.play().catch(() => {});
				}
				break;
			case 'idle':
				break;
		}
	}

	// -----------------------------------------------------------
	// Public methods
	// -----------------------------------------------------------

	initAudio(): void {
		if (typeof window === 'undefined') return;
		if (this._isReady) return;

		this.backgroundAudio = new Audio('/audio/background.mp3');
		this.battleAudio = new Audio('/audio/battle.mp3');
		this.victoryAudio = new Audio('/audio/victory.mp3');

		this.backgroundAudio.loop = true;
		this.battleAudio.loop = true;
		this.victoryAudio.loop = false;

		const vol = this._volume / 100;
		this.backgroundAudio.volume = vol;
		this.battleAudio.volume = vol;
		this.victoryAudio.volume = vol;

		this.victoryAudio.addEventListener('ended', () => {
			this.transitionTo('background');
		});

		const checkReady = () => {
			if (this.backgroundAudio && this.backgroundAudio.readyState >= 3) {
				this._isReady = true;
			}
		};
		this.backgroundAudio.addEventListener('canplaythrough', checkReady);

		this.backgroundAudio.load();
		this.battleAudio.load();
		this.victoryAudio.load();

		checkReady();
	}

	playBackgroundMusic(): void {
		this.transitionTo('background');
	}

	playBattleMusic(): void {
		this.transitionTo('battle');
	}

	playVictoryMusic(): void {
		this.transitionTo('victory');
	}

	endBattleAndResumeBackground(): void {
		this.transitionTo('background');
	}

	stopAllMusic(): void {
		this.transitionTo('idle');
	}

	setVolume(newVolume: number): void {
		this._volume = Math.max(0, Math.min(100, newVolume));
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY_VOLUME, String(this._volume));
		}
		const vol = this._volume / 100;
		if (this.backgroundAudio) this.backgroundAudio.volume = vol;
		if (this.battleAudio) this.battleAudio.volume = vol;
		if (this.victoryAudio) this.victoryAudio.volume = vol;
	}

	toggleMute(): void {
		this.setMuted(!this._isMuted);
	}

	setMuted(muted: boolean): void {
		if (this._isMuted === muted) return;
		this._isMuted = muted;
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY_MUTED, String(this._isMuted));
		}
		if (this._isMuted) {
			this.stopAllAudio();
		} else if (this._currentState !== 'idle') {
			const state = this._currentState;
			this._currentState = 'idle';
			this.transitionTo(state);
		}
	}
}

const [get, set] = createContext<BattleMusicStore>();

export function getBattleMusicStore() {
	return get();
}

export function setBattleMusicStore() {
	const store = new BattleMusicStore();
	set(store);
	return store;
}
