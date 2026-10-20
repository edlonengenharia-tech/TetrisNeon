// Sound effects using Web Audio API
class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.audioContext || !this.enabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playMove() {
    this.playTone(200, 0.05, 'square', 0.1);
  }

  playRotate() {
    this.playTone(400, 0.08, 'sine', 0.15);
  }

  playDrop() {
    this.playTone(150, 0.15, 'triangle', 0.2);
  }

  playLineClear() {
    // Ascending notes
    setTimeout(() => this.playTone(523, 0.1, 'sine', 0.2), 0);
    setTimeout(() => this.playTone(659, 0.1, 'sine', 0.2), 100);
    setTimeout(() => this.playTone(784, 0.15, 'sine', 0.25), 200);
  }

  playTetris() {
    // Special sound for 4 lines
    const notes = [523, 659, 784, 1047];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.15, 'square', 0.2), i * 100);
    });
  }

  playLevelUp() {
    const notes = [440, 554, 659, 880];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.12, 'sine', 0.25), i * 80);
    });
  }

  playGameOver() {
    const notes = [440, 370, 311, 261];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.3, 'sawtooth', 0.2), i * 200);
    });
  }

  playStart() {
    const notes = [262, 330, 392, 523];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.1, 'sine', 0.2), i * 100);
    });
  }

  playPause() {
    this.playTone(300, 0.1, 'sine', 0.15);
  }

  playResume() {
    this.playTone(400, 0.1, 'sine', 0.15);
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export const soundManager = new SoundManager();
