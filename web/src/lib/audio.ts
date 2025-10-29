// Audio feedback utilities using Web Audio API

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      // Web Audio API not supported
      return null;
    }
  }

  // Resume context if it's suspended (required for user interaction)
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }

  return audioContext;
}

function createTone(frequency: number, duration: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine'): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  oscillator.type = type;

  // Fade in/out to avoid clicks
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01);
  gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + duration - 0.01);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

export function playCorrectSound(): void {
  // Pleasant upward chord: C-E-G
  createTone(523.25, 0.15, 'sine'); // C5
  setTimeout(() => createTone(659.25, 0.15, 'sine'), 50); // E5
  setTimeout(() => createTone(783.99, 0.2, 'sine'), 100); // G5
}

export function playWrongSound(): void {
  // Gentle descending tones with sine waves
  createTone(400, 0.12, 'sine'); // G#4
  setTimeout(() => createTone(370, 0.12, 'sine'), 80); // F#4
  setTimeout(() => createTone(340, 0.15, 'sine'), 160); // F4
}

// Initialize audio context on first user interaction
let initialized = false;
export function initializeAudio(): void {
  if (initialized) return;
  initialized = true;

  if (typeof window !== 'undefined') {
    const initAudio = () => {
      getAudioContext();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };

    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
  }
}