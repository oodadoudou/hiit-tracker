import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import builtinRoutinesSource from '../data/builtinRoutines.json';
import { EXERCISE_LIBRARY as builtinExercises } from '../data/exerciseLibrary';
import { DEFAULT_APP_STATE, HIGH_IMPACT_ROUTINE_IDS, SEEDED_DAILY_METRICS, STORAGE_KEYS } from '../utils/constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { dateKey, getPreviousDateKey } from '../utils/date';
import { createDefaultCoachCatUi, loadCoachCatUi, saveCoachCatUi } from '../utils/coachCatUi';
import { computeDailyDeficit, computeEstimatedMetabolism, deriveCalorieStatus, normalizeRoutine } from '../utils/workout';

const AppContext = createContext(null);

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

function normalizeExerciseLibrary(candidate, builtins) {
  const items = Array.isArray(candidate) ? candidate : [];
  const merged = new Map();

  // 1. Builtins first, marked isBuiltin: true
  builtins.forEach((ex) => {
    if (ex && ex.name) {
      merged.set(ex.name, { ...ex, isBuiltin: true });
    }
  });

  // 2. User items next, only if not already present (don't override builtins)
  items.forEach((ex) => {
    if (ex && ex.name && !merged.has(ex.name)) {
      merged.set(ex.name, { ...ex, isBuiltin: false });
    }
  });

  return Array.from(merged.values());
}

function normalizeDailyMetricRecord(record, metabolicBurn) {
  const candidate = record && typeof record === 'object' ? record : {};
  const safeMetabolicBurn = Math.max(0, Math.round(Number(candidate.metabolicBurn) || Number(metabolicBurn) || 0));
  const intake = Math.max(0, Math.round(Number(candidate.intake) || 0));
  const legacyExerciseBurn = Math.max(
    0,
    Math.round(Number(candidate.exerciseBurn) || Math.max(Number(candidate.totalBurn) - safeMetabolicBurn, 0)),
  );
  const workoutExerciseBurn = Math.max(0, Math.round(Number(candidate.workoutExerciseBurn) || 0));
  const manualExerciseBurn = candidate.manualExerciseBurn === undefined
    ? Math.max(0, legacyExerciseBurn - workoutExerciseBurn)
    : Math.max(0, Math.round(Number(candidate.manualExerciseBurn) || 0));
  const exerciseBurn = manualExerciseBurn + workoutExerciseBurn;
  const waterMl = Math.max(0, Math.round(Number(candidate.waterMl) || 0));
  const totalBurn = safeMetabolicBurn + exerciseBurn;
  const deficit = computeDailyDeficit({ intake, exerciseBurn, metabolicBurn: safeMetabolicBurn });
  return {
    intake,
    exerciseBurn,
    manualExerciseBurn,
    workoutExerciseBurn,
    waterMl,
    metabolicBurn: safeMetabolicBurn,
    totalBurn,
    deficit,
    intakeRangeText: String(candidate.intakeRangeText || ''),
    totalBurnRangeText: String(candidate.totalBurnRangeText || ''),
    deficitRangeText: String(candidate.deficitRangeText || ''),
    status: deriveCalorieStatus(deficit),
    note: String(candidate.note || ''),
  };
}

function normalizeWorkoutHistoryEntry(entry) {
  const candidate = entry && typeof entry === 'object' ? entry : null;
  if (!candidate) return null;

  const parsedDate = new Date(candidate.dateIso);
  if (Number.isNaN(parsedDate.getTime())) return null;

  const totalDurationSec = Math.max(0, Math.round(Number(candidate.totalDurationSec) || 0));
  const activeWorkSec = Math.max(0, Math.round(Number(candidate.activeWorkSec) || 0));
  const caloriesBurned = Math.max(0, Math.round(Number(candidate.caloriesBurned) || 0));
  const rpe = clampNumber(candidate.rpe, 1, 10, 5);
  const jointComfort = clampNumber(candidate.jointComfort, 1, 10, 5);

  return {
    id: String(candidate.id || crypto.randomUUID()),
    dateIso: parsedDate.toISOString(),
    routineId: candidate.routineId ? String(candidate.routineId) : null,
    routineName: String(candidate.routineName || 'Workout'),
    totalDurationSec,
    durationLabel: String(candidate.durationLabel || '00:00'),
    activeWorkSec,
    caloriesBurned,
    intensityKey: String(candidate.intensityKey || 'normal'),
    intensityMultiplier: Math.max(0.6, Number(candidate.intensityMultiplier) || 1),
    rpe,
    jointComfort,
  };
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function syncDailyMetricsWithWorkoutHistory(dailyMetrics, workoutHistory, userSettings) {
  const estimatedMetabolism = computeEstimatedMetabolism(userSettings);
  const workoutBurnByKey = new Map();

  workoutHistory.forEach((entry) => {
    const key = dateKey(new Date(entry.dateIso || Date.now()));
    workoutBurnByKey.set(key, (workoutBurnByKey.get(key) || 0) + Math.max(0, Number(entry.caloriesBurned) || 0));
  });

  const keys = new Set([
    ...Object.keys(dailyMetrics || {}),
    ...workoutBurnByKey.keys(),
  ]);

  return Object.fromEntries(
    [...keys].map((key) => {
      const record = normalizeDailyMetricRecord(dailyMetrics?.[key], estimatedMetabolism);
      return [
        key,
        normalizeDailyMetricRecord(
          { ...record, workoutExerciseBurn: workoutBurnByKey.get(key) || 0 },
          estimatedMetabolism,
        ),
      ];
    }),
  );
}

function normalizeState(input, builtinRoutines, builtinExercises) {
  const candidate = input && typeof input === 'object' ? input : {};
  const userSettings = {
    ...DEFAULT_APP_STATE.userSettings,
    ...(candidate.userSettings || {}),
  };
  const estimatedMetabolism = computeEstimatedMetabolism(userSettings);

  const builtinIds = new Set(builtinRoutines.map((r) => r.id));

  // User-stored routines (already normalized on save, re-normalize for safety)
  const storedRoutines = Array.isArray(candidate.routines)
    ? candidate.routines.map(normalizeRoutine).filter(Boolean)
    : [];

  // IDs present in stored state
  const storedIds = new Set(storedRoutines.map((r) => r.id));

  // Builtins that are not yet in stored state get appended
  const builtinMissing = builtinRoutines.filter((b) => !storedIds.has(b.id));

  // Merge: stored first (user wins), then new builtins appended
  // Deduplicate by ID — stored copy always takes priority
  const byId = new Map();
  [...storedRoutines, ...builtinMissing].forEach((r) => {
    if (!byId.has(r.id)) byId.set(r.id, r);
  });
  const routines = Array.from(byId.values());

  const dailyMetricsSource = (candidate.dailyMetrics && typeof candidate.dailyMetrics === 'object')
    ? candidate.dailyMetrics
    : SEEDED_DAILY_METRICS;
  const dailyMetrics = Object.fromEntries(
    Object.entries(dailyMetricsSource).map(([key, record]) => [key, normalizeDailyMetricRecord(record, estimatedMetabolism)]),
  );

  const fallbackId = routines[0]?.id ?? null;
  return {
    routines,
    selectedRoutineId: routines.some((r) => r.id === candidate.selectedRoutineId)
      ? candidate.selectedRoutineId
      : fallbackId,
    workoutHistory: Array.isArray(candidate.workoutHistory)
      ? candidate.workoutHistory.map(normalizeWorkoutHistoryEntry).filter(Boolean)
      : [],
    dailyMetrics,
    userSettings,
    exerciseLibrary: normalizeExerciseLibrary(candidate.exerciseLibrary, builtinExercises),
    _builtinIds: builtinIds,
    _builtinExerciseNames: new Set(builtinExercises.map((e) => e.name)),
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppProvider({ children }) {
  const [rawState, setRawState] = useLocalStorage(STORAGE_KEYS.appState, DEFAULT_APP_STATE);
  const builtinRoutines = useMemo(
    () => (Array.isArray(builtinRoutinesSource) ? builtinRoutinesSource.map(normalizeRoutine).filter(Boolean) : []),
    [],
  );
  const [todayKey, setTodayKey] = useState(() => dateKey());
  const builtinRoutinesRef = useRef(builtinRoutines);

  useEffect(() => {
    builtinRoutinesRef.current = builtinRoutines;
  }, [builtinRoutines]);

  useEffect(() => {
    const syncTodayKey = () => setTodayKey(dateKey());
    syncTodayKey();

    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const delayMs = Math.max(1000, nextMidnight.getTime() - now.getTime() + 1000);
    const timerId = window.setTimeout(syncTodayKey, delayMs);

    return () => window.clearTimeout(timerId);
  }, [todayKey]);

  const safeState = useMemo(
    () => normalizeState(rawState, builtinRoutines, builtinExercises),
    [rawState, builtinRoutines],
  );
  const estimatedMetabolism = useMemo(
    () => computeEstimatedMetabolism(safeState.userSettings),
    [safeState.userSettings],
  );

  const getDailyMetricsValue = useMemo(
    () => (key) => safeState.dailyMetrics[key] || normalizeDailyMetricRecord(null, estimatedMetabolism),
    [estimatedMetabolism, safeState.dailyMetrics],
  );

  const todayMetrics = getDailyMetricsValue(todayKey);

  const updateState = (updater) => {
    setRawState((prev) => {
      const next = typeof updater === 'function' ? updater(normalizeState(prev, builtinRoutinesRef.current, builtinExercises)) : updater;
      const normalized = normalizeState(next, builtinRoutinesRef.current, builtinExercises);
      // Ensure raw state stores only non-builtin exercises to keep it clean
      return {
        ...normalized,
        exerciseLibrary: (normalized.exerciseLibrary || []).filter((ex) => !ex.isBuiltin),
      };
    });
  };

  const value = useMemo(() => ({
    state: safeState,
    builtinsReady: true,
    todayKey,
    todayMetrics,
    estimatedMetabolism,
    selectedRoutine: safeState.routines.find((r) => r.id === safeState.selectedRoutineId) || safeState.routines[0] || null,
    getDailyMetrics(key) {
      return getDailyMetricsValue(key);
    },
    setSelectedRoutine(id) {
      updateState((prev) => ({ ...prev, selectedRoutineId: id }));
    },
    saveRoutine(routine) {
      const normalized = normalizeRoutine(routine);
      if (!normalized) return { ok: false, reason: 'invalid-routine' };
      let finalRoutine = normalized;
      updateState((prev) => {
        const existingIndex = prev.routines.findIndex((item) => item.id === normalized.id);
        const nextRoutines = [...prev.routines];
        if (existingIndex >= 0) {
          nextRoutines[existingIndex] = normalized;
        } else {
          // Deduplicate name for new routines
          const takenNames = new Set(prev.routines.map((r) => r.name));
          let uniqueName = normalized.name;
          if (takenNames.has(uniqueName)) {
            let i = 1;
            while (takenNames.has(`${normalized.name} ${i}`)) i++;
            uniqueName = `${normalized.name} ${i}`;
          }
          finalRoutine = { ...normalized, name: uniqueName };
          nextRoutines.push(finalRoutine);
        }
        return { ...prev, routines: nextRoutines, selectedRoutineId: finalRoutine.id };
      });
      return { ok: true, routine: finalRoutine };
    },
    deleteRoutine(id) {
      let result = { ok: false, reason: 'not-found' };
      updateState((prev) => {
        if (prev._builtinIds?.has(id)) {
          result = { ok: false, reason: 'builtin-routine' };
          return prev;
        }
        if (prev.routines.length <= 1) {
          result = { ok: false, reason: 'last-routine' };
          return prev;
        }
        const routines = prev.routines.filter((r) => r.id !== id);
        if (routines.length === prev.routines.length) return prev;
        result = { ok: true };
        return { ...prev, routines, selectedRoutineId: routines[0].id };
      });
      return result;
    },
    saveExerciseToLibrary(exercise) {
      if (!exercise || !exercise.name) return { ok: false, reason: 'invalid-exercise' };
      updateState((prev) => {
        if (prev._builtinExerciseNames?.has(exercise.name)) return prev;
        const newUserLibrary = (prev.exerciseLibrary || [])
          .filter((ex) => !ex.isBuiltin && ex.name !== exercise.name);
        newUserLibrary.push({ ...exercise, isBuiltin: false });
        return { ...prev, exerciseLibrary: newUserLibrary };
      });
      return { ok: true };
    },
    deleteExerciseFromLibrary(name) {
      updateState((prev) => {
        if (prev._builtinExerciseNames?.has(name)) return prev;
        const newUserLibrary = (prev.exerciseLibrary || [])
          .filter((ex) => !ex.isBuiltin && ex.name !== name);
        return { ...prev, exerciseLibrary: newUserLibrary };
      });
    },
    addWorkoutHistory(entry) {
      const normalizedEntry = normalizeWorkoutHistoryEntry(entry);
      if (!normalizedEntry) return false;
      updateState((prev) => {
        const nextWorkoutHistory = [...prev.workoutHistory, normalizedEntry];
        return {
          ...prev,
          workoutHistory: nextWorkoutHistory,
          dailyMetrics: syncDailyMetricsWithWorkoutHistory(prev.dailyMetrics, nextWorkoutHistory, prev.userSettings),
        };
      });
      return true;
    },
    updateWorkoutHistory(id, patch) {
      let updated = false;
      updateState((prev) => {
        const nextWorkoutHistory = prev.workoutHistory.map((entry) => {
          if (entry.id !== id) return entry;
          const normalizedEntry = normalizeWorkoutHistoryEntry({ ...entry, ...patch, id: entry.id });
          if (!normalizedEntry) return entry;
          updated = true;
          return normalizedEntry;
        });
        if (!updated) return prev;
        return {
          ...prev,
          workoutHistory: nextWorkoutHistory,
          dailyMetrics: syncDailyMetricsWithWorkoutHistory(prev.dailyMetrics, nextWorkoutHistory, prev.userSettings),
        };
      });
      return updated;
    },
    deleteWorkoutHistory(id) {
      let deleted = false;
      updateState((prev) => {
        const nextWorkoutHistory = prev.workoutHistory.filter((entry) => entry.id !== id);
        deleted = nextWorkoutHistory.length !== prev.workoutHistory.length;
        if (!deleted) return prev;
        return {
          ...prev,
          workoutHistory: nextWorkoutHistory,
          dailyMetrics: syncDailyMetricsWithWorkoutHistory(prev.dailyMetrics, nextWorkoutHistory, prev.userSettings),
        };
      });
      return deleted;
    },
    clearHistory() {
      updateState((prev) => ({
        ...prev,
        workoutHistory: [],
        dailyMetrics: syncDailyMetricsWithWorkoutHistory(prev.dailyMetrics, [], prev.userSettings),
      }));
    },
    updateDailyMetrics(key, patch) {
      updateState((prev) => {
        const currentRecord = normalizeDailyMetricRecord(
          prev.dailyMetrics[key],
          computeEstimatedMetabolism(prev.userSettings),
        );
        const mergedPatch = { ...patch };
        if (Object.prototype.hasOwnProperty.call(mergedPatch, 'exerciseBurn')) {
          const requestedExerciseBurn = Math.max(0, Math.round(Number(mergedPatch.exerciseBurn) || 0));
          mergedPatch.manualExerciseBurn = Math.max(0, requestedExerciseBurn - currentRecord.workoutExerciseBurn);
          delete mergedPatch.exerciseBurn;
        }
        return {
          ...prev,
          dailyMetrics: {
            ...prev.dailyMetrics,
            [key]: normalizeDailyMetricRecord(
              { ...currentRecord, ...mergedPatch },
              computeEstimatedMetabolism(prev.userSettings),
            ),
          },
        };
      });
    },
    createDailyMetrics(key) {
      updateState((prev) => ({
        ...prev,
        dailyMetrics: {
          ...prev.dailyMetrics,
          [key]: normalizeDailyMetricRecord(prev.dailyMetrics[key], computeEstimatedMetabolism(prev.userSettings)),
        },
      }));
    },
    deleteDailyMetrics(key) {
      updateState((prev) => {
        const nextDailyMetrics = { ...prev.dailyMetrics };
        delete nextDailyMetrics[key];
        return { ...prev, dailyMetrics: nextDailyMetrics };
      });
    },
    updateTodayMetrics(patch) {
      updateState((prev) => ({
        ...prev,
        dailyMetrics: {
          ...prev.dailyMetrics,
          [todayKey]: normalizeDailyMetricRecord(
            { ...prev.dailyMetrics[todayKey], ...patch },
            computeEstimatedMetabolism(prev.userSettings),
          ),
        },
      }));
    },
    updateUserSettings(patch) {
      updateState((prev) => ({ ...prev, userSettings: { ...prev.userSettings, ...patch } }));
    },
    exportState() {
      const exportable = {
        ...safeState,
        // Exclude builtin exercises — they're re-merged on import, exporting them causes duplication
        exerciseLibrary: (safeState.exerciseLibrary || []).filter((ex) => !ex.isBuiltin),
        // Exclude builtin routines — same reason
        routines: (safeState.routines || []).filter((r) => !r.isBuiltin),
      };
      return JSON.stringify({
        appState: exportable,
        coachCatUi: loadCoachCatUi(safeState.userSettings.coachStyle || 'cold'),
      }, null, 2);
    },
    importState(raw) {
      const parsed = JSON.parse(raw);
      const nextAppState = parsed?.appState ? parsed.appState : parsed;
      updateState(normalizeState(nextAppState, builtinRoutinesRef.current, builtinExercises));
      if (parsed?.coachCatUi) {
        const fallback = createDefaultCoachCatUi(nextAppState?.userSettings?.coachStyle || 'cold');
        saveCoachCatUi({ ...fallback, ...parsed.coachCatUi, memory: { ...fallback.memory, ...(parsed.coachCatUi.memory || {}) } });
      }
    },
    // Partial import: 'routines' | 'exercises' | 'merge' | 'full'
    importStatePartial(raw, mode) {
      const parsed = JSON.parse(raw);
      const src = parsed?.appState ? parsed.appState : parsed;

      if (mode === 'routines') {
        // Import routines only — upsert by ID, keep everything else
        const incoming = Array.isArray(src.routines) ? src.routines.map(normalizeRoutine).filter(Boolean) : [];
        updateState((prev) => {
          const byId = new Map(prev.routines.map((r) => [r.id, r]));
          incoming.forEach((r) => { if (!prev._builtinIds?.has(r.id)) byId.set(r.id, r); });
          return { ...prev, routines: Array.from(byId.values()) };
        });
      } else if (mode === 'exercises') {
        // Import custom exercises only — deduplicate by name
        const incoming = Array.isArray(src.exerciseLibrary)
          ? src.exerciseLibrary.filter((e) => !e.isBuiltin)
          : [];
        updateState((prev) => {
          const builtinNames = prev._builtinExerciseNames || new Set();
          const existing = (prev.exerciseLibrary || []).filter((e) => !e.isBuiltin);
          const byName = new Map(existing.map((e) => [e.name, e]));
          incoming.forEach((e) => { if (e.name && !builtinNames.has(e.name)) byName.set(e.name, { ...e, isBuiltin: false }); });
          return { ...prev, exerciseLibrary: Array.from(byName.values()) };
        });
      } else if (mode === 'merge') {
        // Merge: add new routines + exercises, keep local if same ID/name exists
        const incomingRoutines = Array.isArray(src.routines) ? src.routines.map(normalizeRoutine).filter(Boolean) : [];
        const incomingExercises = Array.isArray(src.exerciseLibrary) ? src.exerciseLibrary.filter((e) => !e.isBuiltin) : [];
        updateState((prev) => {
          const byId = new Map(prev.routines.map((r) => [r.id, r]));
          incomingRoutines.forEach((r) => { if (!byId.has(r.id) && !prev._builtinIds?.has(r.id)) byId.set(r.id, r); });
          const builtinNames = prev._builtinExerciseNames || new Set();
          const byName = new Map((prev.exerciseLibrary || []).filter((e) => !e.isBuiltin).map((e) => [e.name, e]));
          incomingExercises.forEach((e) => { if (e.name && !builtinNames.has(e.name) && !byName.has(e.name)) byName.set(e.name, { ...e, isBuiltin: false }); });
          return { ...prev, routines: Array.from(byId.values()), exerciseLibrary: Array.from(byName.values()) };
        });
      } else {
        // Full restore (default)
        updateState(normalizeState(src, builtinRoutinesRef.current, builtinExercises));
      }
    },
    hasThreeDayStreak() {
      let key = todayKey;
      for (let i = 0; i < 3; i += 1) {
        const metrics = getDailyMetricsValue(key);
        const workedOut = safeState.workoutHistory.some((entry) => dateKey(new Date(entry.dateIso)) === key);
        const deficit = metrics ? metrics.deficit < 0 : false;
        if (!workedOut || !deficit) return false;
        key = getPreviousDateKey(key);
      }
      return true;
    },
    hasConsecutiveHighImpact() {
      const last3 = [...safeState.workoutHistory]
        .sort((a, b) => new Date(b.dateIso) - new Date(a.dateIso))
        .slice(0, 3);
      return last3.length === 3 && last3.every((entry) => HIGH_IMPACT_ROUTINE_IDS.has(entry.routineId));
    },
  }), [estimatedMetabolism, getDailyMetricsValue, safeState, todayKey, todayMetrics]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used inside AppProvider');
  return context;
}
