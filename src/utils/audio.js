let audioContext;

function ensureContext() {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

export function primeAudio() {
  ensureContext();
}

export function playBeep(frequency = 880, duration = 0.08, volume = 0.07, type = 'square') {
  try {
    const context = ensureContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.02);
  } catch (error) {
    console.error('Audio beep failed', error);
  }
}

export function playCompletionTone() {
  [720, 880, 1040].forEach((frequency, index) => {
    window.setTimeout(() => playBeep(frequency, 0.18, 0.06, 'triangle'), index * 180);
  });
}
