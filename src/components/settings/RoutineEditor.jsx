export default function RoutineEditor({
  form,
  onChange,
  onSubmit,
  onDelete,
  routines,
  selectedId,
  onSelect,
  onNew,
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr]">
      <div className="rounded-[2rem] border border-white/10 bg-[rgba(20,25,22,0.82)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#9aa394]">Settings</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f2f5ef]">Routine Builder</h2>
          </div>
          <button type="button" onClick={onNew} className="rounded-full bg-[#d4ff6a] px-4 py-3 font-semibold text-black">New</button>
        </div>
        <div className="mt-4">
          <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Routine</label>
          <select value={selectedId || ''} onChange={(event) => onSelect(event.target.value)} className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none">
            <option value="">New routine</option>
            {routines.map((routine) => <option key={routine.id} value={routine.id}>{routine.name}</option>)}
          </select>
        </div>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Name</label>
            <input name="name" value={form.name} onChange={onChange} className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Mode</label>
              <select name="mode" value={form.mode} onChange={onChange} className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none">
                <option value="infinite">Infinite</option>
                <option value="finite">Finite</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Circuits</label>
              <input name="circuits" type="number" min="1" value={form.circuits} onChange={onChange} className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none" disabled={form.mode === 'infinite'} />
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Work Sec</label>
              <input name="workSec" type="number" min="5" value={form.workSec} onChange={onChange} className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Rest Sec</label>
              <input name="restSec" type="number" min="0" value={form.restSec} onChange={onChange} className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Circuit Rest</label>
              <input name="circuitRestSec" type="number" min="0" value={form.circuitRestSec} onChange={onChange} className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Exercises JSON</label>
            <textarea name="exercisesJson" rows="14" value={form.exercisesJson} onChange={onChange} className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 font-mono text-sm outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="submit" className="rounded-full bg-[#d4ff6a] px-4 py-4 font-semibold text-black">Save Routine</button>
            <button type="button" onClick={onDelete} className="rounded-full bg-[#ff8b2b] px-4 py-4 font-semibold text-black">Delete</button>
          </div>
        </form>
      </div>
      <div className="rounded-[2rem] border border-white/10 bg-[rgba(20,25,22,0.82)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.35em] text-[#9aa394]">Schema</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f2f5ef]">Exercise Object Format</h2>
        <pre className="mt-4 overflow-x-auto rounded-[1.4rem] bg-[#222925] p-4 text-xs text-[#c3ccbe]">{`[
  {
    "name": "动作名",
    "images": ["https://...", "https://..."],
    "tips": ["提示1", "提示2"]
  }
]`}</pre>
      </div>
    </div>
  );
}
