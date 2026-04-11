import { useEffect, useState } from 'react';

export default function VisualGuide({ guide, phase }) {
  const mistakes = guide.commonMistakes || [];
  const breathingCue = guide.breathingCue || '';
  const [mistakeIndex, setMistakeIndex] = useState(0);

  // Reset index whenever the exercise changes
  useEffect(() => {
    setMistakeIndex(0);
  }, [guide.name]);

  // Cycle through mistakes every 3 s during work
  useEffect(() => {
    if (phase !== 'work' || mistakes.length <= 1) return undefined;
    const id = setInterval(() => {
      setMistakeIndex((prev) => (prev + 1) % mistakes.length);
    }, 3000);
    return () => clearInterval(id);
  }, [phase, mistakes.length]);

  const isWork = phase === 'work';

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-xl font-medium text-[#f2f5ef]">{guide.name}</h3>
        {breathingCue && isWork && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4ff6a]/30 bg-[#d4ff6a]/8 px-3 py-1 text-[11px] tracking-wide text-[#d4ff6a]">
            🫁 {breathingCue}
          </span>
        )}
      </div>

      <div className="mt-4">
        <img
          src={guide.images[0]}
          alt={guide.name}
          className="h-56 w-full rounded-[1.4rem] border border-white/10 bg-panel2 object-contain sm:h-64"
        />

        {/* Common mistake warning — cycles during work phase */}
        {mistakes.length > 0 && isWork && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#ff8b2b]/25 bg-[#ff8b2b]/8 px-3 py-2 text-sm text-[#ff8b2b]">
            <span className="shrink-0 text-base">⚠</span>
            <span>
              <span className="font-medium">避免：</span>
              {mistakes[mistakeIndex]}
            </span>
            {mistakes.length > 1 && (
              <span className="ml-auto shrink-0 text-[10px] text-[#ff8b2b]/50">
                {mistakeIndex + 1}/{mistakes.length}
              </span>
            )}
          </div>
        )}

        <ul className="mt-4 space-y-2 text-sm text-[#c3ccbe]">
          {guide.tips.map((tip) => (
            <li key={tip} className="rounded-xl bg-black/20 px-3 py-2">• {tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
