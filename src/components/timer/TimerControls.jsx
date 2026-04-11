export default function TimerControls({ onStart, onPause, onSkip, onStop, pauseLabel = 'Pause' }) {
  return (
    <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <button type="button" onClick={onStart} className="rounded-full bg-[#d4ff6a] px-4 py-4 text-base font-semibold text-black">Play</button>
      <button type="button" onClick={onPause} className="rounded-full border border-white/10 bg-white/5 px-4 py-4 text-base font-medium text-[#f2f5ef]">{pauseLabel}</button>
      <button type="button" onClick={onSkip} className="rounded-full border border-white/10 bg-[#252c27] px-4 py-4 text-base font-medium text-[#f2f5ef]">Skip</button>
      <button type="button" onClick={onStop} className="rounded-full bg-[#ff8b2b] px-4 py-4 text-base font-semibold text-black">Stop</button>
    </div>
  );
}
