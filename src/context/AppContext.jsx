import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_APP_STATE, HIGH_IMPACT_ROUTINE_IDS, SEEDED_DAILY_METRICS, STORAGE_KEYS } from '../utils/constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { dateKey, getPreviousDateKey } from '../utils/date';
import { computeDailyDeficit, computeEstimatedMetabolism, deriveCalorieStatus, normalizeRoutine } from '../utils/workout';

const AppContext = createContext(null);

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

function normalizeDailyMetricRecord(record, metabolicBurn) {
  const candidate = record && typeof record === 'object' ? record : {};
  const totalBurn = Math.max(
    0,
    Math.round(
      Number(candidate.totalBurn)
      || (Number(candidate.metabolicBurn) || 0) + (Number(candidate.exerciseBurn) || 0)
      || 0,
    ),
  );
  const safeMetabolicBurn = Math.max(0, Math.round(Number(candidate.metabolicBurn) || Number(metabolicBurn) || 0));
  const intake = Math.max(0, Math.round(Number(candidate.intake) || 0));
  const exerciseBurn = Math.max(
    0,
    Math.round(Number(candidate.exerciseBurn) || Math.max(totalBurn - safeMetabolicBurn, 0)),
  );
  const waterMl = Math.max(0, Math.round(Number(candidate.waterMl) || 0));
  const deficit = Number.isFinite(Number(candidate.deficit))
    ? Math.round(Number(candidate.deficit))
    : computeDailyDeficit({ intake, exerciseBurn, metabolicBurn: safeMetabolicBurn });
  return {
    intake,
    exerciseBurn,
    waterMl,
    metabolicBurn: safeMetabolicBurn,
    totalBurn: Math.max(totalBurn, safeMetabolicBurn + exerciseBurn),
    deficit,
    intakeRangeText: String(candidate.intakeRangeText || ''),
    totalBurnRangeText: String(candidate.totalBurnRangeText || ''),
    deficitRangeText: String(candidate.deficitRangeText || ''),
    status: deriveCalorieStatus(deficit),
    note: String(candidate.note || ''),
  };
}

// builtinRoutines is the live array fetched from /routines.json
function normalizeState(input, builtinRoutines) {
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
    workoutHistory: Array.isArray(candidate.workoutHistory) ? candidate.workoutHistory : [],
    dailyMetrics,
    userSettings,
    _builtinIds: builtinIds,
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppProvider({ children }) {
  const [rawState, setRawState] = useLocalStorage(STORAGE_KEYS.appState, DEFAULT_APP_STATE);
  const [builtinRoutines, setBuiltinRoutines] = useState([]);
  const [builtinsReady, setBuiltinsReady] = useState(false);
  const builtinRoutinesRef = useRef(builtinRoutines);

  useEffect(() => {
    builtinRoutinesRef.current = builtinRoutines;
  }, [builtinRoutines]);

  // Fetch routines.json once on mount
  useEffect(() => {
    fetch('/routines.json')
      .then((res) => {
        if (!res.ok) throw new Error('routines.json not found');
        return res.json();
      })
      .then((data) => {
        const routines = Array.isArray(data) ? data.map(normalizeRoutine).filter(Boolean) : [];
        setBuiltinRoutines(routines);
      })
      .catch(() => {
        // File missing or malformed — app still works with user-saved routines
      })
      .finally(() => setBuiltinsReady(true));
  }, []);

  const safeState = useMemo(
    () => normalizeState(rawState, builtinRoutines),
    [rawState, builtinRoutines],
  );

  const todayKey = dateKey();
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
      const next = typeof updater === 'function' ? updater(normalizeState(prev, builtinRoutinesRef.current)) : updater;
      return normalizeState(next, builtinRoutinesRef.current);
    });
  };

  const value = useMemo(() => ({
    state: safeState,
    builtinsReady,
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
      if (!normalized) return;
      updateState((prev) => {
        const existingIndex = prev.routines.findIndex((item) => item.id === normalized.id);
        const nextRoutines = [...prev.routines];
        if (existingIndex >= 0) nextRoutines[existingIndex] = normalized;
        else nextRoutines.push(normalized);
        return { ...prev, routines: nextRoutines, selectedRoutineId: normalized.id };
      });
    },
    deleteRoutine(id) {
      updateState((prev) => {
        if (prev.routines.length <= 1) return prev;
        const routines = prev.routines.filter((r) => r.id !== id);
        return { ...prev, routines, selectedRoutineId: routines[0].id };
      });
    },
    addWorkoutHistory(entry) {
      updateState((prev) => {
        const key = dateKey(new Date(entry.dateIso || Date.now()));
        const metrics = normalizeDailyMetricRecord(prev.dailyMetrics[key], computeEstimatedMetabolism(prev.userSettings));
        const nextExerciseBurn = metrics.exerciseBurn + (entry.caloriesBurned || 0);
        return {
          ...prev,
          workoutHistory: [...prev.workoutHistory, entry],
          dailyMetrics: {
            ...prev.dailyMetrics,
            [key]: normalizeDailyMetricRecord({ ...metrics, exerciseBurn: nextExerciseBurn }, computeEstimatedMetabolism(prev.userSettings)),
          },
        };
      });
    },
    clearHistory() {
      updateState((prev) => ({ ...prev, workoutHistory: [] }));
    },
    updateDailyMetrics(key, patch) {
      updateState((prev) => ({
        ...prev,
        dailyMetrics: {
          ...prev.dailyMetrics,
          [key]: normalizeDailyMetricRecord(
            { ...prev.dailyMetrics[key], ...patch },
            computeEstimatedMetabolism(prev.userSettings),
          ),
        },
      }));
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
      return JSON.stringify(safeState, null, 2);
    },
    importState(raw) {
      updateState(normalizeState(JSON.parse(raw), builtinRoutinesRef.current));
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
  }), [builtinsReady, estimatedMetabolism, getDailyMetricsValue, safeState, todayKey, todayMetrics]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used inside AppProvider');
  return context;
}
