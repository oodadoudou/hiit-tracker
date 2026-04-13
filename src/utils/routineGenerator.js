import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { FALLBACK_GUIDE_IMAGE } from './constants';

export const ROUTINE_GENERATOR_TARGETS = [
  { key: 'cardio', label: '有氧减脂' },
  { key: 'upper', label: '上肢' },
  { key: 'core', label: '腰腹' },
  { key: 'legs', label: '臀腿' },
  { key: 'recovery', label: '恢复' },
];

export const ROUTINE_GENERATOR_TAGS = [
  { key: 'standing', label: '站立' },
  { key: 'floor', label: '地面' },
  { key: 'jump', label: '跳跃' },
  { key: 'no-jump', label: '低冲击' },
  { key: 'dumbbell', label: '哑铃' },
  { key: 'core', label: '核心参与' },
  { key: 'full-body', label: '全身联动' },
];

export const ROUTINE_GENERATOR_DIFFICULTIES = [
  { key: 'easy', label: '轻松' },
  { key: 'medium', label: '标准' },
  { key: 'hard', label: '进阶' },
];

export const ROUTINE_GENERATOR_EQUIPMENT = [
  { key: 'bodyweight', label: '徒手' },
  { key: 'dumbbell', label: '哑铃' },
];

export const ROUTINE_GENERATOR_TEMPOS = [
  { key: 'slow', label: '慢控制' },
  { key: 'controlled', label: '控制型' },
  { key: 'steady', label: '稳定型' },
  { key: 'rhythmic', label: '节奏型' },
];

const CATEGORY_TO_FOCUS = {
  cardio: 'cardio',
  upper: 'upper',
  core: 'core',
  legs: 'legs',
  recovery: 'recovery',
};

const REP_PACING_OVERRIDES = {
  '哑铃弯举': { secondsPerRep: 3.2 },
  '侧平举': { secondsPerRep: 3.4 },
  '肩推': { secondsPerRep: 3.3 },
  '过头臂屈伸': { secondsPerRep: 3.1 },
  'kickback': { secondsPerRep: 2.8 },
  '俯卧撑': { secondsPerRep: 3.1 },
  '哑铃划船': { secondsPerRep: 3.0 },
  '前平举': { secondsPerRep: 3.2 },
  '窄距俯卧撑': { secondsPerRep: 3.3 },
  '反向撑体': { secondsPerRep: 3.2 },
  '深蹲': { secondsPerRep: 3.0 },
  '弓步': { secondsPerRep: 2.8, perSide: true },
  '臀桥': { secondsPerRep: 2.7 },
  '硬拉': { secondsPerRep: 3.4 },
  '侧抬腿': { secondsPerRep: 2.6 },
  'donkey kicks': { secondsPerRep: 2.6 },
  '台阶上步': { secondsPerRep: 2.9, perSide: true },
  '保加利亚蹲': { secondsPerRep: 3.4, perSide: true },
  '臀桥行走': { secondsPerRep: 2.8 },
  '相扑深蹲': { secondsPerRep: 3.0 },
  '单腿臀桥': { secondsPerRep: 3.1, perSide: true },
  '侧弓步': { secondsPerRep: 3.0, perSide: true },
  '后踢腿': { secondsPerRep: 2.5, perSide: true },
  '俄罗斯转体': { secondsPerRep: 2.0 },
  '抬腿': { secondsPerRep: 3.0 },
  '卷腹': { secondsPerRep: 2.2 },
  'dead bug': { secondsPerRep: 3.0 },
  'V字卷腹': { secondsPerRep: 3.0 },
  '触脚卷腹': { secondsPerRep: 2.3 },
};

export function buildRoutineGeneratorLibrary() {
  return EXERCISE_LIBRARY.map(normalizeExerciseLibraryEntry);
}

export function generateRoutineFromLibrary({
  library = [],
  targets = [],
  requiredTags = [],
  allowedDifficulties = [],
  allowedEquipment = [],
  allowedTempos = [],
  exerciseCount = 6,
  baseName = '',
  sequenceNumber = null,
  excludeSignatures = [],
} = {}) {
  const normalizedTargets = Array.isArray(targets) ? targets.filter(Boolean) : [];
  const normalizedTags = Array.isArray(requiredTags)
    ? requiredTags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
    : [];
  const normalizedDifficulties = Array.isArray(allowedDifficulties)
    ? allowedDifficulties.map((item) => String(item).trim().toLowerCase()).filter(Boolean)
    : [];
  const normalizedEquipment = Array.isArray(allowedEquipment)
    ? allowedEquipment.map((item) => String(item).trim().toLowerCase()).filter(Boolean)
    : [];
  const normalizedTempos = Array.isArray(allowedTempos)
    ? allowedTempos.map((item) => String(item).trim().toLowerCase()).filter(Boolean)
    : [];
  const targetSet = new Set(normalizedTargets);
  const requiredTagSet = new Set(normalizedTags);
  const difficultySet = new Set(normalizedDifficulties);
  const equipmentSet = new Set(normalizedEquipment);
  const tempoSet = new Set(normalizedTempos);
  const excludedSignatureSet = new Set(
    Array.isArray(excludeSignatures) ? excludeSignatures.map((item) => String(item).trim()).filter(Boolean) : [],
  );
  const safeExerciseCount = Math.max(3, Math.min(12, Number(exerciseCount) || 6));

  const pool = library.filter((exercise) => {
    if (targetSet.size && !targetSet.has(exercise.focus)) return false;
    if (requiredTagSet.size && !normalizedTags.some((tag) => exercise.tags.includes(tag))) return false;
    if (difficultySet.size && !difficultySet.has(exercise.difficulty)) return false;
    if (equipmentSet.size && !equipmentSet.has(exercise.equipment)) return false;
    if (tempoSet.size && !tempoSet.has(exercise.tempo)) return false;
    return true;
  });

  if (pool.length < safeExerciseCount) {
    return { ok: false, reason: 'not-enough-matches', matches: pool.length };
  }

  const shuffledPool = shuffle(pool);
  const selected = [];
  const usedNames = new Set();

  normalizedTargets.forEach((target) => {
    const candidate = shuffledPool.find((exercise) => exercise.focus === target && !usedNames.has(exercise.name));
    if (!candidate) return;
    selected.push(candidate);
    usedNames.add(candidate.name);
  });

  shuffledPool.forEach((exercise) => {
    if (selected.length >= safeExerciseCount) return;
    if (usedNames.has(exercise.name)) return;
    selected.push(exercise);
    usedNames.add(exercise.name);
  });

  if (selected.length < safeExerciseCount) {
    return { ok: false, reason: 'not-enough-unique-matches', matches: selected.length };
  }

  const signature = buildRoutineSignature(selected);
  if (excludedSignatureSet.has(signature)) {
    return { ok: false, reason: 'duplicate-match', matches: selected.length, signature };
  }

  const restSec = mostCommonNumber(selected.map((exercise) => exercise.restSec), 20);
  const workSec = mostCommonNumber(selected.map((exercise) => exercise.workSec), 40);

  return {
    ok: true,
    routine: {
      id: crypto.randomUUID(),
      name: buildGeneratedRoutineName({
        baseName,
        targets: normalizedTargets,
        requiredTags: normalizedTags,
        allowedDifficulties: normalizedDifficulties,
        allowedEquipment: normalizedEquipment,
        exerciseCount: safeExerciseCount,
        sequenceNumber,
      }),
      mode: 'finite',
      workSec,
      restSec,
      circuitRestSec: 45,
      circuits: 1,
      exercises: selected.slice(0, safeExerciseCount).map((exercise) => ({
        name: exercise.name,
        images: exercise.images,
        tips: exercise.tips,
        breathingCue: '',
        commonMistakes: [],
        focus: exercise.focus,
        jointLoad: exercise.jointLoad,
        impactLevel: exercise.impactLevel,
        tempo: exercise.tempo,
        regression: exercise.regression,
      })),
    },
    matches: pool.length,
    signature,
  };
}

export function generateRoutineBatchFromLibrary({
  library = [],
  targets = [],
  requiredTags = [],
  allowedDifficulties = [],
  allowedEquipment = [],
  allowedTempos = [],
  exerciseCount = 6,
  routineCount = 1,
  baseName = '',
} = {}) {
  const safeRoutineCount = Math.max(1, Math.min(8, Number(routineCount) || 1));
  const generated = [];
  const signatures = new Set();
  let lastFailure = null;
  let attempts = 0;
  const maxAttempts = safeRoutineCount * 12;

  while (generated.length < safeRoutineCount && attempts < maxAttempts) {
    attempts += 1;
    const result = generateRoutineFromLibrary({
      library,
      targets,
      requiredTags,
      allowedDifficulties,
      allowedEquipment,
      allowedTempos,
      exerciseCount,
      baseName,
      sequenceNumber: safeRoutineCount > 1 ? generated.length + 1 : null,
      excludeSignatures: [...signatures],
    });
    if (!result.ok) {
      if (result.reason === 'duplicate-match') continue;
      lastFailure = result;
      break;
    }
    const signature = result.signature;
    if (signatures.has(signature)) continue;
    signatures.add(signature);
    generated.push(result.routine);
  }

  if (!generated.length) {
    return lastFailure || { ok: false, reason: 'not-enough-matches', matches: 0 };
  }

  return {
    ok: true,
    routines: generated,
    requestedCount: safeRoutineCount,
    generatedCount: generated.length,
  };
}

function normalizeExerciseLibraryEntry(entry) {
  const tags = Array.isArray(entry.tags) ? entry.tags.map((tag) => String(tag).trim().toLowerCase()) : [];
  const category = String(entry.category || 'cardio').trim().toLowerCase();
  const focus = CATEGORY_TO_FOCUS[category] || 'general';
  const pacing = {
    ...(REP_PACING_OVERRIDES[entry.name] || {}),
    ...(entry.secondsPerRep ? { secondsPerRep: Number(entry.secondsPerRep) || undefined } : {}),
    ...(entry.sideMode === 'per-side' ? { perSide: true } : {}),
  };
  const { workSec, restSec } = parseTimeWindow(entry.time, pacing);
  const standingOnly = tags.includes('standing');
  const supportsNoJumping = tags.includes('no-jump') || !tags.includes('jump');
  const floorBased = tags.includes('floor');
  const impactLevel = tags.includes('jump') ? 'high' : tags.includes('no-jump') ? 'low' : floorBased ? 'low' : 'medium';
  const jointLoad = floorBased ? 'low' : category === 'legs' ? 'medium' : 'low';
  const tempo = String(entry.tempo || (category === 'cardio' ? 'rhythmic' : category === 'core' ? 'controlled' : 'steady')).trim().toLowerCase();
  const difficulty = String(entry.difficulty || inferDifficulty({ category, tags, workSec, restSec })).trim().toLowerCase();
  const equipment = String(entry.equipment || inferEquipment(tags)).trim().toLowerCase();
  const sideMode = String(entry.sideMode || (pacing?.perSide ? 'per-side' : 'total')).trim().toLowerCase();

  return {
    category,
    focus,
    name: entry.name,
    workLabel: entry.time,
    workSec,
    restSec,
    tags,
    tips: Array.isArray(entry.tips) ? entry.tips : [String(entry.tips || '').trim()].filter(Boolean),
    images: entry.imageUrl ? [entry.imageUrl] : [FALLBACK_GUIDE_IMAGE],
    standingOnly,
    supportsNoJumping,
    impactLevel,
    jointLoad,
    tempo,
    difficulty,
    equipment,
    sideMode,
    regression: supportsNoJumping
      ? 'reduce speed and keep the easiest stable variation'
      : 'switch to the low-impact version if you need less jumping',
    pacing,
  };
}

function parseTimeWindow(rawTime, pacing = null) {
  const value = String(rawTime || '').trim();
  const [workRaw = '', restRaw = ''] = value.split('/');
  return {
    workSec: parseTimePart(workRaw.trim(), 40, pacing),
    restSec: parseTimePart(restRaw.trim(), 20, pacing),
  };
}

function parseTimePart(value, fallback, pacing = null) {
  const secondsMatch = value.match(/(\d+)\s*s/i);
  if (secondsMatch) return Math.max(5, Number(secondsMatch[1]) || fallback);
  const repsMatch = value.match(/(\d+)(?:\s*[-–]\s*(\d+))?\s*次/i);
  if (repsMatch) {
    const low = Number(repsMatch[1]) || 0;
    const high = Number(repsMatch[2]) || low;
    let reps = Math.round((low + high) / 2);
    const perSide = pacing?.perSide || /\/\s*腿/i.test(value);
    if (perSide) reps *= 2;
    return estimateSecondsFromReps(reps, fallback, pacing);
  }
  return fallback;
}

function estimateSecondsFromReps(reps, fallback, pacing = null) {
  if (!reps) return fallback;
  const secondsPerRep = pacing?.secondsPerRep || 2.75;
  const seconds = Math.round(reps * secondsPerRep);
  return Math.max(20, Math.min(60, seconds || fallback));
}

function buildGeneratedRoutineName({ baseName, targets, requiredTags, allowedDifficulties, allowedEquipment, exerciseCount, sequenceNumber }) {
  const trimmedBaseName = String(baseName || '').trim();
  if (trimmedBaseName) {
    return sequenceNumber ? `${trimmedBaseName} ${sequenceNumber}` : trimmedBaseName;
  }

  const labels = targets.length
    ? targets.map((target) => ROUTINE_GENERATOR_TARGETS.find((item) => item.key === target)?.label || target)
    : ['随机训练'];
  const modifiers = [
    ...requiredTags.map((tag) => ROUTINE_GENERATOR_TAGS.find((item) => item.key === tag)?.label || tag),
    ...allowedDifficulties.map((difficulty) => ROUTINE_GENERATOR_DIFFICULTIES.find((item) => item.key === difficulty)?.label || difficulty),
    ...allowedEquipment.map((equipment) => ROUTINE_GENERATOR_EQUIPMENT.find((item) => item.key === equipment)?.label || equipment),
    `${exerciseCount} 动作`,
    sequenceNumber ? `第 ${sequenceNumber} 套` : null,
  ].filter(Boolean);
  return `${labels.join(' + ')} · ${modifiers.join(' · ')}`;
}

function buildRoutineSignature(exercises) {
  return exercises.map((exercise) => exercise.name).sort().join('|');
}

function inferDifficulty({ category, tags, workSec, restSec }) {
  const workload = Number(workSec) + (Number(restSec) * 0.35);
  if (tags.includes('jump') || workload >= 52) return 'hard';
  if (category === 'recovery' || tags.includes('no-jump')) return 'easy';
  return 'medium';
}

function inferEquipment(tags) {
  if (tags.includes('dumbbell')) return 'dumbbell';
  return 'bodyweight';
}

function mostCommonNumber(values, fallback) {
  const counts = new Map();
  values.forEach((value) => {
    const normalized = Number(value) || fallback;
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || fallback;
}

function shuffle(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}
