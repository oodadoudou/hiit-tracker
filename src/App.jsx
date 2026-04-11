import { useState } from 'react';
import { formatDateShort } from './utils/date';
import TopNav from './components/layout/TopNav';
import WorkoutPage from './pages/WorkoutPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import Modal from './components/shared/Modal';
import { useAppContext } from './context/AppContext';

export default function App() {
  const [page, setPage] = useState('workout');
  const [pendingSummary, setPendingSummary] = useState(null);
  const [rpe, setRpe] = useState(5);
  const [jointComfort, setJointComfort] = useState(5);
  const { addWorkoutHistory } = useAppContext();

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
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.42em] text-[#c8d1c3]">G Direction</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#f2f5ef] sm:text-4xl">
                Focused Training
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#aeb7a8]">
                训练计时、记录与设置被整理成更安静的单页体验，不再强调仪表盘式的数据堆叠。
              </p>
            </div>
            <div className="min-w-[180px] border-l border-white/10 pl-0 sm:pl-6">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#8d9688]">Today</p>
              <p className="mt-2 text-lg font-medium text-[#f2f5ef]">{formatDateShort()}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.28em] text-[#8d9688]">Mode</p>
              <p className="mt-1 text-sm text-[#c8d1c3]">Japanese Minimal Sport</p>
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
      <Modal open={Boolean(pendingSummary)} title="Log Workout" onClose={() => setPendingSummary(null)}>
        {pendingSummary ? (
          <div>
            <div className="mt-4 rounded-[1.6rem] border border-white/10 bg-[rgba(32,38,34,0.72)] p-4 text-sm text-[#c8d1c3]">
              <div className="flex justify-between gap-4"><span>Routine</span><span className="font-semibold text-[#f2f5ef]">{pendingSummary.routineName}</span></div>
              <div className="mt-2 flex justify-between gap-4"><span>Duration</span><span className="font-semibold text-[#f2f5ef]">{pendingSummary.durationLabel}</span></div>
              <div className="mt-2 flex justify-between gap-4"><span>Calories</span><span className="font-semibold text-[#f2f5ef]">{pendingSummary.caloriesBurned} kcal</span></div>
            </div>
            <div className="mt-5">
              <label className="block text-sm font-medium text-[#e8ece3]">心肺疲劳度 (RPE): <span>{rpe}</span></label>
              <input type="range" min="1" max="10" value={rpe} onChange={(event) => setRpe(Number(event.target.value))} className="mt-3 w-full" />
            </div>
            <div className="mt-5">
              <label className="block text-sm font-medium text-[#e8ece3]">膝盖/关节舒适度: <span>{jointComfort}</span></label>
              <input type="range" min="1" max="10" value={jointComfort} onChange={(event) => setJointComfort(Number(event.target.value))} className="mt-3 w-full" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={saveSession} className="rounded-full bg-[#d4ff6a] px-4 py-4 font-semibold text-black">Save</button>
              <button type="button" onClick={() => setPendingSummary(null)} className="rounded-full border border-white/10 bg-white/5 px-4 py-4 font-medium text-[#f2f5ef]">Discard</button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
