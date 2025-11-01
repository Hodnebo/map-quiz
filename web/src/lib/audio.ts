// Audio feedback utilities using Web Audio API

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    try {
      // Handle webkitAudioContext for older browsers
      const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
      } else {
        return null;
      }
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

/**
 * Play a sequence of tones with delays
 */
function playSequence(notes: Array<{ freq: number; duration: number; delay: number; type?: 'sine' | 'square' | 'sawtooth' | 'triangle' }>): void {
  notes.forEach(({ freq, duration, delay, type = 'sine' }) => {
    setTimeout(() => createTone(freq, duration, type), delay);
  });
}

/**
 * Perfect game completion sound - C-CC-D-C-D-E pattern (as requested)
 */
export function playPerfectGameSound(): void {
  // Musical notes: C-CC-D-C-D-E
  // C4 = 261.63 Hz, C5 = 523.25 Hz, D4 = 293.66 Hz, D5 = 587.33 Hz, E4 = 329.63 Hz
  const baseTime = 150; // Base timing between notes
  
  playSequence([
    { freq: 523.25, duration: 0.2, delay: 0 },        // C5
    { freq: 523.25, duration: 0.15, delay: baseTime }, // C5 (second)
    { freq: 523.25, duration: 0.15, delay: baseTime * 1.3 }, // C5 (third)
    { freq: 587.33, duration: 0.2, delay: baseTime * 2.2 }, // D5
    { freq: 523.25, duration: 0.2, delay: baseTime * 3.2 }, // C5
    { freq: 587.33, duration: 0.2, delay: baseTime * 4.2 }, // D5
    { freq: 659.25, duration: 0.3, delay: baseTime * 5.2 }, // E5 (ending note)
  ]);
}

/**
 * Good performance completion sound - uplifting celebratory tune
 */
export function playGoodGameSound(): void {
  // Upward major scale ending in a pleasant chord
  playSequence([
    { freq: 523.25, duration: 0.15, delay: 0 },      // C5
    { freq: 587.33, duration: 0.15, delay: 120 },     // D5
    { freq: 659.25, duration: 0.15, delay: 240 },     // E5
    { freq: 783.99, duration: 0.2, delay: 360 },      // G5
    { freq: 523.25, duration: 0.15, delay: 480 },     // C5 (octave)
    { freq: 659.25, duration: 0.2, delay: 600 },      // E5
    { freq: 783.99, duration: 0.3, delay: 720 },      // G5 (ending)
  ]);
}

/**
 * Moderate performance completion sound - neutral completion
 */
export function playModerateGameSound(): void {
  // Simple ascending pattern with neutral tone
  playSequence([
    { freq: 440, duration: 0.15, delay: 0 },          // A4
    { freq: 493.88, duration: 0.15, delay: 150 },     // B4
    { freq: 523.25, duration: 0.2, delay: 300 },      // C5
    { freq: 523.25, duration: 0.25, delay: 500 },     // C5 (held)
  ]);
}

/**
 * Poor performance completion sound - melancholic/sadder tone
 */
export function playPoorGameSound(): void {
  // Descending minor third pattern with slower, sadder tones
  playSequence([
    { freq: 440, duration: 0.2, delay: 0 },          // A4
    { freq: 392, duration: 0.2, delay: 200 },         // G4
    { freq: 349.23, duration: 0.25, delay: 400 },     // F4
    { freq: 329.63, duration: 0.3, delay: 650 },      // E4 (sadder ending)
  ]);
}

/**
 * Play appropriate completion sound based on performance percentage
 */
export function playGameCompletionSound(correctAnswers: number, totalRounds: number): void {
  if (totalRounds === 0) return;
  
  const percentage = (correctAnswers / totalRounds) * 100;
  
  if (percentage === 100) {
    // Perfect game - play the requested C-CC-D-C-D-E pattern
    playPerfectGameSound();
  } else if (percentage >= 75) {
    // Good performance - celebratory tune
    playGoodGameSound();
  } else if (percentage >= 40) {
    // Moderate performance - neutral completion
    playModerateGameSound();
  } else {
    // Poor performance - sadder sound
    playPoorGameSound();
  }
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