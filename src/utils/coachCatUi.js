import { STORAGE_KEYS } from './constants';

export function createDefaultCoachCatUi(defaultPersonality = 'cute') {
  return {
    position: { x: null, y: null },
    minimized: false,
    expanded: true,
    skin: 'lime',
    personality: defaultPersonality || 'cold',
    snapToEdge: true,
    memory: createDefaultCoachCatMemory(),
  };
}

export function createDefaultCoachCatMemory() {
  return {
    lastInteractionAt: 0,
    lastInteractionType: 'boot',
    lastIdleNudgeLevel: 0,
    lastIdleNudgeAt: 0,
    ignoredNudges: 0,
    warmupDismissCount: 0,
    lastCompletedAt: 0,
    lastCompletedRoutine: '',
    lastCompletedIntensity: 'normal',
    lastCompletedOutcome: 'none',
  };
}

export function loadCoachCatUi(defaultPersonality = 'cold') {
  const fallback = createDefaultCoachCatUi(defaultPersonality);

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.coachCatUi);
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      position: parsed?.position && typeof parsed.position === 'object'
        ? {
            x: Number.isFinite(Number(parsed.position.x)) ? Number(parsed.position.x) : null,
            y: Number.isFinite(Number(parsed.position.y)) ? Number(parsed.position.y) : null,
          }
        : fallback.position,
      minimized: Boolean(parsed?.minimized),
      expanded: parsed?.expanded !== false,
      skin: ['lime', 'sky', 'ember'].includes(parsed?.skin) ? parsed.skin : fallback.skin,
      personality: ['cold', 'cute', 'steady', 'strict'].includes(parsed?.personality) ? parsed.personality : fallback.personality,
      snapToEdge: parsed?.snapToEdge !== false,
      memory: {
        ...fallback.memory,
        ...(parsed?.memory && typeof parsed.memory === 'object' ? parsed.memory : {}),
      },
    };
  } catch {
    return fallback;
  }
}

export function saveCoachCatUi(value) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.coachCatUi, JSON.stringify(value));
  } catch {
    // ignore persistence failures
  }
}

export function updateCoachCatMemory(patch, defaultPersonality = 'cold') {
  const current = loadCoachCatUi(defaultPersonality);
  const next = {
    ...current,
    memory: {
      ...current.memory,
      ...patch,
    },
  };
  saveCoachCatUi(next);
  return next;
}
