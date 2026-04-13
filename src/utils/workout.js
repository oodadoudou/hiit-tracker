import { FALLBACK_GUIDE_IMAGE } from './constants';

export function formatClock(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function normalizeExercise(exercise) {
  if (!exercise || typeof exercise !== 'object') return null;
  const name = String(exercise.name || '').trim();
  const images = Array.isArray(exercise.images)
    ? exercise.images.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const tips = Array.isArray(exercise.tips)
    ? exercise.tips.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const commonMistakes = Array.isArray(exercise.commonMistakes)
    ? exercise.commonMistakes.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const breathingCue = String(exercise.breathingCue || '').trim();
  if (!name) return null;
  const routineId = String(exercise.routineId || '').trim();
  const builtinMeta = getBuiltinExerciseMeta(routineId, name);
  const inferredMeta = inferExerciseMeta(name);
  const workSecOverride = (exercise.workSecOverride != null && Number.isFinite(Number(exercise.workSecOverride)))
    ? Math.max(5, Math.round(Number(exercise.workSecOverride)))
    : null;
  const restSecOverride = (exercise.restSecOverride != null && Number.isFinite(Number(exercise.restSecOverride)))
    ? Math.max(0, Math.round(Number(exercise.restSecOverride)))
    : null;
  return {
    name,
    images: images.length ? images : [FALLBACK_GUIDE_IMAGE],
    tips: tips.length ? tips : ['Keep good form', 'Stay controlled'],
    commonMistakes,
    breathingCue,
    focus: normalizeMetaValue(exercise.focus || builtinMeta.focus || inferredMeta.focus, inferredMeta.focus),
    jointLoad: normalizeMetaValue(exercise.jointLoad || builtinMeta.jointLoad || inferredMeta.jointLoad, inferredMeta.jointLoad),
    impactLevel: normalizeMetaValue(exercise.impactLevel || builtinMeta.impactLevel || inferredMeta.impactLevel, inferredMeta.impactLevel),
    tempo: normalizeMetaValue(exercise.tempo || builtinMeta.tempo || inferredMeta.tempo, inferredMeta.tempo),
    regression: String(exercise.regression || builtinMeta.regression || inferredMeta.regression).trim(),
    workSecOverride,
    restSecOverride,
  };
}

export function normalizeRoutine(routine) {
  if (!routine || typeof routine !== 'object') return null;
  const routineId = String(routine.id || crypto.randomUUID());
  const exercises = Array.isArray(routine.exercises)
    ? routine.exercises.map((exercise) => normalizeExercise({ ...exercise, routineId })).filter(Boolean)
    : [];
  const name = String(routine.name || '').trim();
  if (!name || !exercises.length) return null;
  return {
    id: routineId,
    name,
    mode: routine.mode === 'finite' ? 'finite' : 'infinite',
    workSec: Math.max(5, Math.round(Number(routine.workSec) || 40)),
    restSec: Math.max(0, Math.round(Number(routine.restSec) || 20)),
    circuitRestSec: Math.max(0, Math.round(Number(routine.circuitRestSec) || 0)),
    circuits: Math.max(1, Math.round(Number(routine.circuits) || 1)),
    exercises,
  };
}

// MET values updated per Compendium of Physical Activities + HIIT-specific research
// HIIT intervals run at higher effective METs than steady-state; strength exercises raised ~15%
const BASE_MET = { cardio: 9.5, legs: 6.5, upper: 5.0, core: 3.5, recovery: 2.0, general: 5.5 };
const IMPACT_MOD = { high: 1.25, medium: 1.0, low: 0.8 };
// EPOC (excess post-exercise oxygen consumption) bonus per focus type.
// Cardio/HIIT shows ~25% additional caloric cost from the afterburn effect;
// strength work is lower (~5-10%); recovery negligible.
const EPOC_BONUS = { cardio: 0.25, legs: 0.10, upper: 0.05, core: 0.05, recovery: 0.0, general: 0.10 };

function getMETForExercise(ex) {
  return (BASE_MET[ex?.focus] ?? 5.5) * (IMPACT_MOD[ex?.impactLevel] ?? 1.0);
}

// Training frequency modifier: more adapted athletes have modestly higher metabolic cost per unit effort.
// Range: 1.0 (sedentary / new) → 1.08 (5+ sessions/week)
function getFrequencyModifier(sessionsPerWeek) {
  const s = Number(sessionsPerWeek) || 0;
  if (s >= 5) return 1.08;
  if (s >= 2) return 1.05;
  return 1.0;
}

function computeCalories(exercises, weightKg, activeWorkSec, intensityMultiplier, sessionsPerWeek) {
  const safeWeight = Math.max(30, Number(weightKg) || 60);
  const freqMod = getFrequencyModifier(sessionsPerWeek);
  const exList = Array.isArray(exercises) && exercises.length
    ? exercises
    : [{ focus: 'general', impactLevel: 'medium' }];
  const perExSec = activeWorkSec / exList.length;
  let totalCal = 0;
  for (const ex of exList) {
    const met = getMETForExercise(ex);
    const epoc = EPOC_BONUS[ex?.focus] ?? 0.10;
    const base = met * safeWeight * (perExSec / 3600) * intensityMultiplier * freqMod;
    totalCal += base * (1 + epoc);
  }
  return Math.max(0, Math.round(totalCal));
}

export function buildWorkoutSummary({ routine, elapsedSec, activeWorkSec, intensityKey = 'normal', intensityMultiplier = 1, weightKg = 60, sessionsPerWeek = 0 }) {
  const safeIntensityMultiplier = Math.max(0.6, Number(intensityMultiplier) || 1);
  return {
    id: crypto.randomUUID(),
    dateIso: new Date().toISOString(),
    routineId: routine?.id || null,
    routineName: routine?.name || 'Workout',
    totalDurationSec: elapsedSec,
    durationLabel: formatClock(elapsedSec),
    activeWorkSec,
    intensityKey,
    intensityMultiplier: safeIntensityMultiplier,
    caloriesBurned: computeCalories(routine?.exercises, weightKg, activeWorkSec, safeIntensityMultiplier, sessionsPerWeek),
  };
}

export function computeMaxHeartRate(age) {
  const safeAge = Math.max(1, Number(age) || 30);
  return 220 - safeAge;
}

export function computeFatLossZone(age) {
  const max = computeMaxHeartRate(age);
  return {
    max,
    low: Math.round(max * 0.6),
    high: Math.round(max * 0.7),
  };
}

export function computeEstimatedMetabolism({ heightCm, weightKg, age, sex = 'female' }) {
  const safeHeight = Math.max(120, Number(heightCm) || 162);
  const safeWeight = Math.max(30, Number(weightKg) || 60);
  const safeAge = Math.max(18, Number(age) || 28);
  const sexOffset = sex === 'male' ? 5 : -161;
  return Math.round((10 * safeWeight) + (6.25 * safeHeight) - (5 * safeAge) + sexOffset);
}

export function computeDailyDeficit({ intake = 0, exerciseBurn = 0, metabolicBurn = 0 }) {
  return Math.round(Number(intake) - Number(exerciseBurn) - Number(metabolicBurn));
}

export function deriveCalorieStatus(deficit) {
  const value = Number(deficit) || 0;
  if (value > 100) return '盈余';
  if (value > -200) return '维持';
  if (value > -700) return '减脂';
  return '强减脂';
}

export function summarizeRoutineSemantics(routine) {
  const exercises = Array.isArray(routine?.exercises) ? routine.exercises.filter(Boolean) : [];
  const total = exercises.length || 1;
  const focusCounts = countValues(exercises.map((exercise) => normalizeMetaValue(exercise.focus, 'general')));
  const jointCounts = countValues(exercises.map((exercise) => normalizeMetaValue(exercise.jointLoad, 'medium')));
  const impactCounts = countValues(exercises.map((exercise) => normalizeMetaValue(exercise.impactLevel, 'medium')));
  const tempoCounts = countValues(exercises.map((exercise) => normalizeMetaValue(exercise.tempo, 'steady')));
  const regressions = [...new Set(exercises.map((exercise) => String(exercise?.regression || '').trim()).filter(Boolean))];
  const avgJointScore = averageLevel(exercises.map((exercise) => LEVEL_SCORE[normalizeMetaValue(exercise.jointLoad, 'medium')] || LEVEL_SCORE.medium));
  const avgImpactScore = averageLevel(exercises.map((exercise) => LEVEL_SCORE[normalizeMetaValue(exercise.impactLevel, 'medium')] || LEVEL_SCORE.medium));

  return {
    totalExercises: exercises.length,
    dominantFocus: pickDominantKey(focusCounts, 'general'),
    dominantTempo: pickDominantKey(tempoCounts, 'steady'),
    dominantJointLoad: pickDominantKey(jointCounts, 'medium'),
    dominantImpactLevel: pickDominantKey(impactCounts, 'medium'),
    avgJointLoad: scoreToLevel(avgJointScore),
    avgImpactLevel: scoreToLevel(avgImpactScore),
    highImpactShare: ratioOf(impactCounts.high, total),
    highJointLoadShare: ratioOf(jointCounts.high, total),
    lowImpactShare: ratioOf(impactCounts.low, total),
    controlledTempoShare: ratioOf((tempoCounts.controlled || 0) + (tempoCounts.slow || 0), total),
    rhythmicTempoShare: ratioOf(tempoCounts.rhythmic, total),
    recoveryShare: ratioOf(focusCounts.recovery, total),
    regressions,
    primaryRegression: regressions[0] || 'reduce speed and keep the easiest stable version',
  };
}

function inferExerciseMeta(name) {
  const text = String(name || '').toLowerCase();
  if (/(squat|深蹲|lunge|弓步|wall sit|静蹲|deadlift|硬拉)/.test(text)) {
    return {
      focus: 'legs',
      jointLoad: 'medium',
      impactLevel: 'low',
      tempo: 'controlled',
      regression: 'reduce depth and slow the lowering phase',
    };
  }
  if (/(bridge|臀桥|leg raise|抬腿|clam|蚌式|dead bug|plank|平板|russian|转体|core)/.test(text)) {
    return {
      focus: 'core',
      jointLoad: 'low',
      impactLevel: 'low',
      tempo: 'slow',
      regression: 'reduce range of motion and keep the brace first',
    };
  }
  if (/(jump|jack|高抬腿|high knee|慢跑|jog|mountain climber|登山跑|cardio|有氧)/.test(text)) {
    return {
      focus: 'cardio',
      jointLoad: 'medium',
      impactLevel: /(low impact|慢版|recovery|恢复)/.test(text) ? 'low' : 'high',
      tempo: 'rhythmic',
      regression: 'switch to a lower-impact marching version',
    };
  }
  if (/(curl|弯举|raise|侧平举|press|推举|tricep|臂屈伸|kickback|punch|出拳|arm)/.test(text)) {
    return {
      focus: 'upper',
      jointLoad: 'low',
      impactLevel: 'low',
      tempo: 'controlled',
      regression: 'lower the weight and shorten the range slightly',
    };
  }
  if (/(recovery|恢复)/.test(text)) {
    return {
      focus: 'recovery',
      jointLoad: 'low',
      impactLevel: 'low',
      tempo: 'slow',
      regression: 'stay within a pain-free range',
    };
  }
  return {
    focus: 'general',
    jointLoad: 'medium',
    impactLevel: 'medium',
    tempo: 'steady',
    regression: 'reduce speed and keep the easiest stable version',
  };
}

function getBuiltinExerciseMeta(routineId, exerciseName) {
  const routineMeta = BUILTIN_EXERCISE_META[routineId];
  if (!routineMeta) return {};
  return routineMeta[exerciseName] || {};
}

function normalizeMetaValue(value, fallback) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized || fallback;
}

function countValues(values) {
  return values.reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function pickDominantKey(record, fallback) {
  const entries = Object.entries(record || {});
  if (!entries.length) return fallback;
  return entries.sort((a, b) => b[1] - a[1])[0][0] || fallback;
}

function ratioOf(value, total) {
  if (!total) return 0;
  return Number(value || 0) / total;
}

function averageLevel(values) {
  if (!values.length) return LEVEL_SCORE.medium;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function scoreToLevel(score) {
  if (score >= 2.4) return 'high';
  if (score <= 1.45) return 'low';
  return 'medium';
}

const LEVEL_SCORE = {
  low: 1,
  medium: 2,
  high: 3,
};

const BUILTIN_EXERCISE_META = {
  'builtin-home-cardio': {
    '正常开合跳 (Jumping Jacks)': {
      focus: 'cardio',
      jointLoad: 'medium',
      impactLevel: 'medium',
      tempo: 'rhythmic',
      regression: 'switch to low-impact jacks and keep every landing quiet',
    },
    '哑铃快速出拳 (Dumbbell Punches)': {
      focus: 'upper',
      jointLoad: 'low',
      impactLevel: 'low',
      tempo: 'rhythmic',
      regression: 'drop the weight and punch at shoulder height only',
    },
    '高抬腿 (High Knees)': {
      focus: 'cardio',
      jointLoad: 'medium',
      impactLevel: 'high',
      tempo: 'rhythmic',
      regression: 'switch to a marching high-knee pattern with a softer landing',
    },
    '原地慢跑 (Jogging in Place)': {
      focus: 'cardio',
      jointLoad: 'low',
      impactLevel: 'low',
      tempo: 'steady',
      regression: 'keep it to a light march and shorten the ground contact',
    },
    '哑铃提膝推举 (Dumbbell March and Press)': {
      focus: 'upper',
      jointLoad: 'medium',
      impactLevel: 'low',
      tempo: 'controlled',
      regression: 'remove the weights and alternate the march and press separately',
    },
  },
  'builtin-arm-core-sculpt': {
    '哑铃弯举（手臂前侧）': {
      focus: 'upper',
      jointLoad: 'low',
      impactLevel: 'low',
      tempo: 'controlled',
      regression: 'use lighter dumbbells and stop before the swing starts',
    },
    '过头臂屈伸（手臂后侧，拜拜肉核心）': {
      focus: 'upper',
      jointLoad: 'medium',
      impactLevel: 'low',
      tempo: 'controlled',
      regression: 'use one lighter dumbbell and limit the range overhead',
    },
    '平板支撑（核心稳定）': {
      focus: 'core',
      jointLoad: 'medium',
      impactLevel: 'low',
      tempo: 'steady',
      regression: 'drop to knees and shorten the hold while keeping the brace',
    },
    '哑铃俄罗斯转体（侧腹）': {
      focus: 'core',
      jointLoad: 'low',
      impactLevel: 'low',
      tempo: 'controlled',
      regression: 'remove the weight and keep the heels down for more control',
    },
    '抬腿（下腹核心）': {
      focus: 'core',
      jointLoad: 'medium',
      impactLevel: 'low',
      tempo: 'slow',
      regression: 'bend the knees and shorten the lowering range to keep the back down',
    },
  },
  'builtin-full-body-fat-burn': {
    '深蹲 (Squat)': {
      focus: 'legs',
      jointLoad: 'medium',
      impactLevel: 'low',
      tempo: 'controlled',
      regression: 'reduce squat depth and pause before standing to keep the knees stable',
    },
    '登山跑（慢版）(Slow Mountain Climbers)': {
      focus: 'core',
      jointLoad: 'medium',
      impactLevel: 'medium',
      tempo: 'controlled',
      regression: 'elevate the hands and slow each knee drive to keep the trunk steady',
    },
    '低冲击开合 (Low Impact Jacks)': {
      focus: 'cardio',
      jointLoad: 'low',
      impactLevel: 'low',
      tempo: 'rhythmic',
      regression: 'make it a side tap with smaller arm travel',
    },
    '快速抬腿 (Fast High Knees)': {
      focus: 'cardio',
      jointLoad: 'medium',
      impactLevel: 'high',
      tempo: 'rhythmic',
      regression: 'drop to fast marching and keep the feet landing under the hips',
    },
  },
  'builtin-arm-sculpt': {
    '侧平举 (Lateral Raise)': {
      focus: 'upper',
      jointLoad: 'low',
      impactLevel: 'low',
      tempo: 'controlled',
      regression: 'use lighter weights and raise only to a pain-free shoulder height',
    },
    '哑铃弯举 (Bicep Curl)': {
      focus: 'upper',
      jointLoad: 'low',
      impactLevel: 'low',
      tempo: 'controlled',
      regression: 'reduce the load and keep the elbows pinned to the ribs',
    },
    '臂屈伸 (Tricep Dip / Overhead Extension)': {
      focus: 'upper',
      jointLoad: 'medium',
      impactLevel: 'low',
      tempo: 'controlled',
      regression: 'choose the overhead extension version with a lighter weight and shorter range',
    },
    '哑铃后撤臂 Kickback': {
      focus: 'upper',
      jointLoad: 'low',
      impactLevel: 'low',
      tempo: 'controlled',
      regression: 'support the torso on a bench or wall and shorten the extension',
    },
  },
  'builtin-core-sculpt': {
    '平板支撑 (Plank)': {
      focus: 'core',
      jointLoad: 'medium',
      impactLevel: 'low',
      tempo: 'steady',
      regression: 'drop to the knees and hold a shorter set without losing the brace',
    },
    '俄罗斯转体 (Russian Twist)': {
      focus: 'core',
      jointLoad: 'low',
      impactLevel: 'low',
      tempo: 'controlled',
      regression: 'keep both heels down and rotate through a smaller range',
    },
    '抬腿 (Leg Raise)': {
      focus: 'core',
      jointLoad: 'medium',
      impactLevel: 'low',
      tempo: 'slow',
      regression: 'bend the knees and stop lowering before the back peels up',
    },
    'Dead Bug': {
      focus: 'core',
      jointLoad: 'low',
      impactLevel: 'low',
      tempo: 'slow',
      regression: 'move only the legs first and keep the arms fixed until the brace is solid',
    },
  },
  'builtin-glute-leg': {
    '深蹲 (Squat)': {
      focus: 'legs',
      jointLoad: 'medium',
      impactLevel: 'low',
      tempo: 'controlled',
      regression: 'reduce the depth and add a box target to keep the squat honest',
    },
    '后撤弓步 (Reverse Lunge)': {
      focus: 'legs',
      jointLoad: 'high',
      impactLevel: 'medium',
      tempo: 'controlled',
      regression: 'hold a split-stance support and shorten the lunge depth',
    },
    '臀桥 (Glute Bridge)': {
      focus: 'legs',
      jointLoad: 'low',
      impactLevel: 'low',
      tempo: 'controlled',
      regression: 'work bodyweight only and shorten the top hold if the hamstrings cramp',
    },
    '罗马尼亚硬拉 (Romanian Deadlift)': {
      focus: 'legs',
      jointLoad: 'high',
      impactLevel: 'low',
      tempo: 'controlled',
      regression: 'use lighter dumbbells and stop once the back wants to round',
    },
  },
  'builtin-knee-recovery': {
    'Clamshell × 12（蚌式开合）': {
      focus: 'recovery',
      jointLoad: 'low',
      impactLevel: 'low',
      tempo: 'slow',
      regression: 'reduce the opening range and keep the pelvis stacked',
    },
    '臀桥 × 15（Glute Bridge）': {
      focus: 'recovery',
      jointLoad: 'low',
      impactLevel: 'low',
      tempo: 'controlled',
      regression: 'shorten the bridge and reset if the lower back starts helping',
    },
    '静蹲 30s（Wall Sit）': {
      focus: 'recovery',
      jointLoad: 'medium',
      impactLevel: 'low',
      tempo: 'steady',
      regression: 'raise the hold slightly so the knee angle stays comfortable',
    },
    '抬直腿 × 12（Straight Leg Raise）': {
      focus: 'recovery',
      jointLoad: 'low',
      impactLevel: 'low',
      tempo: 'slow',
      regression: 'reduce the lift height and pause before lowering with control',
    },
  },
};
