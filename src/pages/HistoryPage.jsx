import { useMemo, useState } from 'react';
import Card from '../components/shared/Card';
import HistoryTable from '../components/history/HistoryTable';
import Modal from '../components/shared/Modal';
import { TrainingTrendCard } from '../components/dashboard/TrainingInsights';
import { useAppContext } from '../context/AppContext';
import { formatClock } from '../utils/workout';

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
      <p className="mb-4 text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Routine Frequency</p>
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
                <span className="shrink-0 text-xs text-[#8d9688]">{count}×</span>
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
    </div>
  );
}

export default function HistoryPage() {
  const { state, clearHistory, updateWorkoutHistory, deleteWorkoutHistory } = useAppContext();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const items = useMemo(
    () => [...state.workoutHistory].sort((a, b) => new Date(b.dateIso) - new Date(a.dateIso)),
    [state.workoutHistory],
  );

  const handleSaveEdit = (draft) => {
    const totalDurationSec = Math.max(0, Math.round(Number(draft.totalDurationSec) || 0));
    const activeWorkSec = Math.min(totalDurationSec, Math.max(0, Math.round(Number(draft.activeWorkSec) || 0)));
    updateWorkoutHistory(draft.id, {
      dateIso: new Date(`${draft.date}T${draft.time || '12:00'}:00`).toISOString(),
      routineName: draft.routineName,
      totalDurationSec,
      durationLabel: formatClock(totalDurationSec),
      activeWorkSec,
      caloriesBurned: Math.max(0, Math.round(Number(draft.caloriesBurned) || 0)),
      rpe: Math.max(1, Math.min(10, Math.round(Number(draft.rpe) || 5))),
      jointComfort: Math.max(1, Math.min(10, Math.round(Number(draft.jointComfort) || 5))),
    });
    setEditingItem(null);
  };

  return (
    <Card subtitle="History" title="Workout Log">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setConfirmingClear(true)}
          className="rounded-full bg-[#ff8b2b] px-4 py-3 font-semibold text-black"
        >
          Clear History
        </button>
      </div>
      {confirmingClear && (
        <div className="mb-4 rounded-[1.4rem] border border-[#ff8b2b]/25 bg-[#ff8b2b]/8 px-4 py-4">
          <p className="text-sm font-medium text-[#ff8b2b]">This cannot be undone.</p>
          <p className="mt-1 text-sm text-[#ffc490]">Export a JSON backup first if you might want to restore later.</p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmingClear(false)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[#f2f5ef]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                clearHistory();
                setConfirmingClear(false);
              }}
              className="rounded-full bg-[#ff8b2b] px-4 py-2.5 text-sm font-semibold text-black"
            >
              Confirm Clear
            </button>
          </div>
        </div>
      )}
      <TrainingTrendCard
        workoutHistory={state.workoutHistory}
        dailyMetrics={state.dailyMetrics}
        subtitle="History Insight"
        title="What Your Logs Say"
      />
      <HistoryTable
        items={items}
        onEdit={(item) => setEditingItem(item)}
        onDelete={(item) => setDeletingItem(item)}
      />
      <RoutineFrequency workoutHistory={state.workoutHistory} />

      <Modal open={Boolean(editingItem)} title="Edit Workout" onClose={() => setEditingItem(null)}>
        {editingItem ? (
          <HistoryEditForm
            item={editingItem}
            onCancel={() => setEditingItem(null)}
            onSave={handleSaveEdit}
          />
        ) : null}
      </Modal>

      <Modal open={Boolean(deletingItem)} title="Delete Workout" onClose={() => setDeletingItem(null)}>
        {deletingItem ? (
          <div className="mt-4">
            <p className="text-sm text-[#c3ccbe]">Delete the workout record for `{deletingItem.routineName}`? Daily exercise burn will be recalculated automatically.</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setDeletingItem(null)} className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-[#f2f5ef]">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteWorkoutHistory(deletingItem.id);
                  setDeletingItem(null);
                }}
                className="rounded-full bg-[#ff8b2b] px-4 py-3 text-sm font-semibold text-black"
              >
                Delete Record
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </Card>
  );
}

function HistoryEditForm({ item, onCancel, onSave }) {
  const timestamp = new Date(item.dateIso);
  const [draft, setDraft] = useState(() => ({
    id: item.id,
    date: item.dateIso.slice(0, 10),
    time: `${String(timestamp.getHours()).padStart(2, '0')}:${String(timestamp.getMinutes()).padStart(2, '0')}`,
    routineName: item.routineName,
    totalDurationSec: String(item.totalDurationSec),
    activeWorkSec: String(item.activeWorkSec),
    caloriesBurned: String(item.caloriesBurned),
    rpe: String(item.rpe),
    jointComfort: String(item.jointComfort),
  }));

  const updateDraft = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date">
          <input type="date" value={draft.date} onChange={(event) => updateDraft('date', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none" />
        </Field>
        <Field label="Time">
          <input type="time" value={draft.time} onChange={(event) => updateDraft('time', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none" />
        </Field>
        <Field label="Routine">
          <input value={draft.routineName} onChange={(event) => updateDraft('routineName', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none" />
        </Field>
        <Field label="Calories">
          <input type="number" min="0" value={draft.caloriesBurned} onChange={(event) => updateDraft('caloriesBurned', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none" />
        </Field>
        <Field label="Total Duration Sec">
          <input type="number" min="0" value={draft.totalDurationSec} onChange={(event) => updateDraft('totalDurationSec', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none" />
        </Field>
        <Field label="Active Work Sec">
          <input type="number" min="0" value={draft.activeWorkSec} onChange={(event) => updateDraft('activeWorkSec', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none" />
        </Field>
        <Field label="RPE">
          <input type="number" min="1" max="10" value={draft.rpe} onChange={(event) => updateDraft('rpe', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none" />
        </Field>
        <Field label="Joint Comfort">
          <input type="number" min="1" max="10" value={draft.jointComfort} onChange={(event) => updateDraft('jointComfort', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none" />
        </Field>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={() => onSave(draft)} className="rounded-full bg-[#d4ff6a] px-4 py-3 font-semibold text-black">
          Save Changes
        </button>
        <button type="button" onClick={onCancel} className="rounded-full border border-white/10 bg-white/5 px-4 py-3 font-medium text-[#f2f5ef]">
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">{label}</label>
      {children}
    </div>
  );
}
