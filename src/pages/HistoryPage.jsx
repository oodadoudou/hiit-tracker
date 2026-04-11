import Card from '../components/shared/Card';
import HistoryTable from '../components/history/HistoryTable';
import { useAppContext } from '../context/AppContext';

export default function HistoryPage() {
  const { state, clearHistory } = useAppContext();
  const items = [...state.workoutHistory].sort((a, b) => new Date(b.dateIso) - new Date(a.dateIso));

  return (
    <Card subtitle="History" title="Workout Log">
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={clearHistory} className="rounded-full bg-[#ff8b2b] px-4 py-3 font-semibold text-black">Clear History</button>
      </div>
      <HistoryTable items={items} />
    </Card>
  );
}
