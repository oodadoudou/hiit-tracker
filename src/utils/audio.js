let audioContext;
const scheduledTimeouts = new Set();

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

function playToneSequence(context, frequencies, {
  duration = 0.09,
  volume = 0.07,
  type = 'square',
  gap = 95,
  attack = 0.01,
} = {}) {
  frequencies.forEach((frequency, index) => {
    const timeoutId = window.setTimeout(() => {
      scheduledTimeouts.delete(timeoutId);
      try {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + duration + 0.02);
      } catch (error) {
        console.error('Audio beep failed', error);
      }
    }, index * gap);
    scheduledTimeouts.add(timeoutId);
  });
}

export function primeAudio() {
  ensureContext();
}

export function playBeep(frequency = 880, duration = 0.08, volume = 0.07, type = 'square') {
  try {
    const context = ensureContext();
    if (!context) return;
    playToneSequence(context, [frequency], { duration, volume, type, gap: 0 });
  } catch (error) {
    console.error('Audio beep failed', error);
  }
}

const AUDIO_CUES = {
  steady: {
    start: [760, 920],
    transition: [640, 760],
    warning: [860, 960],
    encourage: [700, 820, 940],
    completion: [720, 880, 1040],
  },
  power: {
    start: [920, 1100],
    transition: [820, 960],
    warning: [980, 1120],
    encourage: [860, 980, 1140],
    completion: [760, 920, 1100],
  },
  caution: {
    start: [620, 720],
    transition: [560, 660],
    warning: [760, 880, 980],
    encourage: [620, 700, 780],
    completion: [660, 760, 880],
  },
  recovery: {
    start: [520, 620],
    transition: [470, 560],
    warning: [560, 640],
    encourage: [540, 620, 700],
    completion: [520, 620, 740],
  },
};

function getCueProfile(mode) {
  return AUDIO_CUES[mode] || AUDIO_CUES.steady;
}

export function playSessionCue(kind = 'start', mode = 'steady', exerciseMeta = null) {
  try {
    const context = ensureContext();
    if (!context) return;
    const profile = getCueProfile(mode);
    const frequencies = applyExercisePitch(profile[kind] || profile.start, exerciseMeta);
    const cueShape = deriveExerciseCueShape(kind, mode, exerciseMeta);
    playToneSequence(context, frequencies, cueShape);
  } catch (error) {
    console.error('Audio cue failed', error);
  }
}

export function playCountdownCue(remainingSec, mode = 'steady', exerciseMeta = null, phase = 'work') {
  if (remainingSec <= 0) return;
  if (phase === 'rest' || phase === 'circuitRest') {
    if (remainingSec > 5) return;
    playSessionCue('warning', 'recovery', exerciseMeta);
    return;
  }
  if (remainingSec > 5) return;
  const kind = remainingSec === 1 ? 'warning' : 'transition';
  playSessionCue(kind, mode, exerciseMeta);
}

export function playCompletionTone(mode = 'steady', exerciseMeta = null) {
  playSessionCue('completion', mode, exerciseMeta);
}

export function playRhythmPulse(mode = 'steady', exerciseMeta = null) {
  try {
    const context = ensureContext();
    if (!context) return;
    const focus = String(exerciseMeta?.focus || '').toLowerCase();
    const tempo = String(exerciseMeta?.tempo || '').toLowerCase();
    const impact = String(exerciseMeta?.impactLevel || '').toLowerCase();
    const base = getCueProfile(mode).transition || AUDIO_CUES.steady.transition;

    let frequencies = focus === 'cardio'
      ? [base[0] - 80, base[1] - 20]
      : focus === 'core'
        ? [base[0] - 140]
        : focus === 'upper'
          ? [base[0] - 110, base[0] - 70]
          : focus === 'recovery'
            ? [base[0] - 180]
            : [base[0] - 120, base[0] - 60];

    if (impact === 'high') frequencies = frequencies.map((frequency) => frequency + 25);
    if (tempo === 'slow') frequencies = frequencies.map((frequency) => frequency - 20);

    playToneSequence(context, frequencies, {
      duration: tempo === 'slow' ? 0.14 : tempo === 'rhythmic' ? 0.07 : 0.1,
      volume: mode === 'recovery' ? 0.018 : impact === 'high' ? 0.032 : 0.024,
      type: focus === 'recovery' ? 'sine' : focus === 'cardio' ? 'triangle' : 'square',
      gap: focus === 'cardio' ? 120 : 170,
      attack: 0.012,
    });
  } catch (error) {
    console.error('Audio rhythm pulse failed', error);
  }
}

export function clearScheduledAudio() {
  scheduledTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
  scheduledTimeouts.clear();
}

function deriveExerciseCueShape(kind, mode, exerciseMeta) {
  const focus = String(exerciseMeta?.focus || '').toLowerCase();
  const tempo = String(exerciseMeta?.tempo || '').toLowerCase();
  const impact = String(exerciseMeta?.impactLevel || '').toLowerCase();

  let duration = kind === 'warning' ? 0.1 : kind === 'encourage' ? 0.075 : 0.08;
  let volume = mode === 'recovery' ? 0.045 : kind === 'warning' ? 0.075 : kind === 'encourage' ? 0.055 : 0.065;
  let type = kind === 'completion' ? 'triangle' : kind === 'warning' ? 'sawtooth' : kind === 'encourage' ? 'triangle' : 'square';
  let gap = kind === 'completion' ? 145 : kind === 'encourage' ? 80 : 95;
  let attack = 0.01;

  if (tempo === 'slow') {
    duration += 0.02;
    gap += 35;
  } else if (tempo === 'controlled') {
    duration += 0.01;
    gap += 12;
  } else if (tempo === 'rhythmic') {
    duration -= 0.01;
    gap -= 18;
  }

  if (focus === 'cardio') {
    type = kind === 'warning' ? 'sawtooth' : 'triangle';
    gap = Math.max(50, gap - 8);
  } else if (focus === 'core') {
    type = 'square';
    duration += 0.012;
    gap += 18;
  } else if (focus === 'upper') {
    type = kind === 'completion' ? 'triangle' : 'square';
    attack = 0.008;
  } else if (focus === 'recovery') {
    type = 'sine';
    volume = Math.min(volume, 0.05);
    gap += 28;
    duration += 0.025;
  }

  if (impact === 'high') {
    volume += 0.008;
    gap = Math.max(45, gap - 10);
  } else if (impact === 'low') {
    volume = Math.max(0.04, volume - 0.006);
  }

  return { duration, volume, type, gap, attack };
}

function applyExercisePitch(frequencies, exerciseMeta) {
  const focus = String(exerciseMeta?.focus || '').toLowerCase();
  const offset = focus === 'cardio'
    ? 35
    : focus === 'upper'
      ? 18
      : focus === 'core'
        ? -10
        : focus === 'recovery'
          ? -45
          : 0;
  return frequencies.map((frequency) => frequency + offset);
}
