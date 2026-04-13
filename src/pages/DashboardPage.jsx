import { useEffect, useMemo, useRef, useState } from 'react';
import Card from '../components/shared/Card';
import CaloricDeficitCard from '../components/dashboard/CaloricDeficitCard';
import HydrationWidget from '../components/dashboard/HydrationWidget';
import { TrainingReadinessCard, TrainingTrendCard } from '../components/dashboard/TrainingInsights';
import StreakBadge from '../components/dashboard/StreakBadge';
import { useAppContext } from '../context/AppContext';
import { dateKey, getPreviousDateKey } from '../utils/date';

// ── Feature 8: Weekly Training Heatmap ──────────────────────────────────────
function WeeklyHeatmap({ workoutHistory, dailyMetrics, todayKey }) {
  const days = useMemo(() => {
    const result = [];
    let key = todayKey;
    for (let i = 0; i < 7; i += 1) {
      result.unshift(key);
      key = getPreviousDateKey(key);
    }
    return result;
  }, [todayKey]);

  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-[#222925] p-4">
      <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Last 7 Days</p>
      <div className="flex gap-2">
        {days.map((day) => {
          const hasWorkout = workoutHistory.some((h) => dateKey(new Date(h.dateIso)) === day);
          const metrics = dailyMetrics[day];
          const hasDeficit = metrics && metrics.deficit < 0;
          const isToday = day === todayKey;

          let bg = 'bg-white/5';
          let label = 'No record';
          if (hasWorkout && hasDeficit) { bg = 'bg-[#d4ff6a]'; label = 'Workout + deficit'; }
          else if (hasWorkout) { bg = 'bg-[#4a7a55]'; label = 'Trained'; }
          else if (hasDeficit) { bg = 'bg-[#6a7a3a]'; label = 'Deficit met'; }

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
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#d4ff6a]" /> Workout + deficit</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#4a7a55]" /> Trained</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#6a7a3a]" /> Deficit met</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-white/5 border border-white/10" /> No record</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { todayKey, selectedDate, dailyMetrics, userSettings, estimatedMetabolism, updateDailyMetrics, createDailyMetrics, deleteDailyMetrics, updateUserSettings, hasThreeDayStreak, state } = useDashboardContext();
  const streak = hasThreeDayStreak();
  const [activeDate, setActiveDate] = useState(todayKey);
  const previousTodayKeyRef = useRef(todayKey);
  const metrics = selectedDate(activeDate);
  const hasActiveRecord = Boolean(dailyMetrics[activeDate]);
  const [profileDraft, setProfileDraft] = useState(() => ({
    age: String(userSettings.age ?? ''),
    heightCm: String(userSettings.heightCm ?? ''),
    weightKg: String(userSettings.weightKg ?? ''),
    calorieGoal: String(userSettings.calorieGoal ?? ''),
  }));
  const [dailyDraft, setDailyDraft] = useState(() => ({
    intake: toDraftValue(metrics.intake, hasActiveRecord),
    exerciseBurn: toDraftValue(metrics.exerciseBurn, hasActiveRecord),
    note: metrics.note || '',
  }));
  const calorieHistory = useMemo(
    () => Object.entries(dailyMetrics)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, record]) => ({ date, ...record })),
    [dailyMetrics],
  );

  useEffect(() => {
    setProfileDraft({
      age: String(userSettings.age ?? ''),
      heightCm: String(userSettings.heightCm ?? ''),
      weightKg: String(userSettings.weightKg ?? ''),
      calorieGoal: String(userSettings.calorieGoal ?? ''),
    });
  }, [userSettings.age, userSettings.calorieGoal, userSettings.heightCm, userSettings.weightKg]);

  useEffect(() => {
    setDailyDraft({
      intake: toDraftValue(metrics.intake, hasActiveRecord),
      exerciseBurn: toDraftValue(metrics.exerciseBurn, hasActiveRecord),
      note: metrics.note || '',
    });
  }, [activeDate, hasActiveRecord, metrics.exerciseBurn, metrics.intake, metrics.note]);

  useEffect(() => {
    setActiveDate((current) => (current === previousTodayKeyRef.current ? todayKey : current));
    previousTodayKeyRef.current = todayKey;
  }, [todayKey]);

  const commitUserSetting = (name, options = {}) => {
    const nextValue = parseNumericDraft(profileDraft[name], userSettings[name], options);
    updateUserSettings({ [name]: nextValue });
  };

  const saveDailyRecord = () => {
    updateDailyMetrics(activeDate, {
      intake: parseNumericDraft(dailyDraft.intake, metrics.intake, { min: 0 }),
      exerciseBurn: parseNumericDraft(dailyDraft.exerciseBurn, metrics.exerciseBurn, { min: 0 }),
      note: dailyDraft.note,
    });
    createDailyMetrics(activeDate);
  };

  const shiftActiveDate = (direction) => {
    const base = new Date(`${activeDate}T12:00:00`);
    base.setDate(base.getDate() + direction);
    setActiveDate(dateKey(base));
  };

  const adjustDraftNumber = (field, delta) => {
    setDailyDraft((prev) => {
      const currentValue = Number.parseInt(prev[field] || '0', 10);
      const nextValue = Math.max(0, (Number.isFinite(currentValue) ? currentValue : 0) + delta);
      return { ...prev, [field]: String(nextValue) };
    });
  };

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
              <select value={userSettings.sex || 'female'} onChange={(e) => updateUserSettings({ sex: e.target.value })} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none [color-scheme:dark]">
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Age</label>
              <input
                type="number"
                min="18"
                value={profileDraft.age}
                onChange={(e) => setProfileDraft((prev) => ({ ...prev, age: e.target.value }))}
                onBlur={() => commitUserSetting('age', { min: 18 })}
                className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Height</label>
              <input
                type="number"
                min="120"
                value={profileDraft.heightCm}
                onChange={(e) => setProfileDraft((prev) => ({ ...prev, heightCm: e.target.value }))}
                onBlur={() => commitUserSetting('heightCm', { min: 120 })}
                className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Weight</label>
              <input
                type="number"
                min="30"
                step="0.1"
                value={profileDraft.weightKg}
                onChange={(e) => setProfileDraft((prev) => ({ ...prev, weightKg: e.target.value }))}
                onBlur={() => commitUserSetting('weightKg', { min: 30, allowFloat: true })}
                className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none"
              />
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Date</label>
            <div className="space-y-2">
              <input type="date" value={activeDate} onChange={(e) => setActiveDate(e.target.value)} className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none" />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => shiftActiveDate(-1)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#f2f5ef]">Previous</button>
                <button type="button" onClick={() => setActiveDate(todayKey)} className="rounded-full border border-[#d4ff6a]/25 bg-[#d4ff6a]/10 px-3 py-1.5 text-xs font-semibold text-[#d4ff6a]">Today</button>
                <button type="button" onClick={() => shiftActiveDate(1)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#f2f5ef]">Next</button>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Intake</label>
            <div className="space-y-2">
              <input
                type="number"
                min="0"
                value={dailyDraft.intake}
                onChange={(e) => setDailyDraft((prev) => ({ ...prev, intake: e.target.value }))}
                className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none"
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => adjustDraftNumber('intake', 100)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#f2f5ef]">+100</button>
                <button type="button" onClick={() => adjustDraftNumber('intake', 250)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#f2f5ef]">+250</button>
                <button type="button" onClick={() => adjustDraftNumber('intake', -100)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#f2f5ef]">-100</button>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Exercise Burn</label>
            <div className="space-y-2">
              <input
                type="number"
                min="0"
                value={dailyDraft.exerciseBurn}
                onChange={(e) => setDailyDraft((prev) => ({ ...prev, exerciseBurn: e.target.value }))}
                className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none"
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => adjustDraftNumber('exerciseBurn', 50)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#f2f5ef]">+50</button>
                <button type="button" onClick={() => adjustDraftNumber('exerciseBurn', 100)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#f2f5ef]">+100</button>
                <button type="button" onClick={() => adjustDraftNumber('exerciseBurn', -50)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#f2f5ef]">-50</button>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Goal</label>
            <input
              type="number"
              min="0"
              value={profileDraft.calorieGoal}
              onChange={(e) => setProfileDraft((prev) => ({ ...prev, calorieGoal: e.target.value }))}
              onBlur={() => commitUserSetting('calorieGoal', { min: 0 })}
              className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Note</label>
            <div className="space-y-2">
              <input
                type="text"
                value={dailyDraft.note}
                onChange={(e) => setDailyDraft((prev) => ({ ...prev, note: e.target.value }))}
                className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none"
                placeholder="Optional note for this day"
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setDailyDraft((prev) => ({ ...prev, note: 'Light day' }))} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#f2f5ef]">Light day</button>
                <button type="button" onClick={() => setDailyDraft((prev) => ({ ...prev, note: 'Recovery day' }))} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#f2f5ef]">Recovery day</button>
                <button type="button" onClick={() => setDailyDraft((prev) => ({ ...prev, note: '' }))} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#f2f5ef]">Clear note</button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={saveDailyRecord} className="rounded-full bg-[#d4ff6a] px-4 py-3 font-semibold text-black">
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
        <TrainingReadinessCard
          workoutHistory={state.workoutHistory}
          dailyMetrics={dailyMetrics}
          todayKey={todayKey}
        />
        <TrainingTrendCard
          workoutHistory={state.workoutHistory}
          dailyMetrics={dailyMetrics}
          todayKey={todayKey}
          subtitle="Tracking"
          title="Recovery and Load"
        />
        {/* ── Feature 8: Weekly Heatmap ── */}
        <WeeklyHeatmap
          workoutHistory={state.workoutHistory}
          dailyMetrics={dailyMetrics}
          todayKey={todayKey}
        />
        <Card subtitle="Hydration" title="Water">
          <HydrationWidget waterMl={metrics.waterMl} onAdd={() => updateDailyMetrics(activeDate, { waterMl: metrics.waterMl + 250 })} onReset={() => updateDailyMetrics(activeDate, { waterMl: 0 })} />
        </Card>
        <StreakBadge active={streak} />
      </div>
    </div>
  );
}

function parseNumericDraft(rawValue, fallbackValue, { min = 0, allowFloat = false } = {}) {
  if (rawValue === '') return fallbackValue;
  const parsed = allowFloat ? Number.parseFloat(rawValue) : Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed)) return fallbackValue;
  const normalized = allowFloat ? parsed : Math.round(parsed);
  return Math.max(min, normalized);
}

function toDraftValue(value, preserveZero = true) {
  if (!preserveZero && Number(value) === 0) return '';
  return String(value ?? '');
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
