import { Flame } from 'lucide-react';

export default function StreakBadge({ active }) {
  return (
    <div className={active ? 'rounded-2xl border border-accent/30 bg-accent/10 p-4 text-accent' : 'rounded-2xl border border-white/10 bg-panel2 p-4 text-slate-300'}>
      <div className="flex items-center gap-3">
        <Flame className={active ? 'text-amberx' : 'text-muted'} />
        <div>
          <p className="font-bold">3-Day Streak</p>
          <p className="text-sm">{active ? 'Workout + calorie deficit achieved for 3 consecutive days.' : 'Keep logging workouts and deficits to light this up.'}</p>
        </div>
      </div>
    </div>
  );
}
