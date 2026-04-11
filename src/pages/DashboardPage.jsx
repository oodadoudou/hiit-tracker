import { useMemo, useState } from 'react';
import Card from '../components/shared/Card';
import CaloricDeficitCard from '../components/dashboard/CaloricDeficitCard';
import HydrationWidget from '../components/dashboard/HydrationWidget';
import StreakBadge from '../components/dashboard/StreakBadge';
import { useAppContext } from '../context/AppContext';
import { dateKey, formatDateShort, getPreviousDateKey } from '../utils/date';

// ── Feature 8: Weekly Training Heatmap ──────────────────────────────────────
function WeeklyHeatmap({ workoutHistory, dailyMetrics }) {
  const days = useMemo(() => {
    const today = dateKey();
    const result = [];
    let key = today;
    for (let i = 0; i < 7; i += 1) {
      result.unshift(key);
      key = getPreviousDateKey(key);
    }
    return result;
  }, []);

  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-[#222925] p-4">
      <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">最近 7 天</p>
      <div className="flex gap-2">
        {days.map((day) => {
          const hasWorkout = workoutHistory.some((h) => dateKey(new Date(h.dateIso)) === day);
          const metrics = dailyMetrics[day];
          const hasDeficit = metrics && metrics.deficit < 0;
          const isToday = day === dateKey();

          let bg = 'bg-white/5';
          let label = '无记录';
          if (hasWorkout && hasDeficit) { bg = 'bg-[#d4ff6a]'; label = '训练+赤字'; }
          else if (hasWorkout) { bg = 'bg-[#4a7a55]'; label = '已训练'; }
          else if (hasDeficit) { bg = 'bg-[#6a7a3a]'; label = '赤字达标'; }

          const [, month, dayNum] = day.split('-');
          return (
            <div key={day} className="flex flex-1 flex-col items-center gap-1.5" title={`${day} — ${label}`}>
              <div
                className={`h-10 w-full rounded-xl transition-all ${bg} ${isToday ? 'ring-2 ring-white/20' : ''}`}
              />
              <span className="text-[10px] text-[#8d9688]">
                {Number(month)}/{Number(dayNum)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-[#8d9688]">
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#d4ff6a]" /> 训练+赤字</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#4a7a55]" /> 已训练</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#6a7a3a]" /> 赤字达标</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-white/5 border border-white/10" /> 无记录</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { todayKey, selectedDate, dailyMetrics, userSettings, estimatedMetabolism, updateDailyMetrics, createDailyMetrics, deleteDailyMetrics, updateUserSettings, hasThreeDayStreak, state } = useDashboardContext();
  const streak = hasThreeDayStreak();
  const [activeDate, setActiveDate] = useState(todayKey);
  const metrics = selectedDate(activeDate);
  const hasActiveRecord = Boolean(dailyMetrics[activeDate]);
  const calorieHistory = useMemo(
    () => Object.entries(dailyMetrics)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, record]) => ({ date, ...record })),
    [dailyMetrics],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Card subtitle="Calories" title="Daily Log">
        <div className="mb-4 rounded-[1.4rem] border border-white/10 bg-[#222925] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Profile</p>
              <p className="mt-1 text-lg font-medium text-[#f2f5ef]">Metabolism Setup</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Estimated Burn</p>
              <p className="mt-1 text-lg font-semibold text-[#d4ff6a]">{estimatedMetabolism} kcal</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Sex</label>
              <select value={userSettings.sex || 'female'} onChange={(e) => updateUserSettings({ sex: e.target.value })} className="w-full rounded-[1.2rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-3 outline-none">
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Age</label>
              <input type="number" min="18" value={userSettings.age} onChange={(e) => updateUserSettings({ age: Number(e.target.value) || 18 })} className="w-full rounded-[1.2rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-3 outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Height</label>
              <input type="number" min="120" value={userSettings.heightCm} onChange={(e) => updateUserSettings({ heightCm: Number(e.target.value) || 120 })} className="w-full rounded-[1.2rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-3 outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Weight</label>
              <input type="number" min="30" step="0.1" value={userSettings.weightKg} onChange={(e) => updateUserSettings({ weightKg: Number(e.target.value) || 30 })} className="w-full rounded-[1.2rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-3 outline-none" />
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Date</label>
            <input type="date" value={activeDate} onChange={(e) => setActiveDate(e.target.value)} className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Intake</label>
            <input type="number" min="0" value={metrics.intake} onChange={(e) => updateDailyMetrics(activeDate, { intake: Number(e.target.value) || 0 })} className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Exercise Burn</label>
            <input type="number" min="0" value={metrics.exerciseBurn} onChange={(e) => updateDailyMetrics(activeDate, { exerciseBurn: Number(e.target.value) || 0 })} className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Goal</label>
            <input type="number" min="0" value={userSettings.calorieGoal} readOnly className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none text-[#aeb7a8]" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Note</label>
            <input type="text" value={metrics.note || ''} onChange={(e) => updateDailyMetrics(activeDate, { note: e.target.value })} className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none" placeholder="Optional note for this day" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => createDailyMetrics(activeDate)} className="rounded-full bg-[#d4ff6a] px-4 py-3 font-semibold text-black">
            {hasActiveRecord ? 'Update Record' : 'Add Record'}
          </button>
          <button type="button" onClick={() => deleteDailyMetrics(activeDate)} disabled={!hasActiveRecord} className={hasActiveRecord ? 'rounded-full bg-[#ff8b2b] px-4 py-3 font-semibold text-black' : 'rounded-full bg-[#3a403c] px-4 py-3 font-semibold text-[#8d9688]'}>
            Delete Record
          </button>
        </div>
        <div className="mt-4">
          <CaloricDeficitCard
            intake={metrics.intake}
            metabolicBurn={metrics.metabolicBurn || estimatedMetabolism}
            exerciseBurn={metrics.exerciseBurn}
            calorieGoal={userSettings.calorieGoal}
            dateLabel={activeDate}
          />
        </div>
        <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-[#222925] text-left text-sm text-[#d5dbcf]">
              <thead className="bg-black/10 text-xs uppercase tracking-[0.24em] text-[#8d9688]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Intake</th>
                  <th className="px-4 py-3">Exercise</th>
                  <th className="px-4 py-3">Total Burn</th>
                  <th className="px-4 py-3">Metabolism</th>
                  <th className="px-4 py-3">Deficit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {calorieHistory.length ? calorieHistory.map((item) => (
                  <tr key={item.date} className="border-t border-white/6">
                    <td className="px-4 py-3 font-medium text-[#f2f5ef]">{item.date}</td>
                    <td className="px-4 py-3">{item.intakeRangeText || item.intake}</td>
                    <td className="px-4 py-3">{item.exerciseBurn}</td>
                    <td className="px-4 py-3">{item.totalBurnRangeText || item.totalBurn}</td>
                    <td className="px-4 py-3">{item.metabolicBurn}</td>
                    <td className={item.deficit < 0 ? 'px-4 py-3 text-[#d4ff6a]' : 'px-4 py-3 text-[#ff8b2b]'}>{item.deficitRangeText || item.deficit}</td>
                    <td className="px-4 py-3">{item.status || '--'}</td>
                    <td className="px-4 py-3">{item.note || '--'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="px-4 py-6 text-center text-[#8d9688]">No calorie history yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
      <div className="space-y-4">
        {/* ── Feature 8: Weekly Heatmap ── */}
        <WeeklyHeatmap
          workoutHistory={state.workoutHistory}
          dailyMetrics={dailyMetrics}
        />
        <Card subtitle="Hydration" title="Water">
          <HydrationWidget waterMl={metrics.waterMl} onAdd={() => updateDailyMetrics(activeDate, { waterMl: metrics.waterMl + 250 })} onReset={() => updateDailyMetrics(activeDate, { waterMl: 0 })} />
        </Card>
        <StreakBadge active={streak} />
      </div>
    </div>
  );
}

function useDashboardContext() {
  const context = useAppContext();
  return {
    state: context.state,
    todayKey: context.todayKey,
    dailyMetrics: context.state.dailyMetrics,
    userSettings: context.state.userSettings,
    estimatedMetabolism: context.estimatedMetabolism,
    updateDailyMetrics: context.updateDailyMetrics,
    createDailyMetrics: context.createDailyMetrics,
    deleteDailyMetrics: context.deleteDailyMetrics,
    updateUserSettings: context.updateUserSettings,
    selectedDate: context.getDailyMetrics,
    hasThreeDayStreak: context.hasThreeDayStreak,
  };
}
