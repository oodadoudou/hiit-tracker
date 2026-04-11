export default function HydrationWidget({ waterMl, onAdd, onReset }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-panel2 p-4 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-muted">Water</p>
      <div className="mt-3 text-5xl font-black text-amberx">{waterMl} ml</div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={onAdd} className="rounded-2xl bg-accent px-4 py-4 font-black text-black">+250 ml</button>
        <button type="button" onClick={onReset} className="rounded-2xl bg-white/10 px-4 py-4 font-bold">Reset</button>
      </div>
    </div>
  );
}
