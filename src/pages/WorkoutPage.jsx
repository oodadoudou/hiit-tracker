import Card from '../components/shared/Card';
import PhaseBadge from '../components/timer/PhaseBadge';
import TimerDisplay from '../components/timer/TimerDisplay';
import TimerControls from '../components/timer/TimerControls';
import VisualGuide from '../components/timer/VisualGuide';
import { useAppContext } from '../context/AppContext';
import { useTimer } from '../hooks/useTimer';

export default function WorkoutPage({ onSessionStop }) {
  const { state, selectedRoutine, setSelectedRoutine } = useAppContext();
  const { timer, guide, currentExercise, actions } = useTimer(selectedRoutine, onSessionStop);

  const phaseTitle = timer.phase === 'idle'
    ? selectedRoutine?.exercises?.[0]?.name || 'Select routine'
    : timer.phase === 'rest'
      ? 'Rest'
      : timer.phase === 'circuitRest'
        ? 'Circuit Rest'
        : currentExercise?.name || 'Workout';

  const nextText = timer.phase === 'work' && selectedRoutine
    ? (selectedRoutine.exercises[timer.exerciseIndex + 1]?.name || (selectedRoutine.mode === 'infinite' ? selectedRoutine.exercises[0]?.name : 'Finish'))
    : timer.phase === 'rest'
      ? (selectedRoutine?.exercises[timer.exerciseIndex + 1]?.name || selectedRoutine?.exercises[0]?.name || '--')
      : selectedRoutine?.exercises?.[0]?.name || '--';

  const sessionFacts = [
    { label: 'Circuit', value: timer.phase === 'idle' ? '00' : String(timer.circuitIndex + 1).padStart(2, '0') },
    { label: 'Total Time', value: `${Math.floor(timer.elapsedSec / 60)}m ${String(timer.elapsedSec % 60).padStart(2, '0')}s` },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.22fr_0.78fr]">
      <Card subtitle="Training" title="Live Session" className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div className="w-full max-w-sm">
            <label className="mb-2 block text-[11px] uppercase tracking-[0.32em] text-[#8e9889]">Routine</label>
            <select value={selectedRoutine?.id || ''} onChange={(event) => setSelectedRoutine(event.target.value)} className="w-full rounded-full border border-white/10 bg-[#222925] px-5 py-3.5 text-[#f2f5ef] outline-none transition focus:border-[#d4ff6a]/40">
              {state.routines.map((routine) => <option key={routine.id} value={routine.id}>{routine.name}</option>)}
            </select>
          </div>
          <p className="max-w-xs text-sm leading-6 text-[#9ca599]">
            当前只保留训练需要的信息密度，弱化仪表盘式装饰。
          </p>
        </div>
        <div className="mt-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(38,46,41,0.72),rgba(25,31,28,0.72))] px-5 py-6 sm:px-7 sm:py-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="min-w-0">
              <PhaseBadge phase={timer.phase} />
              <h3 className="mt-4 text-xl font-medium leading-snug tracking-[-0.03em] text-[#e6ebe0] sm:text-2xl">{phaseTitle}</h3>
              <p className="mt-3 text-xs uppercase tracking-[0.24em] text-[#8e9889]">Next: {nextText}</p>
            </div>
            <div className="justify-self-start rounded-full border border-white/10 px-4 py-2 text-sm text-[#c7d0c2] lg:justify-self-end">
              {selectedRoutine?.mode || 'routine'}
            </div>
          </div>
          <div className="mt-6 flex justify-center border-t border-white/10 pt-6">
            <TimerDisplay seconds={timer.remainingSec} />
          </div>
          <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
            {sessionFacts.map((fact) => (
              <div key={fact.label} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#889183]">{fact.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#f2f5ef]">{fact.value}</p>
              </div>
            ))}
          </div>
        </div>
        <TimerControls onStart={actions.start} onPause={actions.pause} onSkip={actions.skip} onStop={actions.stop} pauseLabel={timer.isPaused ? 'Resume' : 'Pause'} />
      </Card>
      <div className="space-y-4">
        <Card subtitle="Guide" title="Visual Guide">
          <VisualGuide guide={guide} />
        </Card>
        <Card subtitle="Routine" title={selectedRoutine?.name || '--'}>
          <div className="space-y-3 text-sm text-[#c3ccbe]">
            <div className="flex justify-between gap-4 border-b border-white/6 pb-3"><span>Mode</span><span className="font-medium text-[#f2f5ef]">{selectedRoutine?.mode || '--'}</span></div>
            <div className="flex justify-between gap-4 border-b border-white/6 pb-3"><span>Work / Rest</span><span className="font-medium text-[#f2f5ef]">{selectedRoutine?.workSec}s / {selectedRoutine?.restSec}s</span></div>
            <div className="flex justify-between gap-4"><span>Exercises</span><span className="font-medium text-[#f2f5ef]">{selectedRoutine?.exercises.length || 0}</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
