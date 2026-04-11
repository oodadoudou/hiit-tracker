import { useMemo, useState } from 'react';
import { formatDateShort } from './utils/date';
import TopNav from './components/layout/TopNav';
import WorkoutPage from './pages/WorkoutPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import Modal from './components/shared/Modal';
import { useAppContext } from './context/AppContext';

function getMotivationalMessage(summary, isNewCalBest, isNewDurBest) {
  if (isNewCalBest && isNewDurBest) return '双料新高！卡路里和时长都创了记录，今天是你最强的一天！';
  if (isNewCalBest) return '燃脂新纪录！这次的消耗超过了你的历史最高。';
  if (isNewDurBest) return '坚持时长新记录！今天比任何一次都撑得更久。';
  const secs = summary?.totalDurationSec || 0;
  const cals = summary?.caloriesBurned || 0;
  if (secs >= 1800) return '太拼了！超过 30 分钟，这就是真正的训练。';
  if (cals >= 200) return '燃脂效果相当不错！继续保持这个节奏。';
  if (secs >= 600) return '完成了！每一次训练都是对未来的自己投资。';
  return '干得好！今天动了，就比昨天进步一点。';
}

export default function App() {
  const [page, setPage] = useState('workout');
  const [pendingSummary, setPendingSummary] = useState(null);
  const [rpe, setRpe] = useState(5);
  const [jointComfort, setJointComfort] = useState(5);
  const { state, addWorkoutHistory } = useAppContext();

  // ── Feature 6: Personal best detection ──
  const { isNewCalBest, isNewDurBest } = useMemo(() => {
    if (!pendingSummary) return {};
    const history = state.workoutHistory.filter(
      (item) => item.routineId === pendingSummary.routineId,
    );
    if (!history.length) return { isNewCalBest: true, isNewDurBest: true };
    const maxCals = Math.max(...history.map((h) => h.caloriesBurned || 0));
    const maxDur = Math.max(...history.map((h) => h.totalDurationSec || 0));
    return {
      isNewCalBest: (pendingSummary.caloriesBurned || 0) > maxCals,
      isNewDurBest: (pendingSummary.totalDurationSec || 0) > maxDur,
    };
  }, [pendingSummary, state.workoutHistory]);

  const motivationalMessage = pendingSummary
    ? getMotivationalMessage(pendingSummary, isNewCalBest, isNewDurBest)
    : '';

  const saveSession = () => {
    if (!pendingSummary) return;
    addWorkoutHistory({ ...pendingSummary, rpe, jointComfort });
    setPendingSummary(null);
    setRpe(5);
    setJointComfort(5);
    setPage('history');
  };

  return (
    <div className="min-h-screen text-white">
      <TopNav page={page} onChange={setPage} />
      <header className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="rounded-[2rem] border border-white/10 bg-[rgba(18,22,20,0.82)] px-5 py-5 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.42em] text-[#c8d1c3]">G Direction</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#f2f5ef] sm:text-4xl">
                Focused Training
              </h1>
            </div>
            <div className="min-w-[140px] sm:text-right">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#8d9688]">Today</p>
              <p className="mt-2 text-lg font-medium text-[#f2f5ef]">{formatDateShort()}</p>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
        {page === 'workout' ? <WorkoutPage onSessionStop={setPendingSummary} /> : null}
        {page === 'dashboard' ? <DashboardPage /> : null}
        {page === 'history' ? <HistoryPage /> : null}
        {page === 'settings' ? <SettingsPage /> : null}
      </main>

      {/* ── Feature 6: Richer workout completion modal ── */}
      <Modal open={Boolean(pendingSummary)} title="训练完成！" onClose={() => setPendingSummary(null)}>
        {pendingSummary ? (
          <div>
            {/* Motivational message */}
            <div className="mt-3 rounded-[1.4rem] border border-[#d4ff6a]/20 bg-[#d4ff6a]/8 px-4 py-3 text-sm text-[#d4ff6a]">
              {motivationalMessage}
            </div>

            {/* Personal best badges */}
            {(isNewCalBest || isNewDurBest) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {isNewCalBest && (
                  <span className="rounded-full border border-[#d4ff6a]/30 bg-[#d4ff6a]/10 px-3 py-1 text-xs font-medium text-[#d4ff6a]">
                    🏆 燃脂新高
                  </span>
                )}
                {isNewDurBest && (
                  <span className="rounded-full border border-[#d4ff6a]/30 bg-[#d4ff6a]/10 px-3 py-1 text-xs font-medium text-[#d4ff6a]">
                    ⏱ 时长新高
                  </span>
                )}
              </div>
            )}

            {/* Summary stats */}
            <div className="mt-4 rounded-[1.6rem] border border-white/10 bg-[rgba(32,38,34,0.72)] p-4 text-sm text-[#c8d1c3]">
              <div className="flex justify-between gap-4">
                <span>训练计划</span>
                <span className="font-semibold text-[#f2f5ef]">{pendingSummary.routineName}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span>总时长</span>
                <span className="font-semibold text-[#f2f5ef]">{pendingSummary.durationLabel}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span>消耗卡路里</span>
                <span className="font-semibold text-[#d4ff6a]">{pendingSummary.caloriesBurned} kcal</span>
              </div>
            </div>

            {/* ── Feature 7: Body feel ratings ── */}
            <div className="mt-5">
              <label className="block text-sm font-medium text-[#e8ece3]">
                心肺疲劳度 (RPE)
                <span className="ml-2 text-[#d4ff6a]">{rpe}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
                className="mt-3 w-full"
              />
              <div className="mt-1 flex justify-between text-[10px] text-[#8d9688]">
                <span>轻松</span><span>适中</span><span>很累</span>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#e8ece3]">
                膝盖 / 关节舒适度
                <span className="ml-2 text-[#d4ff6a]">{jointComfort}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={jointComfort}
                onChange={(e) => setJointComfort(Number(e.target.value))}
                className="mt-3 w-full"
              />
              <div className="mt-1 flex justify-between text-[10px] text-[#8d9688]">
                <span>不舒服</span><span>还好</span><span>很好</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={saveSession}
                className="rounded-full bg-[#d4ff6a] px-4 py-4 font-semibold text-black"
              >
                保存记录
              </button>
              <button
                type="button"
                onClick={() => setPendingSummary(null)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-4 font-medium text-[#f2f5ef]"
              >
                放弃
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
