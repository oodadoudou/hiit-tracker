import { computeDailyDeficit } from '../../utils/workout';

export default function CaloricDeficitCard({ intake, metabolicBurn, exerciseBurn, calorieGoal, dateLabel }) {
  const deficit = computeDailyDeficit({ intake, metabolicBurn, exerciseBurn });
  const intakeProgress = Math.max(0, Math.min(100, Math.round((Math.max(intake, 0) / Math.max(calorieGoal, 1)) * 100)));
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-[#222925] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#f2f5ef]">Daily Deficit</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[#8d9688]">{dateLabel}</p>
        </div>
        <p className={deficit < 0 ? 'text-sm font-semibold text-[#d4ff6a]' : 'text-sm font-semibold text-[#ff8b2b]'}>{deficit} kcal</p>
      </div>
      <p className="mt-3 text-sm text-[#b6beb1]">Formula: Intake - Estimated Daily Metabolism - Exercise Burn</p>
      <p className="mt-1 text-xs text-[#8d9688]">Progress bar: daily intake versus calorie goal.</p>
      <div className="mt-3 h-4 overflow-hidden rounded-full bg-black/40">
        <div className="h-full rounded-full bg-gradient-to-r from-amberx to-accent" style={{ width: `${intakeProgress}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-xl bg-black/20 p-3"><p className="text-xs uppercase tracking-[0.2em] text-muted">Intake</p><p className="mt-1 font-semibold text-[#f2f5ef]">{intake}</p></div>
        <div className="rounded-xl bg-black/20 p-3"><p className="text-xs uppercase tracking-[0.2em] text-muted">Metabolism</p><p className="mt-1 font-semibold text-[#f2f5ef]">{metabolicBurn}</p></div>
        <div className="rounded-xl bg-black/20 p-3"><p className="text-xs uppercase tracking-[0.2em] text-muted">Exercise</p><p className="mt-1 font-semibold text-[#f2f5ef]">{exerciseBurn}</p></div>
      </div>
    </div>
  );
}
