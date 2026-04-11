import { useMemo, useState } from 'react';
import Card from '../components/shared/Card';
import CaloricDeficitCard from '../components/dashboard/CaloricDeficitCard';
import HydrationWidget from '../components/dashboard/HydrationWidget';
import HeartRateZone from '../components/dashboard/HeartRateZone';
import StreakBadge from '../components/dashboard/StreakBadge';
import { useAppContext } from '../context/AppContext';

export default function DashboardPage() {
  const { todayKey, selectedDate, dailyMetrics, userSettings, estimatedMetabolism, updateDailyMetrics, hasThreeDayStreak } = useDashboardContext();
  const streak = hasThreeDayStreak();
  const [activeDate, setActiveDate] = useState(todayKey);
  const metrics = selectedDate(activeDate);
  const calorieHistory = useMemo(
    () => Object.entries(dailyMetrics)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, record]) => ({ date, ...record })),
    [dailyMetrics],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Card subtitle="Calories" title="Daily Log">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Date</label>
            <input type="date" value={activeDate} onChange={(event) => setActiveDate(event.target.value)} className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Intake</label>
            <input type="number" min="0" value={metrics.intake} onChange={(event) => updateDailyMetrics(activeDate, { intake: Number(event.target.value) || 0 })} className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Exercise Burn</label>
            <input type="number" min="0" value={metrics.exerciseBurn} onChange={(event) => updateDailyMetrics(activeDate, { exerciseBurn: Number(event.target.value) || 0 })} className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Goal</label>
            <input type="number" min="0" value={userSettings.calorieGoal} readOnly className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none text-[#aeb7a8]" />
          </div>
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
        <Card subtitle="Hydration" title="Water"><HydrationWidget waterMl={metrics.waterMl} onAdd={() => updateDailyMetrics(activeDate, { waterMl: metrics.waterMl + 250 })} onReset={() => updateDailyMetrics(activeDate, { waterMl: 0 })} /></Card>
        <Card subtitle="Heart Rate" title="Fat-Loss Zone"><HeartRateZone age={userSettings.age} /></Card>
        <StreakBadge active={streak} />
      </div>
    </div>
  );
}

function useDashboardContext() {
  const context = useAppContext();
  return {
    todayKey: context.todayKey,
    dailyMetrics: context.state.dailyMetrics,
    userSettings: context.state.userSettings,
    estimatedMetabolism: context.estimatedMetabolism,
    updateDailyMetrics: context.updateDailyMetrics,
    selectedDate: context.getDailyMetrics,
    hasThreeDayStreak: context.hasThreeDayStreak,
  };
}
