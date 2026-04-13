import { useEffect, useMemo, useState } from 'react';
import { FALLBACK_GUIDE_IMAGE } from '../../utils/constants';

export default function VisualGuide({ guide, phase, nextExercise }) {
  const mistakes = guide.commonMistakes || [];
  const breathingCue = guide.breathingCue || '';
  const regression = guide.regression || '';
  const [mistakeIndex, setMistakeIndex] = useState(0);
  const primaryImage = useMemo(
    () => (Array.isArray(guide.images) && guide.images.length ? guide.images[0] : FALLBACK_GUIDE_IMAGE),
    [guide.images],
  );
  const [imageSrc, setImageSrc] = useState(primaryImage);
  const nextImage = useMemo(
    () => (Array.isArray(nextExercise?.images) && nextExercise.images.length ? nextExercise.images[0] : FALLBACK_GUIDE_IMAGE),
    [nextExercise],
  );
  const [nextImageSrc, setNextImageSrc] = useState(nextImage);

  useEffect(() => { setNextImageSrc(nextImage); }, [nextImage]);

  // Reset index whenever the exercise changes
  useEffect(() => {
    setMistakeIndex(0);
  }, [guide.name]);

  useEffect(() => {
    setImageSrc(primaryImage);
  }, [primaryImage]);

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
        <div className="mb-3 flex flex-wrap gap-2">
          {guide.focus ? (
            <span className="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#c7d0c2]">
              Focus {guide.focus}
            </span>
          ) : null}
          {guide.jointLoad ? (
            <span className="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#c7d0c2]">
              Joint {guide.jointLoad}
            </span>
          ) : null}
          {guide.impactLevel ? (
            <span className="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#c7d0c2]">
              Impact {guide.impactLevel}
            </span>
          ) : null}
          {guide.tempo ? (
            <span className="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#c7d0c2]">
              Tempo {guide.tempo}
            </span>
          ) : null}
        </div>
        <img
          src={imageSrc}
          alt={guide.name}
          className="h-56 w-full rounded-[1.4rem] border border-white/10 bg-panel2 object-contain sm:h-64"
          onError={() => {
            if (imageSrc !== FALLBACK_GUIDE_IMAGE) setImageSrc(FALLBACK_GUIDE_IMAGE);
          }}
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
        {regression ? (
          <div className="mt-3 rounded-xl border border-[#8dd3ff]/20 bg-[#8dd3ff]/8 px-3 py-2 text-sm text-[#d7efff]">
            <span className="font-medium">降阶建议：</span>
            {regression}
          </div>
        ) : null}

        {/* Up Next — shown during rest phase */}
        {!isWork && nextExercise && nextExercise.name && (
          <div className="mt-4 rounded-[1.4rem] border border-[#d4ff6a]/20 bg-[#d4ff6a]/5 p-3">
            <p className="mb-2 text-[11px] uppercase tracking-[0.25em] text-[#9aa394]">
              Up Next · 下一个动作
            </p>
            <div className="flex items-center gap-3">
              <img
                src={nextImageSrc}
                alt={nextExercise.name}
                className="h-14 w-14 shrink-0 rounded-[0.8rem] border border-white/10 bg-[#1a1f1a] object-contain"
                onError={() => { if (nextImageSrc !== FALLBACK_GUIDE_IMAGE) setNextImageSrc(FALLBACK_GUIDE_IMAGE); }}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#d4ff6a]">{nextExercise.name}</p>
                {nextExercise.focus && (
                  <p className="mt-0.5 text-[11px] text-[#6b7566]">
                    {nextExercise.focus}{nextExercise.tempo ? ` · ${nextExercise.tempo}` : ''}
                  </p>
                )}
                {Array.isArray(nextExercise.tips) && nextExercise.tips[0] && (
                  <p className="mt-1 text-[11px] text-[#8d9688]">• {nextExercise.tips[0]}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
