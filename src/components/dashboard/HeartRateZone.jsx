import { computeFatLossZone } from '../../utils/workout';

export default function HeartRateZone({ age }) {
  const zone = computeFatLossZone(age);
  return (
    <div className="rounded-2xl border border-white/10 bg-panel2 p-4">
      <p className="text-sm font-semibold">Heart Rate Zone</p>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-xl bg-black/20 p-3"><p className="text-xs uppercase tracking-[0.2em] text-muted">Age</p><p className="mt-1 font-bold">{age}</p></div>
        <div className="rounded-xl bg-black/20 p-3"><p className="text-xs uppercase tracking-[0.2em] text-muted">Max HR</p><p className="mt-1 font-bold">{zone.max}</p></div>
        <div className="rounded-xl bg-black/20 p-3"><p className="text-xs uppercase tracking-[0.2em] text-muted">Fat-Loss</p><p className="mt-1 font-bold">{zone.low}-{zone.high}</p></div>
      </div>
      <p className="mt-3 text-sm text-slate-300">Reference zone is 60%-70% of max heart rate.</p>
    </div>
  );
}
