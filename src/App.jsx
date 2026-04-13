import { useEffect, useMemo, useState } from 'react';
import { formatDateShort } from './utils/date';
import TopNav from './components/layout/TopNav';
import WorkoutPage from './pages/WorkoutPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import RoutinesPage from './pages/RoutinesPage';
import SettingsPage from './pages/SettingsPage';
import DataPage from './pages/DataPage';
import Modal from './components/shared/Modal';
import { useAppContext } from './context/AppContext';

function getMotivationalMessage(summary, isNewCalBest, isNewDurBest) {
  if (isNewCalBest && isNewDurBest) return 'Double PR! Both calorie burn and duration hit new highs. Best session yet.';
  if (isNewCalBest) return 'New calorie PR! This burn topped your personal best.';
  if (isNewDurBest) return 'New duration PR! You outlasted every previous session.';
  const secs = summary?.totalDurationSec || 0;
  const cals = summary?.caloriesBurned || 0;
  if (secs >= 1800) return 'Over 30 minutes. That counts as a real session.';
  if (cals >= 200) return 'Solid burn. Keep this pace going.';
  if (secs >= 600) return 'Done. Every session is an investment in your future self.';
  return 'Good work. Moving today beats not moving.';
}

export default function App() {
  const [page, setPage] = useState('workout');
  const [pendingSummary, setPendingSummary] = useState(null);
  const [sessionNotice, setSessionNotice] = useState('');
  const [rpe, setRpe] = useState(5);
  const [jointComfort, setJointComfort] = useState(5);
  const [discardPromptOpen, setDiscardPromptOpen] = useState(false);
  const { state, addWorkoutHistory, todayKey } = useAppContext();
  const minimumSavedWorkoutSec = Math.max(0, Number(state.userSettings.minimumSavedWorkoutSec) || 0);
  const todayLabel = useMemo(
    () => formatDateShort(new Date(`${todayKey}T12:00:00`)),
    [todayKey],
  );

  // ── Feature 6: Personal best detection ──
  const { isNewCalBest, isNewDurBest } = useMemo(() => {
    if (!pendingSummary) return {};
    const history = state.workoutHistory.filter(
      (item) => item.routineId === pendingSummary.routineId,
    );
    if (!history.length) return { isNewCalBest: true, isNewDurBest: true };
    const maxCals = Math.max(...history.map((h) => h.caloriesBurned || 0));
    const maxDur = Math.max(...history.map((h) => h.totalDurationSec || 0));
    return {
      isNewCalBest: (pendingSummary.caloriesBurned || 0) > maxCals,
      isNewDurBest: (pendingSummary.totalDurationSec || 0) > maxDur,
    };
  }, [pendingSummary, state.workoutHistory]);

  const motivationalMessage = pendingSummary
    ? getMotivationalMessage(pendingSummary, isNewCalBest, isNewDurBest)
    : '';

  // Per-exercise calorie breakdown for the completion modal
  const exerciseBreakdown = useMemo(() => {
    if (!pendingSummary) return [];
    const routine = state.routines.find((r) => r.id === pendingSummary.routineId);
    if (!routine?.exercises?.length) return [];
    const exercises = routine.exercises;
    const perExSec = (pendingSummary.activeWorkSec || 0) / exercises.length;
    const weightKg = Math.max(30, Number(state.userSettings.weightKg) || 60);
    const BASE_MET = { cardio: 9.5, legs: 6.5, upper: 5.0, core: 3.5, recovery: 2.0, general: 5.5 };
    const IMPACT_MOD = { high: 1.25, medium: 1.0, low: 0.8 };
    const EPOC_BONUS = { cardio: 0.25, legs: 0.10, upper: 0.05, core: 0.05, recovery: 0.0, general: 0.10 };
    return exercises.map((ex) => {
      const met = (BASE_MET[ex.focus] ?? 5.5) * (IMPACT_MOD[ex.impactLevel] ?? 1.0);
      const epoc = EPOC_BONUS[ex.focus] ?? 0.10;
      const cal = Math.round(met * weightKg * (perExSec / 3600) * (pendingSummary.intensityMultiplier || 1) * (1 + epoc));
      return { name: ex.name, cal, focus: ex.focus };
    });
  }, [pendingSummary, state.routines, state.userSettings.weightKg]);

  useEffect(() => {
    if (!pendingSummary) {
      setDiscardPromptOpen(false);
    }
  }, [pendingSummary]);

  useEffect(() => {
    if (!sessionNotice) return undefined;
    const id = window.setTimeout(() => setSessionNotice(''), 2800);
    return () => window.clearTimeout(id);
  }, [sessionNotice]);

  const handleSessionStop = (summary) => {
    if (!summary) return;
    const dur = summary.totalDurationSec || 0;
    // Manual stops always show the save prompt regardless of duration
    if (!summary.wasManualStop && dur < minimumSavedWorkoutSec) {
      setPendingSummary(null);
      const mins = Math.round(minimumSavedWorkoutSec / 60);
      setSessionNotice(`Session under ${mins} min — not saved. Adjust the minimum in Profile settings.`);
      return;
    }
    setPendingSummary(summary);
  };

  const requestCloseSummary = () => {
    setDiscardPromptOpen(true);
  };

  const confirmDiscardSummary = () => {
    setPendingSummary(null);
    setDiscardPromptOpen(false);
    setRpe(5);
    setJointComfort(5);
  };

  const cancelDiscardSummary = () => {
    setDiscardPromptOpen(false);
  };

  const saveSession = () => {
    if (!pendingSummary) return;
    addWorkoutHistory({ ...pendingSummary, rpe, jointComfort });
    setPendingSummary(null);
    setDiscardPromptOpen(false);
    setRpe(5);
    setJointComfort(5);
    setPage('history');
  };

  return (
    <div className="min-h-screen text-white">
      <TopNav page={page} onChange={setPage} />
      <header className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="rounded-[2rem] border border-white/10 bg-[rgba(18,22,20,0.82)] px-5 py-5 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.42em] text-[#c8d1c3]">G Direction</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#f2f5ef] sm:text-4xl">
                Focused Training
              </h1>
            </div>
            <div className="min-w-[140px] sm:text-right">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#8d9688]">Today</p>
              <p className="mt-2 text-lg font-medium text-[#f2f5ef]">{todayLabel}</p>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
        {page === 'workout' ? <WorkoutPage onSessionStop={handleSessionStop} /> : null}
        {page === 'dashboard' ? <DashboardPage /> : null}
        {page === 'history' ? <HistoryPage /> : null}
        {page === 'routines' ? <RoutinesPage /> : null}
        {page === 'settings' ? <SettingsPage /> : null}
        {page === 'data' ? <DataPage /> : null}
      </main>
      {sessionNotice ? (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-[rgba(18,22,20,0.92)] px-4 py-2 text-sm text-[#d7ddd0] shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
          {sessionNotice}
        </div>
      ) : null}

      {/* ── Feature 6: Richer workout completion modal ── */}
      <Modal open={Boolean(pendingSummary)} title={pendingSummary?.wasManualStop ? 'Save Session?' : 'Workout Complete!'} onClose={requestCloseSummary}>
        {pendingSummary ? (
          <div>
            {discardPromptOpen ? (
              <div className="mt-3 rounded-[1.4rem] border border-[#ff8b2b]/25 bg-[#ff8b2b]/8 px-4 py-4">
                <p className="text-sm font-medium text-[#ff8b2b]">Discarding will clear this session summary.</p>
                <p className="mt-1 text-sm text-[#ffc490]">If you tapped close by accident, keep saving.</p>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={cancelDiscardSummary}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[#f2f5ef]"
                  >
                    Keep saving
                  </button>
                  <button
                    type="button"
                    onClick={confirmDiscardSummary}
                    className="rounded-full bg-[#ff8b2b] px-4 py-2.5 text-sm font-semibold text-black"
                  >
                    Discard
                  </button>
                </div>
              </div>
            ) : null}

            {/* Motivational message */}
            <div className="mt-3 rounded-[1.4rem] border border-[#d4ff6a]/20 bg-[#d4ff6a]/8 px-4 py-3 text-sm text-[#d4ff6a]">
              {motivationalMessage}
            </div>

            {/* Personal best badges */}
            {(isNewCalBest || isNewDurBest) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {isNewCalBest && (
                  <span className="rounded-full border border-[#d4ff6a]/30 bg-[#d4ff6a]/10 px-3 py-1 text-xs font-medium text-[#d4ff6a]">
                    🏆 Calorie PR
                  </span>
                )}
                {isNewDurBest && (
                  <span className="rounded-full border border-[#d4ff6a]/30 bg-[#d4ff6a]/10 px-3 py-1 text-xs font-medium text-[#d4ff6a]">
                    ⏱ Duration PR
                  </span>
                )}
              </div>
            )}

            {/* Summary stats */}
            <div className="mt-4 rounded-[1.6rem] border border-white/10 bg-[rgba(32,38,34,0.72)] p-4 text-sm text-[#c8d1c3]">
              <div className="flex justify-between gap-4">
                <span>Routine</span>
                <span className="font-semibold text-[#f2f5ef]">{pendingSummary.routineName}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span>Duration</span>
                <span className="font-semibold text-[#f2f5ef]">{pendingSummary.durationLabel}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span>Calories</span>
                <span className="font-semibold text-[#d4ff6a]">{pendingSummary.caloriesBurned} kcal</span>
              </div>
            </div>

            {/* Exercise-by-exercise breakdown */}
            {exerciseBreakdown.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">
                  Exercise Breakdown
                </p>
                <div className="max-h-[160px] overflow-y-auto space-y-1 rounded-[1.2rem] border border-white/8 bg-white/[0.02] p-3">
                  {exerciseBreakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-[#aeb7a8]">{item.name || `Exercise ${i + 1}`}</span>
                      <span className="shrink-0 font-semibold text-[#d4ff6a]">~{item.cal} kcal</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Feature 7: Body feel ratings ── */}
            <div className="mt-5">
              <label className="block text-sm font-medium text-[#e8ece3]">
                Cardio Fatigue (RPE)
                <span className="ml-2 text-[#d4ff6a]">{rpe}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
                className="mt-3 w-full"
              />
              <div className="mt-1 flex justify-between text-[10px] text-[#8d9688]">
                <span>Easy</span><span>Moderate</span><span>Hard</span>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#e8ece3]">
                Joint Comfort
                <span className="ml-2 text-[#d4ff6a]">{jointComfort}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={jointComfort}
                onChange={(e) => setJointComfort(Number(e.target.value))}
                className="mt-3 w-full"
              />
              <div className="mt-1 flex justify-between text-[10px] text-[#8d9688]">
                <span>Poor</span><span>OK</span><span>Great</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={saveSession}
                className="rounded-full bg-[#d4ff6a] px-4 py-4 font-semibold text-black"
              >
                Save Record
              </button>
              <button
                type="button"
                onClick={requestCloseSummary}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-4 font-medium text-[#f2f5ef]"
              >
                Discard
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
