import { useMemo, useState } from 'react';
import Card from '../components/shared/Card';
import PhaseBadge from '../components/timer/PhaseBadge';
import TimerDisplay from '../components/timer/TimerDisplay';
import TimerControls from '../components/timer/TimerControls';
import VisualGuide from '../components/timer/VisualGuide';
import { useAppContext } from '../context/AppContext';
import { useTimer } from '../hooks/useTimer';
import { HIGH_IMPACT_ROUTINE_IDS, ROUTINE_WARMUP_CATEGORY, WARMUP_SUGGESTIONS } from '../utils/constants';

const INTENSITY_OPTIONS = [
  { key: 'easy', label: '轻松', mult: 0.75, activeClass: 'border-[#4ade80]/50 bg-[#4ade80]/8 text-[#4ade80]' },
  { key: 'normal', label: '正常', mult: 1, activeClass: 'border-[#d4ff6a]/50 bg-[#d4ff6a]/8 text-[#d4ff6a]' },
  { key: 'sprint', label: '冲刺', mult: 1.25, activeClass: 'border-[#ff8b2b]/50 bg-[#ff8b2b]/8 text-[#ff8b2b]' },
];

export default function WorkoutPage({ onSessionStop }) {
  const { state, selectedRoutine, setSelectedRoutine, hasConsecutiveHighImpact } = useAppContext();
  const [intensity, setIntensity] = useState('normal');
  const [warmupDismissed, setWarmupDismissed] = useState(false);
  const [highImpactDismissed, setHighImpactDismissed] = useState(false);

  // Apply intensity multiplier to workSec
  const activeRoutine = useMemo(() => {
    if (!selectedRoutine) return null;
    const mult = INTENSITY_OPTIONS.find((o) => o.key === intensity)?.mult ?? 1;
    return { ...selectedRoutine, workSec: Math.round(selectedRoutine.workSec * mult) };
  }, [selectedRoutine, intensity]);

  const { timer, guide, currentExercise, actions } = useTimer(activeRoutine, onSessionStop);

  const isIdle = timer.phase === 'idle';
  const isUrgent = !isIdle && timer.remainingSec > 0 && timer.remainingSec <= 5;

  // Warmup card
  const warmupCategory = ROUTINE_WARMUP_CATEGORY[selectedRoutine?.id];
  const warmupSuggestion = warmupCategory ? WARMUP_SUGGESTIONS[warmupCategory] : null;
  const showWarmup = isIdle && !warmupDismissed && Boolean(warmupSuggestion);

  // High-impact consecutive warning
  const recoveryRoutine = state.routines.find((r) => r.id === 'builtin-knee-recovery');
  const showHighImpact = isIdle
    && !highImpactDismissed
    && HIGH_IMPACT_ROUTINE_IDS.has(selectedRoutine?.id)
    && hasConsecutiveHighImpact();

  const phaseTitle = isIdle
    ? selectedRoutine?.exercises?.[0]?.name || 'Select routine'
    : timer.phase === 'rest'
      ? 'Rest'
      : timer.phase === 'circuitRest'
        ? 'Circuit Rest'
        : currentExercise?.name || 'Workout';

  const nextText = timer.phase === 'work' && activeRoutine
    ? (activeRoutine.exercises[timer.exerciseIndex + 1]?.name || (activeRoutine.mode === 'infinite' ? activeRoutine.exercises[0]?.name : 'Finish'))
    : timer.phase === 'rest'
      ? (activeRoutine?.exercises[timer.exerciseIndex + 1]?.name || activeRoutine?.exercises[0]?.name || '--')
      : activeRoutine?.exercises?.[0]?.name || '--';

  const sessionFacts = [
    { label: 'Circuit', value: isIdle ? '00' : String(timer.circuitIndex + 1).padStart(2, '0') },
    { label: 'Total Time', value: `${Math.floor(timer.elapsedSec / 60)}m ${String(timer.elapsedSec % 60).padStart(2, '0')}s` },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
      <div className="space-y-4">
        {/* ── Feature 10: Consecutive high-impact warning ── */}
        {showHighImpact && (
          <div className="flex items-start justify-between gap-3 rounded-[1.4rem] border border-[#ff8b2b]/30 bg-[#ff8b2b]/8 px-5 py-4">
            <div className="min-w-0">
              <p className="font-medium text-[#ff8b2b]">⚠ 连续高强度提醒</p>
              <p className="mt-1 text-sm text-[#ffc490]">
                你已连续 3 次高冲击训练，今天建议改做膝盖友好恢复，避免积累性损伤。
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
            {/* Routine picker */}
            <div className="w-full max-w-sm">
              <label className="mb-2 block text-[11px] uppercase tracking-[0.32em] text-[#8e9889]">Routine</label>
              <select
                value={selectedRoutine?.id || ''}
                onChange={(e) => setSelectedRoutine(e.target.value)}
                className="w-full rounded-full border border-white/10 bg-[#222925] px-5 py-3.5 text-[#f2f5ef] outline-none transition focus:border-[#d4ff6a]/40"
              >
                {state.routines.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* ── Feature 5: Intensity selector (only when idle) ── */}
            {isIdle && (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.32em] text-[#8e9889]">训练强度</p>
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

            {/* ── Feature 3: Urgency color on countdown ── */}
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

        {/* ── Feature 4: Warmup suggestions ── */}
        {showWarmup && (
          <div className="rounded-[1.4rem] border border-[#d4ff6a]/20 bg-[#d4ff6a]/5 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[#d4ff6a]">
                开始前热身 — {warmupSuggestion.title}
              </p>
              <button
                type="button"
                onClick={() => setWarmupDismissed(true)}
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
        {/* ── Features 1 & 2: Breathing cue + mistake warning in VisualGuide ── */}
        <Card subtitle="Guide" title="Visual Guide">
          <VisualGuide guide={guide} phase={timer.phase} />
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
