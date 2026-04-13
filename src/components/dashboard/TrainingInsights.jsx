import { AlertTriangle, CalendarClock, Flame, Sparkles, TrendingUp } from 'lucide-react';
import Card from '../shared/Card';
import { dateKey, formatDateShort, getPreviousDateKey } from '../../utils/date';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function average(values) {
  const list = values.filter((value) => Number.isFinite(value));
  if (!list.length) return 0;
  return list.reduce((sum, value) => sum + value, 0) / list.length;
}

function roundOne(value) {
  return Math.round(value * 10) / 10;
}

function keyFromIso(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : dateKey(date);
}

function daysBetween(todayKey, otherKey) {
  const [todayYear, todayMonth, todayDay] = todayKey.split('-').map(Number);
  const [otherYear, otherMonth, otherDay] = otherKey.split('-').map(Number);
  const today = new Date(todayYear, todayMonth - 1, todayDay);
  const other = new Date(otherYear, otherMonth - 1, otherDay);
  return Math.round((today - other) / (1000 * 60 * 60 * 24));
}

function recentCalendarKeys(todayKey, count = 7) {
  const keys = [];
  let cursor = todayKey;
  for (let i = 0; i < count; i += 1) {
    keys.unshift(cursor);
    cursor = getPreviousDateKey(cursor);
  }
  return keys;
}

function countBy(items, getKey) {
  const counts = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
}

function formatCount(count, unit) {
  return `${count} ${unit}`;
}

export function buildTrainingInsights({ workoutHistory = [], dailyMetrics = {}, todayKey = dateKey() } = {}) {
  const sessions = workoutHistory
    .map((entry) => ({ ...entry, _dateKey: keyFromIso(entry.dateIso) }))
    .filter((entry) => entry._dateKey)
    .sort((a, b) => new Date(b.dateIso) - new Date(a.dateIso));

  const recentSessions = sessions.slice(0, 7);
  const recentThree = sessions.slice(0, 3);
  const recentSevenDays = recentCalendarKeys(todayKey, 7);
  const workoutDays = new Set(sessions.map((entry) => entry._dateKey));
  const recentWorkoutDays = recentSevenDays.filter((day) => workoutDays.has(day));
  const deficitDays = recentSevenDays.filter((day) => safeNumber(dailyMetrics[day]?.deficit) < 0);
  const hydrationToday = safeNumber(dailyMetrics[todayKey]?.waterMl);
  const latestSession = sessions[0] || null;
  const latestSessionKey = latestSession ? latestSession._dateKey : null;
  const daysSinceLast = latestSessionKey ? daysBetween(todayKey, latestSessionKey) : null;

  const avgCalories = average(recentSessions.map((entry) => safeNumber(entry.caloriesBurned)));
  const avgRpe = average(recentSessions.map((entry) => safeNumber(entry.rpe)));
  const avgJointComfort = average(recentSessions.map((entry) => safeNumber(entry.jointComfort)));
  const avgIntensity = average(recentSessions.map((entry) => safeNumber(entry.intensityMultiplier || 1)));
  const routineCounts = countBy(recentSessions, (entry) => entry.routineName || entry.routineId || null);
  const [topRoutineName, topRoutineCount] = [...routineCounts.entries()].sort((a, b) => b[1] - a[1])[0] || [];
  const topRoutineShare = recentSessions.length ? topRoutineCount / recentSessions.length : 0;

  let readinessScore = 72;
  if (!recentSessions.length) {
    readinessScore = 55;
  } else {
    readinessScore += (7 - clamp(avgRpe, 0, 10)) * 3;
    readinessScore += (clamp(avgJointComfort, 0, 10) - 5) * 4;
    readinessScore += hydrationToday >= 1500 ? 6 : hydrationToday >= 1000 ? 2 : -6;
    readinessScore += recentWorkoutDays.length >= 5 ? -8 : recentWorkoutDays.length <= 2 ? 6 : 0;
    readinessScore += deficitDays.length >= 4 ? -6 : deficitDays.length <= 1 ? 3 : 0;
    if (daysSinceLast === 0) readinessScore -= 4;
    else if (daysSinceLast > 2) readinessScore -= 8;
    else if (daysSinceLast === 1) readinessScore += 2;
    if (avgRpe >= 8) readinessScore -= 10;
    if (avgJointComfort <= 4) readinessScore -= 10;
    if (avgIntensity >= 1.15) readinessScore -= 6;
  }
  readinessScore = Math.round(clamp(readinessScore, 0, 100));

  const readinessLabel = readinessScore >= 80 ? 'Ready' : readinessScore >= 60 ? 'Moderate' : 'Recover';
  const readinessTone = readinessScore >= 80 ? 'text-[#d4ff6a]' : readinessScore >= 60 ? 'text-[#f7d66d]' : 'text-[#ff8b2b]';
  const readinessIcon = readinessScore >= 80 ? Sparkles : readinessScore >= 60 ? TrendingUp : AlertTriangle;
  const readinessHeadline =
    readinessScore >= 80
      ? '适合继续常规训练'
      : readinessScore >= 60
        ? '先热身，再决定是否加量'
        : '今天更适合恢复或低冲击';

  const trendHeadline =
    !recentSessions.length
      ? '还没有足够的训练记录。先完成几次训练再看趋势。'
      : avgRpe >= 7.5 || avgJointComfort <= 5.5
        ? '最近负荷偏高，下一次建议降低一档强度。'
        : avgIntensity >= 1.15
          ? '你最近多次使用高强度模式，建议穿插一到两次稳态训练。'
        : recentWorkoutDays.length >= 4 && avgRpe <= 6.5 && avgJointComfort >= 7
          ? '节奏稳定，当前强度可以继续维持。'
          : topRoutineName && topRoutineShare >= 0.5
            ? `你最近主要在练「${topRoutineName}」，可以穿插不同模式防止单一负荷。`
            : '训练节奏比较均衡，保持连续性会更重要。';

  const trendSignals = [
    recentSessions.length ? `近 7 次训练：${formatCount(recentSessions.length, '次')}` : '近 7 次训练：0 次',
    `最近 7 天训练日：${formatCount(recentWorkoutDays.length, '天')}`,
    `平均消耗：${Math.round(avgCalories)} kcal / 次`,
    `平均 RPE：${roundOne(avgRpe)} / 10`,
    `关节舒适度：${roundOne(avgJointComfort)} / 10`,
    `平均强度倍率：${roundOne(avgIntensity || 1)}x`,
  ];

  const readinessSignals = [
    {
      label: 'Recent RPE',
      value: `${roundOne(average(recentThree.map((entry) => safeNumber(entry.rpe))))} / 10`,
      note: 'Lower means fresher',
    },
    {
      label: 'Joint Comfort',
      value: `${roundOne(average(recentThree.map((entry) => safeNumber(entry.jointComfort))))} / 10`,
      note: 'Higher means safer',
    },
    {
      label: 'Hydration',
      value: `${Math.round(hydrationToday)} ml`,
      note: 'Today',
    },
    {
      label: 'Recovery Gap',
      value: latestSessionKey ? (daysSinceLast === 0 ? 'Today' : `${daysSinceLast} days ago`) : 'No recent session',
      note: 'Between workouts',
    },
  ];

  const readinessAdvice =
    readinessScore >= 80
      ? '热身后可以按原计划推进，保留一点余量把质量做满。'
      : readinessScore >= 60
        ? '先做 5-8 分钟热身，若呼吸和关节反馈稳定再加量。'
        : '优先低冲击、拉伸或恢复性训练，把关节和疲劳先拉回来。';

  return {
    summary: {
      recentSessions,
      recentWorkoutDays,
      deficitDays,
      avgCalories: Math.round(avgCalories),
      avgRpe: roundOne(avgRpe),
      avgJointComfort: roundOne(avgJointComfort),
      avgIntensity: roundOne(avgIntensity || 1),
      latestSession,
      topRoutineName,
      readinessScore,
      readinessLabel,
      readinessTone,
      readinessHeadline,
      readinessIcon,
      readinessAdvice,
      trendHeadline,
      trendSignals,
      readinessSignals,
    },
  };
}

function InsightStat({ label, value, note }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/15 p-3">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#8d9688]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#f2f5ef]">{value}</p>
      <p className="mt-1 text-xs text-[#9fa89b]">{note}</p>
    </div>
  );
}

export function TrainingReadinessCard({ workoutHistory, dailyMetrics, todayKey }) {
  const { summary } = buildTrainingInsights({ workoutHistory, dailyMetrics, todayKey });
  const ReadinessIcon = summary.readinessIcon;

  return (
    <Card subtitle="Readiness" title="Today's Training Readiness">
      <div className="rounded-[1.4rem] border border-white/10 bg-[#222925] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Score</p>
            <div className="mt-2 flex items-end gap-3">
              <span className={`text-4xl font-semibold ${summary.readinessTone}`}>{summary.readinessScore}</span>
              <span className="pb-1 text-sm uppercase tracking-[0.24em] text-[#8d9688]">/ 100</span>
            </div>
          </div>
          <div className={`flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${summary.readinessTone}`}>
            <ReadinessIcon className="h-4 w-4" />
            {summary.readinessLabel}
          </div>
        </div>
        <p className="mt-4 text-lg font-medium text-[#f2f5ef]">{summary.readinessHeadline}</p>
        <p className="mt-2 text-sm text-[#b6beb1]">{summary.readinessAdvice}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {summary.readinessSignals.map((signal) => (
            <InsightStat key={signal.label} label={signal.label} value={signal.value} note={signal.note} />
          ))}
        </div>
      </div>
    </Card>
  );
}

export function TrainingTrendCard({ workoutHistory, dailyMetrics, todayKey, subtitle = 'Trends', title = 'Recent Training Pattern' }) {
  const { summary } = buildTrainingInsights({ workoutHistory, dailyMetrics, todayKey });

  return (
    <Card subtitle={subtitle} title={title}>
      <div className="rounded-[1.4rem] border border-white/10 bg-[#222925] p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/10 bg-black/15 p-2 text-[#d4ff6a]">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#f2f5ef]">{summary.trendHeadline}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#8d9688]">
              {summary.latestSession ? `Last session: ${formatDateShort(new Date(summary.latestSession.dateIso))}` : 'No recorded sessions yet'}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <InsightStat label="Recent Sessions" value={summary.recentSessions.length || 0} note="Most recent 7 workouts" />
          <InsightStat label="Avg Calories" value={`${summary.avgCalories} kcal`} note="Calories burned per session" />
          <InsightStat label="Avg RPE" value={`${summary.avgRpe} / 10`} note="Perceived effort" />
          <InsightStat label="Avg Joint" value={`${summary.avgJointComfort} / 10`} note="Comfort and recovery signal" />
          <InsightStat label="Avg Intensity" value={`${summary.avgIntensity}x`} note="Selected workout intensity" />
          <InsightStat label="Training Days" value={summary.recentWorkoutDays.length} note="In the last 7 days" />
          <InsightStat label="Top Routine" value={summary.topRoutineName || '--'} note="Most repeated pattern" />
        </div>
        <div className="mt-4 rounded-2xl border border-white/8 bg-black/15 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#8d9688]">
            <CalendarClock className="h-3.5 w-3.5" />
            Trend signals
          </div>
          <ul className="mt-3 space-y-2 text-sm text-[#c9d0c4]">
            {summary.trendSignals.map((signal) => (
              <li key={signal} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#d4ff6a]" />
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
