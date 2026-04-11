export default function TimerControls({ onStart, onPause, onSkip, onStop, pauseLabel = 'Pause' }) {
  return (
    <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <button type="button" onClick={onStart} className="rounded-full bg-[#d4ff6a] px-4 py-3 text-sm font-semibold text-black">Play</button>
      <button type="button" onClick={onPause} className="rounded-full bg-[#3a463f] px-4 py-3 text-sm font-semibold text-[#f2f5ef] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:bg-[#445249]">{pauseLabel}</button>
      <button type="button" onClick={onSkip} className="rounded-full border border-[#ffb36f]/25 bg-[#6a4020] px-4 py-3 text-sm font-semibold text-[#fff3e8] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:bg-[#7a4a24]">Skip</button>
      <button type="button" onClick={onStop} className="rounded-full bg-[#ff8b2b] px-4 py-3 text-sm font-semibold text-black">Stop</button>
    </div>
  );
}
