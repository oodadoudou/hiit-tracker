import { useMemo } from 'react';
import Card from '../components/shared/Card';
import HistoryTable from '../components/history/HistoryTable';
import { useAppContext } from '../context/AppContext';

// ── Feature 9: Routine usage frequency ──────────────────────────────────────
function RoutineFrequency({ workoutHistory }) {
  const ranked = useMemo(() => {
    const counts = {};
    workoutHistory.forEach(({ routineId, routineName }) => {
      const key = routineId || routineName;
      if (!counts[key]) counts[key] = { name: routineName, count: 0 };
      counts[key].count += 1;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [workoutHistory]);

  if (!ranked.length) return null;

  const maxCount = ranked[0].count;

  return (
    <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-[#222925] p-4">
      <p className="mb-4 text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">训练计划使用频率</p>
      <div className="space-y-3">
        {ranked.map(({ name, count }, i) => {
          const pct = Math.round((count / maxCount) * 100);
          const isTop = i === 0;
          return (
            <div key={name}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className={`truncate ${isTop ? 'font-medium text-[#f2f5ef]' : 'text-[#c3ccbe]'}`}>
                  {isTop && <span className="mr-1.5 text-[#d4ff6a]">★</span>}
                  {name}
                </span>
                <span className="shrink-0 text-xs text-[#8d9688]">{count} 次</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                <div
                  className={`h-full rounded-full transition-all ${isTop ? 'bg-[#d4ff6a]' : 'bg-[#4a7a55]'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {ranked.length >= 3 && ranked[0].count === ranked[1]?.count && (
        <p className="mt-3 text-xs text-[#8d9688]">训练很均衡！尝试变换一下节奏。</p>
      )}
      {ranked.length >= 2 && ranked[0].count > (ranked[1]?.count ?? 0) * 2 && (
        <p className="mt-3 text-xs text-[#8d9688]">
          你偏爱「{ranked[0].name}」— 可以穿插其他训练防止平台期。
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const { state, clearHistory } = useAppContext();
  const items = useMemo(
    () => [...state.workoutHistory].sort((a, b) => new Date(b.dateIso) - new Date(a.dateIso)),
    [state.workoutHistory],
  );

  return (
    <Card subtitle="History" title="Workout Log">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={clearHistory}
          className="rounded-full bg-[#ff8b2b] px-4 py-3 font-semibold text-black"
        >
          Clear History
        </button>
      </div>
      <HistoryTable items={items} />
      {/* ── Feature 9 ── */}
      <RoutineFrequency workoutHistory={state.workoutHistory} />
    </Card>
  );
}
