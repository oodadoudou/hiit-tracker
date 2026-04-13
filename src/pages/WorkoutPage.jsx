import { useEffect, useMemo, useRef, useState } from 'react';
import Card from '../components/shared/Card';
import CoachCat from '../components/timer/CoachCat';
import PhaseBadge from '../components/timer/PhaseBadge';
import TimerDisplay from '../components/timer/TimerDisplay';
import TimerControls from '../components/timer/TimerControls';
import VisualGuide from '../components/timer/VisualGuide';
import { useAppContext } from '../context/AppContext';
import { useTimer } from '../hooks/useTimer';
import { HIGH_IMPACT_ROUTINE_IDS, ROUTINE_WARMUP_CATEGORY, WARMUP_SUGGESTIONS } from '../utils/constants';
import { playSessionCue } from '../utils/audio';
import { loadCoachCatUi, updateCoachCatMemory } from '../utils/coachCatUi';
import { buildWorkoutGuidance } from '../utils/workoutGuidance';
import { buildCoachCatState, buildMotionProfile, getNextText } from '../utils/coachCatState';

const INTENSITY_OPTIONS = [
  { key: 'easy', label: 'Easy', mult: 0.75, activeClass: 'border-[#4ade80]/50 bg-[#4ade80]/8 text-[#4ade80]' },
  { key: 'normal', label: 'Normal', mult: 1, activeClass: 'border-[#d4ff6a]/50 bg-[#d4ff6a]/8 text-[#d4ff6a]' },
  { key: 'sprint', label: 'Sprint', mult: 1.25, activeClass: 'border-[#ff8b2b]/50 bg-[#ff8b2b]/8 text-[#ff8b2b]' },
];

export default function WorkoutPage({ onSessionStop }) {
  const { state, selectedRoutine, setSelectedRoutine, hasConsecutiveHighImpact, updateUserSettings } = useAppContext();
  const [intensity, setIntensity] = useState('normal');
  const [warmupDismissed, setWarmupDismissed] = useState(false);
  const [highImpactDismissed, setHighImpactDismissed] = useState(false);
  const [guidanceDismissed, setGuidanceDismissed] = useState(false);
  const [coachClock, setCoachClock] = useState(() => Date.now());
  const [celebrationUntil, setCelebrationUntil] = useState(0);
  const [coachMemory, setCoachMemory] = useState(() => loadCoachCatUi().memory);
  const previousTimerRef = useRef(null);
  const idleStartedAtRef = useRef(Date.now());

  const activeRoutine = useMemo(() => {
    if (!selectedRoutine) return null;
    const mult = INTENSITY_OPTIONS.find((o) => o.key === intensity)?.mult ?? 1;
    return { ...selectedRoutine, workSec: Math.round(selectedRoutine.workSec * mult) };
  }, [selectedRoutine, intensity]);

  // Last completed workout (for quick-redo)
  const lastWorkout = useMemo(() => {
    if (!state.workoutHistory?.length) return null;
    return [...state.workoutHistory].sort((a, b) => new Date(b.dateIso) - new Date(a.dateIso))[0];
  }, [state.workoutHistory]);

  const lastWorkoutRoutine = useMemo(() => {
    if (!lastWorkout?.routineId) return null;
    return state.routines.find((r) => r.id === lastWorkout.routineId) || null;
  }, [lastWorkout, state.routines]);
  const intensityMultiplier = useMemo(
    () => INTENSITY_OPTIONS.find((o) => o.key === intensity)?.mult ?? 1,
    [intensity],
  );

  useEffect(() => {
    setWarmupDismissed(false);
    setHighImpactDismissed(false);
    setGuidanceDismissed(false);
    idleStartedAtRef.current = Date.now();
  }, [selectedRoutine?.id]);

  const readiness = useMemo(() => buildWorkoutGuidance({
    routine: activeRoutine,
    workoutHistory: state.workoutHistory,
    hasConsecutiveHighImpact: hasConsecutiveHighImpact(),
  }), [activeRoutine, hasConsecutiveHighImpact, state.workoutHistory]);
  const coachStyle = state.userSettings.coachStyle || 'cold';
  const coachPromptFrequency = state.userSettings.coachPromptFrequency || 'balanced';
  const warmupPreference = state.userSettings.warmupPreference || 'minimal';
  const adaptiveProfile = useMemo(
    () => buildAdaptiveCoachProfile({
      coachStyle,
      coachPromptFrequency,
      warmupPreference,
      coachMemory,
    }),
    [coachMemory, coachPromptFrequency, coachStyle, warmupPreference],
  );
  const enableCoachCat = state.userSettings.enableCoachCat !== false;
  const enableEncouragementAudio = state.userSettings.enableEncouragementAudio !== false;

  const handleSessionStop = (summary) => {
    const completedAt = Date.now();
    const outcome = summary?.caloriesBurned >= 200 ? 'big-burn' : summary?.totalDurationSec >= 1200 ? 'long-session' : 'solid';
    setCelebrationUntil(completedAt + 9000);
    setCoachMemory((prev) => ({
      ...prev,
      lastCompletedAt: completedAt,
      lastCompletedRoutine: summary?.routineName || '',
      lastCompletedIntensity: intensity,
      lastCompletedOutcome: outcome,
    }));
    updateCoachCatMemory({
      lastCompletedAt: completedAt,
      lastCompletedRoutine: summary?.routineName || '',
      lastCompletedIntensity: intensity,
      lastCompletedOutcome: outcome,
    }, coachStyle);
    onSessionStop?.(summary);
  };

  // Average sessions per week over the last 4 weeks — used for frequency-aware calorie formula
  const sessionsPerWeek = useMemo(() => {
    if (!state.workoutHistory?.length) return 0;
    const fourWeeksAgo = Date.now() - 28 * 24 * 60 * 60 * 1000;
    const recent = state.workoutHistory.filter((h) => new Date(h.dateIso).getTime() >= fourWeeksAgo);
    return recent.length / 4;
  }, [state.workoutHistory]);

  const { timer, guide, currentExercise, actions } = useTimer(activeRoutine, handleSessionStop, {
    audioMode: readiness.audioMode,
    intensityKey: intensity,
    intensityMultiplier,
    weightKg: state.userSettings.weightKg,
    sessionsPerWeek,
  });

  const isIdle = timer.phase === 'idle';
  const isUrgent = !isIdle && timer.remainingSec > 0 && timer.remainingSec <= 5;

  const currentSemantics = readiness.summary.semantics;
  const currentFocus = currentExercise?.focus || currentSemantics?.dominantFocus || activeRoutine?.exercises?.[0]?.focus || 'general';

  useEffect(() => {
    if (timer.phase === 'idle') {
      if (previousTimerRef.current?.phase !== 'idle') {
        idleStartedAtRef.current = Date.now();
      }
      return;
    }
    idleStartedAtRef.current = Date.now();
  }, [timer.phase]);

  useEffect(() => {
    const tick = window.setInterval(() => setCoachClock(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  const idleDurationSec = isIdle ? Math.max(0, Math.floor((coachClock - idleStartedAtRef.current) / 1000)) : 0;
  const celebrateCompletion = celebrationUntil > coachClock;

  const warmupCategory = ROUTINE_WARMUP_CATEGORY[selectedRoutine?.id];
  const warmupSuggestion = warmupCategory ? WARMUP_SUGGESTIONS[warmupCategory] : null;
  const showWarmup = adaptiveProfile.showWarmup && isIdle && !warmupDismissed && Boolean(warmupSuggestion);

  const recoveryRoutine = state.routines.find((r) => r.id === 'builtin-knee-recovery');
  const showHighImpact = isIdle
    && !highImpactDismissed
    && HIGH_IMPACT_ROUTINE_IDS.has(selectedRoutine?.id)
    && hasConsecutiveHighImpact();
  const showGuidance = Boolean(selectedRoutine) && isIdle && !guidanceDismissed;

  const phaseTitle = isIdle
    ? selectedRoutine?.exercises?.[0]?.name || 'Select routine'
    : timer.phase === 'rest'
      ? 'Rest'
      : timer.phase === 'circuitRest'
        ? 'Circuit Rest'
        : currentExercise?.name || 'Workout';

  const nextText = getNextText(timer, activeRoutine);

  // Next exercise object for VisualGuide preview during rest
  const nextExerciseForGuide = useMemo(() => {
    if (!activeRoutine || isIdle) return null;
    const exercises = activeRoutine.exercises || [];
    if (timer.phase === 'rest' || timer.phase === 'circuitRest') {
      const nextIdx = timer.phase === 'circuitRest' ? 0 : (timer.exerciseIndex + 1 < exercises.length ? timer.exerciseIndex + 1 : 0);
      return exercises[nextIdx] || null;
    }
    return null;
  }, [activeRoutine, timer.phase, timer.exerciseIndex, isIdle]);

  // Overall workout progress
  const totalExercises = activeRoutine?.exercises?.length || 0;
  const totalCircuits = activeRoutine?.circuits || 1;
  const isInfiniteMode = activeRoutine?.mode === 'infinite';
  // Infinite mode: show progress within the current circuit only; finite: overall progress
  const progressPercent = isIdle || totalExercises === 0 ? 0
    : isInfiniteMode
      ? Math.round((timer.exerciseIndex / totalExercises) * 100)
      : Math.round(((timer.circuitIndex * totalExercises + timer.exerciseIndex) / (totalCircuits * totalExercises)) * 100);

  const circuitLabel = isIdle
    ? '—'
    : isInfiniteMode
      ? String(timer.circuitIndex + 1).padStart(2, '0')
      : `${String(timer.circuitIndex + 1).padStart(2, '0')} / ${String(totalCircuits).padStart(2, '0')}`;

  const sessionFacts = [
    { label: 'Circuit', value: circuitLabel },
    { label: 'Total Time', value: `${Math.floor(timer.elapsedSec / 60)}m ${String(timer.elapsedSec % 60).padStart(2, '0')}s` },
  ];

  useEffect(() => {
    const previous = previousTimerRef.current;
    previousTimerRef.current = timer;

    if (!activeRoutine) return;

    const halfCheckpoint = Math.max(3, Math.ceil(activeRoutine.workSec / 2));

    if (!previous && timer.phase === 'idle') return;

    if (previous?.phase === 'idle' && timer.phase === 'work' && timer.elapsedSec === 0) {
      const patch = { ignoredNudges: 0, lastInteractionAt: Date.now(), lastInteractionType: 'start-workout' };
      setCoachMemory((prevMemory) => ({ ...prevMemory, ...patch }));
      updateCoachCatMemory(patch, coachStyle);
      maybePlayEncouragement('hype', readiness.audioMode);
      return;
    }

    if (previous?.phase !== timer.phase) {
      if (timer.phase === 'rest') {
        maybePlayEncouragement('rest', 'recovery');
        return;
      }
      if (timer.phase === 'circuitRest') {
        maybePlayEncouragement('circuitRest', 'recovery');
        return;
      }
      if (previous?.phase === 'rest' && timer.phase === 'work') {
        maybePlayEncouragement('resume', readiness.audioMode);
        return;
      }
    }

    if (timer.phase === 'work' && previous?.remainingSec > halfCheckpoint && timer.remainingSec <= halfCheckpoint) {
      maybePlayEncouragement('midpoint', readiness.audioMode);
      return;
    }

    if (timer.phase === 'work' && previous?.remainingSec > 3 && timer.remainingSec <= 3 && timer.remainingSec > 0) {
      maybePlayEncouragement('finalPush', 'power');
    }
  }, [activeRoutine, adaptiveProfile.promptFrequency, currentExercise, enableEncouragementAudio, readiness.audioMode, timer]);

  function maybePlayEncouragement(stage, mode) {
    if (!enableEncouragementAudio) return;
    if (!shouldPlayEncouragement(stage, adaptiveProfile.promptFrequency)) return;
    playSessionCue('encourage', mode, currentExercise || activeRoutine?.exercises?.[0] || null);
  }

  const coachCatState = useMemo(
    () => buildCoachCatState({
      timer,
      routine: activeRoutine,
      currentExercise,
      nextText,
      coachStyle,
      coachPromptFrequency: adaptiveProfile.promptFrequency,
      readiness,
      idleDurationSec,
      celebrateCompletion: celebrateCompletion && adaptiveProfile.celebrationMode !== 'muted',
      coachMemory,
      intensityKey: intensity,
      focus: currentFocus,
    }),
    [activeRoutine, adaptiveProfile.celebrationMode, adaptiveProfile.promptFrequency, celebrateCompletion, coachMemory, coachStyle, currentExercise, currentFocus, idleDurationSec, intensity, nextText, readiness, timer],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
      <CoachCat
        visible={enableCoachCat}
        state={coachCatState}
        defaultPersonality={coachStyle}
        onPersonalityChange={(personality) => updateUserSettings({ coachStyle: personality })}
        onMemoryChange={(patch) => {
          setCoachMemory((prev) => ({ ...prev, ...patch }));
          updateCoachCatMemory(patch, coachStyle);
        }}
      />
      <div className="space-y-4">
        {showGuidance && (
          <div className={`rounded-[1.4rem] border px-5 py-4 ${
            readiness.readinessLabel === 'caution'
              ? 'border-[#ff8b2b]/25 bg-[#ff8b2b]/8'
              : readiness.readinessLabel === 'ready'
                ? 'border-[#d4ff6a]/20 bg-[#d4ff6a]/6'
                : 'border-white/10 bg-white/[0.04]'
          }`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-[#8e9889]">Readiness</p>
                <h3 className="mt-2 text-lg font-medium text-[#f2f5ef]">
                  {readiness.readinessLabel === 'caution'
                    ? 'Start conservative today'
                    : readiness.readinessLabel === 'ready'
                      ? 'Feeling good — push as planned'
                      : 'Hold your pace, read the feedback'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGuidanceDismissed(true)}
                className="shrink-0 text-[#8e9889] hover:text-[#f2f5ef] transition"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-[#c7d0c2]">
                Score {readiness.readinessScore}/100
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-[#c7d0c2]">
                Focus {formatFocusLabel(currentSemantics?.dominantFocus)}
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-[#c7d0c2]">
                Joint {formatLevelLabel(currentSemantics?.avgJointLoad)}
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-[#c7d0c2]">
                Impact {formatLevelLabel(currentSemantics?.avgImpactLevel)}
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-[#c7d0c2]">
                Tempo {formatTempoLabel(currentSemantics?.dominantTempo)}
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {readiness.prompts.map((prompt) => (
                <li key={prompt} className="rounded-xl border border-white/6 bg-black/15 px-3 py-2 text-sm text-[#dbe3d6]">
                  {prompt}
                </li>
              ))}
            </ul>
            {readiness.shouldSuggestRecovery && selectedRoutine && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-[#d4ff6a]/15 bg-[#d4ff6a]/6 px-4 py-3">
                <p className="text-sm text-[#d4ff6a]">
                  Low-impact or recovery is recommended today.
                </p>
                {state.routines.find((r) => r.id === 'builtin-knee-recovery') && (
                  <button
                    type="button"
                    onClick={() => setSelectedRoutine('builtin-knee-recovery')}
                    className="rounded-full border border-[#d4ff6a]/25 bg-[#d4ff6a]/10 px-3 py-1.5 text-xs font-medium text-[#d4ff6a] transition hover:bg-[#d4ff6a]/15"
                  >
                    Switch to recovery
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {showHighImpact && (
          <div className="flex items-start justify-between gap-3 rounded-[1.4rem] border border-[#ff8b2b]/30 bg-[#ff8b2b]/8 px-5 py-4">
            <div className="min-w-0">
              <p className="font-medium text-[#ff8b2b]">⚠ High-impact streak</p>
              <p className="mt-1 text-sm text-[#ffc490]">
                3 consecutive high-impact sessions detected. A knee-friendly recovery workout is recommended today.
              </p>
              {recoveryRoutine && (
                <button
                  type="button"
                  onClick={() => { setSelectedRoutine(recoveryRoutine.id); setHighImpactDismissed(true); }}
                  className="mt-2.5 rounded-full border border-[#ff8b2b]/40 bg-[#ff8b2b]/15 px-3 py-1.5 text-xs font-medium text-[#ff8b2b] hover:bg-[#ff8b2b]/25 transition"
                >
                  切换 → {recoveryRoutine.name}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setHighImpactDismissed(true)}
              className="shrink-0 text-[#ff8b2b]/40 hover:text-[#ff8b2b] transition"
            >
              ✕
            </button>
          </div>
        )}

        <Card subtitle="Training" title="Live Session" className="overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
            <div className="w-full max-w-sm">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-[11px] uppercase tracking-[0.32em] text-[#8e9889]">Routine</label>
                {isIdle && lastWorkoutRoutine && lastWorkoutRoutine.id !== selectedRoutine?.id && (
                  <button
                    type="button"
                    onClick={() => setSelectedRoutine(lastWorkoutRoutine.id)}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-[#8e9889] transition hover:text-[#c7d0c2]"
                    title={`Last: ${lastWorkoutRoutine.name}`}
                  >
                    ↩ Last workout
                  </button>
                )}
              </div>
              <select
                value={selectedRoutine?.id || ''}
                onChange={(e) => setSelectedRoutine(e.target.value)}
                disabled={!isIdle}
                className="w-full rounded-full border border-white/10 px-5 py-3.5 outline-none transition focus:border-[#d4ff6a]/40 [color-scheme:dark]"
              >
                {state.routines.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {isIdle && (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.32em] text-[#8e9889]">Intensity</p>
                <div className="flex gap-2">
                  {INTENSITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setIntensity(opt.key)}
                      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                        intensity === opt.key
                          ? opt.activeClass
                          : 'border-white/10 text-[#8e9889] hover:border-white/20 hover:text-[#c3ccbe]'
                      }`}
                    >
                      {opt.label}
                      {intensity === opt.key && activeRoutine && (
                        <span className="ml-1.5 text-[10px] opacity-60">{activeRoutine.workSec}s</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(38,46,41,0.72),rgba(25,31,28,0.72))] px-5 py-6 sm:px-7 sm:py-7">
            {/* Progress bar — exercise N / M across all circuits */}
            {!isIdle && totalExercises > 0 && (
              <div className="mb-5">
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-[#8e9889]">
                  <span>
                    Exercise <span className="font-semibold text-[#c7d0c2]">{timer.exerciseIndex + 1}</span> / {totalExercises}
                    {totalCircuits > 1 && (
                      <span className="ml-2">· Circuit <span className="font-semibold text-[#c7d0c2]">{timer.circuitIndex + 1}</span> / {totalCircuits}</span>
                    )}
                  </span>
                  <span className="font-semibold text-[#c7d0c2]">{progressPercent}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-[#d4ff6a] transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0">
                <PhaseBadge phase={timer.phase} />
                <h3 className="mt-4 text-xl font-medium leading-snug tracking-[-0.03em] text-[#e6ebe0] sm:text-2xl">
                  {phaseTitle}
                </h3>
                <p className="mt-3 text-xs uppercase tracking-[0.24em] text-[#8e9889]">Next: {nextText}</p>
              </div>
              <div className="justify-self-start rounded-full border border-white/10 px-4 py-2 text-sm text-[#c7d0c2] lg:justify-self-end">
                {activeRoutine?.mode || 'routine'}
              </div>
            </div>

            <div className="mt-6 flex justify-center border-t border-white/10 pt-6">
              <TimerDisplay seconds={timer.remainingSec} urgent={isUrgent} />
            </div>

            <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
              {sessionFacts.map((fact) => (
                <div key={fact.label} className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#889183]">{fact.label}</p>
                  <p className="mt-1.5 text-xl font-semibold tracking-[-0.03em] text-[#f2f5ef]">{fact.value}</p>
                </div>
              ))}
            </div>
          </div>

          <TimerControls
            onStart={actions.start}
            onPause={actions.pause}
            onSkip={actions.skip}
            onStop={actions.stop}
            pauseLabel={timer.isPaused ? 'Resume' : 'Pause'}
          />
        </Card>

        {showWarmup && (
          <div className="rounded-[1.4rem] border border-[#d4ff6a]/20 bg-[#d4ff6a]/5 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[#d4ff6a]">
                Warm-up — {warmupSuggestion.title}
              </p>
              <button
                type="button"
                onClick={() => {
                  setWarmupDismissed(true);
                  const patch = { warmupDismissCount: (coachMemory?.warmupDismissCount || 0) + 1, lastInteractionAt: Date.now(), lastInteractionType: 'dismiss-warmup' };
                  setCoachMemory((prev) => ({ ...prev, ...patch }));
                  updateCoachCatMemory(patch, coachStyle);
                }}
                className="shrink-0 text-[#d4ff6a]/40 hover:text-[#d4ff6a]/70 transition"
              >
                ✕
              </button>
            </div>
            <ul className="mt-3 space-y-1.5">
              {warmupSuggestion.items.map((item) => (
                <li key={item} className="text-sm text-[#b8cc6a]">• {item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Card subtitle="Guide" title="Visual Guide">
          <VisualGuide guide={guide} phase={timer.phase} nextExercise={nextExerciseForGuide} />
        </Card>
        <Card subtitle="Routine" title={activeRoutine?.name || '--'}>
          <div className="space-y-3 text-sm text-[#c3ccbe]">
            <div className="flex justify-between gap-4 border-b border-white/6 pb-3">
              <span>Mode</span>
              <span className="font-medium text-[#f2f5ef]">{activeRoutine?.mode || '--'}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/6 pb-3">
              <span>Work / Rest</span>
              <span className="font-medium text-[#f2f5ef]">{activeRoutine?.workSec}s / {activeRoutine?.restSec}s</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/6 pb-3">
              <span>Focus</span>
              <span className="font-medium text-[#f2f5ef]">{formatFocusLabel(currentSemantics?.dominantFocus)}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/6 pb-3">
              <span>Impact / Load</span>
              <span className="font-medium text-[#f2f5ef]">{formatLevelLabel(currentSemantics?.avgImpactLevel)} / {formatLevelLabel(currentSemantics?.avgJointLoad)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Exercises</span>
              <span className="font-medium text-[#f2f5ef]">{activeRoutine?.exercises.length || 0}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function shouldPlayEncouragement(stage, frequency) {
  if (frequency === 'active') return true;
  if (frequency === 'light') return ['start', 'finalPush', 'rest'].includes(stage);
  if (frequency === 'minimal') return ['finalPush'].includes(stage);
  return ['start', 'rest', 'midpoint', 'finalPush', 'resume'].includes(stage);
}

function buildAdaptiveCoachProfile({ coachStyle, coachPromptFrequency, warmupPreference, coachMemory }) {
  const ignoredNudges = Number(coachMemory?.ignoredNudges || 0);
  const warmupDismissCount = Number(coachMemory?.warmupDismissCount || 0);

  let promptFrequency = coachPromptFrequency;
  let showWarmup = warmupPreference === 'full';
  let celebrationMode = 'normal';

  if (coachStyle === 'cold') {
    if (promptFrequency === 'active') promptFrequency = 'balanced';
    if (promptFrequency === 'balanced') promptFrequency = 'light';
    celebrationMode = 'muted';
  }

  if (ignoredNudges >= 2) {
    promptFrequency = promptFrequency === 'active' ? 'balanced' : promptFrequency === 'balanced' ? 'light' : 'minimal';
  }

  if (warmupPreference === 'minimal' || warmupDismissCount >= 2) {
    showWarmup = false;
  }

  return {
    promptFrequency,
    showWarmup,
    celebrationMode,
  };
}

function formatFocusLabel(focus) {
  if (focus === 'legs') return '腿臀';
  if (focus === 'core') return '核心';
  if (focus === 'cardio') return '心肺';
  if (focus === 'upper') return '上肢';
  if (focus === 'recovery') return '恢复';
  return '全身';
}

function formatLevelLabel(level) {
  if (level === 'high') return '高';
  if (level === 'low') return '低';
  return '中';
}

function formatTempoLabel(tempo) {
  if (tempo === 'slow') return '慢';
  if (tempo === 'controlled') return '控制';
  if (tempo === 'rhythmic') return '节奏型';
  return '稳定';
}
