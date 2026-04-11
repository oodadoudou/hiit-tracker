export default function JsonManager({ onExport, onImport }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[rgba(20,25,22,0.82)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-6">
      <p className="text-[11px] uppercase tracking-[0.35em] text-[#9aa394]">JSON</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f2f5ef]">Backup / Restore</h2>
      <p className="mt-3 text-sm leading-6 text-[#aeb7a8]">
        Includes daily diet logs, workout history, routines, and body settings.
      </p>
      <div className="mt-4 space-y-4">
        <button type="button" onClick={onExport} className="w-full rounded-full bg-[#d4ff6a] px-4 py-4 font-semibold text-black">Export Full JSON</button>
        <label className="block rounded-full border border-white/10 bg-[#222925] px-4 py-4 text-center font-medium text-[#f2f5ef]">
          Import Full JSON
          <input type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
        </label>
      </div>
    </div>
  );
}
