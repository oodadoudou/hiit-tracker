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
  if (!name) return null;
  return {
    name,
    images: images.length ? images : ['https://via.placeholder.com/640x360?text=Exercise'],
    tips: tips.length ? tips : ['Keep good form', 'Stay controlled'],
  };
}

export function normalizeRoutine(routine) {
  if (!routine || typeof routine !== 'object') return null;
  const exercises = Array.isArray(routine.exercises)
    ? routine.exercises.map(normalizeExercise).filter(Boolean)
    : [];
  const name = String(routine.name || '').trim();
  if (!name || !exercises.length) return null;
  return {
    id: String(routine.id || crypto.randomUUID()),
    name,
    mode: routine.mode === 'finite' ? 'finite' : 'infinite',
    workSec: Math.max(5, Math.round(Number(routine.workSec) || 40)),
    restSec: Math.max(0, Math.round(Number(routine.restSec) || 20)),
    circuitRestSec: Math.max(0, Math.round(Number(routine.circuitRestSec) || 0)),
    circuits: Math.max(1, Math.round(Number(routine.circuits) || 1)),
    exercises,
  };
}

export function buildWorkoutSummary({ routine, elapsedSec, activeWorkSec }) {
  return {
    id: crypto.randomUUID(),
    dateIso: new Date().toISOString(),
    routineId: routine?.id || null,
    routineName: routine?.name || 'Workout',
    totalDurationSec: elapsedSec,
    durationLabel: formatClock(elapsedSec),
    activeWorkSec,
    caloriesBurned: Math.max(0, Math.round((activeWorkSec / 60) * 9)),
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
