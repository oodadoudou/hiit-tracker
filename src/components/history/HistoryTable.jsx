import { formatDateTime } from '../../utils/date';

export default function HistoryTable({ items, onEdit, onDelete }) {
  if (!items.length) {
    return <div className="rounded-[1.6rem] border border-white/10 bg-[#222925] p-6 text-center text-[#93a08f]">No workouts logged yet.</div>;
  }

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-[#222925] text-left text-sm text-[#d5dbcf]">
          <thead className="bg-black/10 text-xs uppercase tracking-[0.25em] text-[#8d9688]">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Routine</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Calories</th>
              <th className="px-4 py-3">RPE</th>
              <th className="px-4 py-3">Joint</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-white/6">
                <td className="px-4 py-3">{formatDateTime(item.dateIso)}</td>
                <td className="px-4 py-3 font-medium text-[#f2f5ef]">{item.routineName}</td>
                <td className="px-4 py-3">{item.durationLabel}</td>
                <td className="px-4 py-3">{item.caloriesBurned}</td>
                <td className="px-4 py-3">{item.rpe}</td>
                <td className="px-4 py-3">{item.jointComfort}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => onEdit(item)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#f2f5ef]">
                      Edit
                    </button>
                    <button type="button" onClick={() => onDelete(item)} className="rounded-full border border-[#ff8b2b]/30 bg-[#ff8b2b]/10 px-3 py-1.5 text-xs font-semibold text-[#ff8b2b]">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
