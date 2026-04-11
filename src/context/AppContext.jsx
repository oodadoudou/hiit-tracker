import { createContext, useContext, useMemo } from 'react';
import { BUILTIN_ROUTINES, DEFAULT_APP_STATE, SEEDED_DAILY_METRICS, STORAGE_KEYS } from '../utils/constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { dateKey, getPreviousDateKey } from '../utils/date';
import { computeDailyDeficit, computeEstimatedMetabolism, deriveCalorieStatus, normalizeRoutine } from '../utils/workout';

const AppContext = createContext(null);

function isBuiltinRoutineId(id) {
  return BUILTIN_ROUTINES.some((routine) => routine.id === id);
}

function dedupeRoutines(routines) {
  const byName = new Map();
  routines.forEach((routine) => {
    const key = routine.name.trim().toLowerCase();
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, routine);
      return;
    }
    if (isBuiltinRoutineId(routine.id) && !isBuiltinRoutineId(existing.id)) {
      byName.set(key, routine);
    }
  });
  return Array.from(byName.values());
}

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

function normalizeState(input) {
  const candidate = input && typeof input === 'object' ? input : {};
  const userSettings = {
    ...DEFAULT_APP_STATE.userSettings,
    ...(candidate.userSettings || {}),
  };
  const estimatedMetabolism = computeEstimatedMetabolism(userSettings);
  const candidateRoutines = Array.isArray(candidate.routines)
    ? candidate.routines.map(normalizeRoutine).filter(Boolean)
    : DEFAULT_APP_STATE.routines;
  const builtinMissing = BUILTIN_ROUTINES.filter(
    (builtin) => !candidateRoutines.some((routine) => routine.id === builtin.id),
  );
  const routines = dedupeRoutines([...candidateRoutines, ...builtinMissing]);
  const dailyMetricsSource = (candidate.dailyMetrics && typeof candidate.dailyMetrics === 'object')
    ? candidate.dailyMetrics
    : SEEDED_DAILY_METRICS;
  const dailyMetrics = Object.fromEntries(
    Object.entries(dailyMetricsSource).map(([key, record]) => [key, normalizeDailyMetricRecord(record, estimatedMetabolism)]),
  );
  return {
    routines: routines.length ? routines : DEFAULT_APP_STATE.routines,
    selectedRoutineId: routines.some((routine) => routine.id === candidate.selectedRoutineId)
      ? candidate.selectedRoutineId
      : (routines[0] || DEFAULT_APP_STATE.routines[0]).id,
    workoutHistory: Array.isArray(candidate.workoutHistory) ? candidate.workoutHistory : [],
    dailyMetrics,
    userSettings,
  };
}

export function AppProvider({ children }) {
  const [state, setState] = useLocalStorage(STORAGE_KEYS.appState, DEFAULT_APP_STATE);
  const safeState = useMemo(() => normalizeState(state), [state]);

  const todayKey = dateKey();
  const estimatedMetabolism = useMemo(() => computeEstimatedMetabolism(safeState.userSettings), [safeState.userSettings]);
  const getDailyMetricsValue = useMemo(
    () => (key) => safeState.dailyMetrics[key] || normalizeDailyMetricRecord(null, estimatedMetabolism),
    [estimatedMetabolism, safeState.dailyMetrics],
  );
  const todayMetrics = getDailyMetricsValue(todayKey);

  const updateState = (updater) => {
    setState((prev) => normalizeState(typeof updater === 'function' ? updater(normalizeState(prev)) : updater));
  };

  const value = useMemo(() => ({
    state: safeState,
    todayKey,
    todayMetrics,
    estimatedMetabolism,
    selectedRoutine: safeState.routines.find((routine) => routine.id === safeState.selectedRoutineId) || safeState.routines[0],
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
        const routines = prev.routines.filter((routine) => routine.id !== id);
        return {
          ...prev,
          routines,
          selectedRoutineId: routines[0].id,
        };
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
          [key]: normalizeDailyMetricRecord(
            prev.dailyMetrics[key],
            computeEstimatedMetabolism(prev.userSettings),
          ),
        },
      }));
    },
    deleteDailyMetrics(key) {
      updateState((prev) => {
        const nextDailyMetrics = { ...prev.dailyMetrics };
        delete nextDailyMetrics[key];
        return {
          ...prev,
          dailyMetrics: nextDailyMetrics,
        };
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
      updateState((prev) => ({
        ...prev,
        userSettings: {
          ...prev.userSettings,
          ...patch,
        },
      }));
    },
    exportState() {
      return JSON.stringify(safeState, null, 2);
    },
    importState(raw) {
      updateState(normalizeState(JSON.parse(raw)));
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
  }), [estimatedMetabolism, getDailyMetricsValue, safeState, todayKey, todayMetrics]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used inside AppProvider');
  return context;
}
