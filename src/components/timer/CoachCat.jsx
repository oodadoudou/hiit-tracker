import { useEffect, useMemo, useRef, useState } from 'react';
import { loadCoachCatUi, saveCoachCatUi } from '../../utils/coachCatUi';

const CAT_FRAMES = {
  idle: [
    String.raw` /\_/\\
( -.- )
 / >☕`,
    String.raw` /\_/\\
( -.- )
 /  >☕`,
  ],
  idleBlink: [
    String.raw` /\_/\\
( -.- )
 / >☕`,
    String.raw` /\_/\\
( -.- )
 /  >☕`,
  ],
  idleYawn: [
    String.raw` /\_/\\
( -o- )
 / >☕`,
    String.raw` /\_/\\
( -o- )
 /  >☕`,
  ],
  hype: [
    String.raw` /\_/\\
( •̀ᴗ•́ )
 / >✨`,
    String.raw` /\_/\\
( •̀ᴗ•́ )
 /  >✨`,
  ],
  steady: [
    String.raw` /\_/\\
( o.o )
 / >🍃`,
    String.raw` /\_/\\
( o.o )
 /  >🍃`,
  ],
  push: [
    String.raw` /\_/\\
( •̀o•́ )
 / >🔥`,
    String.raw` /\_/\\
( •̀o•́ )
 /  >🔥`,
  ],
  recover: [
    String.raw` /\_/\\
( ^.^ )
 / >☁`,
    String.raw` /\_/\\
( ^.^ )
 /  >☁`,
  ],
  complete: [
    String.raw` /\_/\\
( ^o^ )
 / >🏆`,
    String.raw` /\_/\\
( ^o^ )
 /  >🏆`,
  ],
  completeCelebrate: [
    String.raw` /\_/\\
( ^ᗜ^ )
 / >🎉`,
    String.raw` /\_/\\
( ^ᗜ^ )
 /  >🎉`,
  ],
};

const TONE_CLASS = {
  idle: 'border-white/10 bg-[rgba(255,255,255,0.08)] text-[#f2f5ef]',
  hype: 'border-[#d4ff6a]/30 bg-[rgba(212,255,106,0.12)] text-[#f3ffe1]',
  steady: 'border-white/10 bg-[rgba(255,255,255,0.07)] text-[#f2f5ef]',
  push: 'border-[#ff8b2b]/30 bg-[rgba(255,139,43,0.12)] text-[#fff2e7]',
  recover: 'border-[#8dd3ff]/25 bg-[rgba(141,211,255,0.12)] text-[#edf8ff]',
  complete: 'border-[#ffd76a]/30 bg-[rgba(255,215,106,0.14)] text-[#fff7dc]',
};

const SKIN_ACCENT_CLASS = {
  lime: 'text-[#d4ff6a]',
  sky: 'text-[#8dd3ff]',
  ember: 'text-[#ffb15c]',
};

const PERSONALITY_LABEL = {
  cold: 'Cold',
  cute: 'Cute',
  steady: 'Steady',
  strict: 'Strict',
};

export default function CoachCat({ visible, state, defaultPersonality = 'cold', onPersonalityChange, onMemoryChange }) {
  const [ui, setUi] = useState(() => loadCoachCatUi(defaultPersonality));
  const [frameIndex, setFrameIndex] = useState(0);
  const [microMood, setMicroMood] = useState('base');
  const dragRef = useRef(null);
  const snapRef = useRef(ui.snapToEdge);

  useEffect(() => {
    snapRef.current = ui.snapToEdge;
  }, [ui.snapToEdge]);

  useEffect(() => {
    setUi((prev) => (prev.personality === defaultPersonality ? prev : { ...prev, personality: defaultPersonality || 'cold' }));
  }, [defaultPersonality]);

  useEffect(() => {
    if (!state?.memoryPatch) return;
    setUi((prev) => ({
      ...prev,
      memory: {
        ...prev.memory,
        ...state.memoryPatch,
      },
    }));
  }, [state?.memoryPatch]);

  useEffect(() => {
    saveCoachCatUi(ui);
  }, [ui]);

  const displayTone = resolveDisplayTone(state?.tone, microMood, state?.autonomy?.mode);
  const frames = useMemo(() => CAT_FRAMES[displayTone] || CAT_FRAMES.idle, [displayTone]);

  useEffect(() => {
    if (!visible) return undefined;
    const id = window.setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 320);
    return () => window.clearInterval(id);
  }, [frames.length, visible]);

  useEffect(() => {
    if (!visible) {
      setFrameIndex(0);
      setMicroMood('base');
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    setMicroMood('base');
    if (state?.autonomy?.mode === 'celebrate') {
      const id = window.setInterval(() => {
        setMicroMood((prev) => (prev === 'celebrate' ? 'base' : 'celebrate'));
      }, 520);
      return () => window.clearInterval(id);
    }
    if (state?.autonomy?.mode !== 'idle') return undefined;

    const schedule = () => {
      const nextDelay = state?.autonomy?.idleDurationSec >= 60 ? 3200 + Math.random() * 2200 : 4600 + Math.random() * 2600;
      const nextMood = Math.random() > 0.72 ? 'yawn' : 'blink';
      const timeoutId = window.setTimeout(() => {
        setMicroMood(nextMood);
        window.setTimeout(() => setMicroMood('base'), nextMood === 'yawn' ? 1200 : 420);
        schedule();
      }, nextDelay);
      return timeoutId;
    };

    const timeoutId = schedule();
    return () => window.clearTimeout(timeoutId);
  }, [state?.autonomy?.idleDurationSec, state?.autonomy?.mode, visible]);

  if (!visible) return null;

  const style = buildPositionStyle(ui.position);
  const toneClass = TONE_CLASS[state?.tone] || TONE_CLASS.idle;
  const accentClass = SKIN_ACCENT_CLASS[ui.skin] || SKIN_ACCENT_CLASS.lime;
  const shellStyle = {
    ...style,
    '--coach-cat-motion-speed': `${state?.motion?.speed || 1}s`,
    '--coach-cat-motion-scale': String(state?.motion?.amplitude || 1),
  };

  const startDrag = (event) => {
    const target = event.target;
    if (target.closest('button')) return;

    const rect = dragRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    const move = (moveEvent) => {
      const nextX = Math.max(8, Math.min(window.innerWidth - rect.width - 8, moveEvent.clientX - offsetX));
      const nextY = Math.max(8, Math.min(window.innerHeight - rect.height - 8, moveEvent.clientY - offsetY));
      setUi((prev) => ({ ...prev, position: { x: nextX, y: nextY } }));
    };

    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      if (!snapRef.current) return;
      setUi((prev) => ({ ...prev, position: snapPosition(prev.position, rect.width, rect.height) }));
      onMemoryChange?.({ lastInteractionAt: Date.now(), lastInteractionType: 'drag' });
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  if (ui.minimized) {
    return (
      <button
        type="button"
        onClick={() => {
          setUi((prev) => ({ ...prev, minimized: false }));
          onMemoryChange?.({ lastInteractionAt: Date.now(), lastInteractionType: 'restore' });
        }}
        className={`fixed z-40 pointer-events-auto rounded-full border px-4 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl coach-cat-shell ${toneClass} ${getToneAnimationClass(state?.tone, state?.motion?.intensity)}`}
        style={shellStyle}
      >
        <span className={`coach-cat-ascii text-[11px] leading-none ${accentClass}`}>{frames[frameIndex]}</span>
      </button>
    );
  }

  if (!ui.expanded) {
    return (
      <div className="fixed z-40 pointer-events-auto" style={shellStyle}>
        <div
          ref={dragRef}
          className={`flex items-center gap-3 rounded-full border px-4 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl coach-cat-shell ${toneClass} ${getToneAnimationClass(state?.tone, state?.motion?.intensity)}`}
        >
          <button type="button" onPointerDown={startDrag} className="cursor-grab active:cursor-grabbing">
            <span className={`coach-cat-ascii text-[11px] leading-none ${accentClass}`}>{frames[frameIndex]}</span>
          </button>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#a8b3a3]">{state?.badge || 'Coach Cat'}</p>
            <p className="max-w-[11rem] truncate text-xs text-[#d7ddd0]">{state?.message || 'Ready'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUi((prev) => ({ ...prev, expanded: true }));
                onMemoryChange?.({ lastInteractionAt: Date.now(), lastInteractionType: 'expand' });
              }}
              className="rounded-full border border-white/10 bg-black/15 px-2.5 py-1 text-xs text-[#d7ddd0] transition hover:bg-black/25"
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => {
                setUi((prev) => ({ ...prev, minimized: true }));
                onMemoryChange?.({ lastInteractionAt: Date.now(), lastInteractionType: 'minimize' });
              }}
              className="rounded-full border border-white/10 bg-black/15 px-2.5 py-1 text-xs text-[#d7ddd0] transition hover:bg-black/25"
            >
              Min
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed z-40 w-[min(21rem,calc(100vw-1rem))] pointer-events-auto" style={shellStyle}>
      <div
        ref={dragRef}
        className={`rounded-[1.5rem] border shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur-xl coach-cat-shell ${toneClass} ${getToneAnimationClass(state?.tone, state?.motion?.intensity)}`}
      >
        <div
          onPointerDown={startDrag}
          className="flex cursor-grab items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5 active:cursor-grabbing"
        >
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#a8b3a3]">Coach Cat</p>
            <p className="mt-1 text-xs text-[#bac4b7]">{state?.badge || 'Desktop Coach'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUi((prev) => ({ ...prev, snapToEdge: !prev.snapToEdge }));
                onMemoryChange?.({ lastInteractionAt: Date.now(), lastInteractionType: 'toggle-snap' });
              }}
              className={`rounded-full border px-2.5 py-1 text-xs transition ${ui.snapToEdge ? 'border-[#d4ff6a]/30 bg-[#d4ff6a]/10 text-[#d4ff6a]' : 'border-white/10 bg-black/15 text-[#d7ddd0] hover:bg-black/25'}`}
            >
              Snap
            </button>
            <button
              type="button"
              onClick={() => {
                setUi((prev) => ({ ...prev, expanded: false }));
                onMemoryChange?.({ lastInteractionAt: Date.now(), lastInteractionType: 'fold' });
              }}
              className="rounded-full border border-white/10 bg-black/15 px-2.5 py-1 text-xs text-[#d7ddd0] transition hover:bg-black/25"
            >
              Fold
            </button>
            <button
              type="button"
              onClick={() => {
                setUi((prev) => ({ ...prev, minimized: true }));
                onMemoryChange?.({ lastInteractionAt: Date.now(), lastInteractionType: 'minimize' });
              }}
              className="rounded-full border border-white/10 bg-black/15 px-2.5 py-1 text-xs text-[#d7ddd0] transition hover:bg-black/25"
            >
              Min
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <pre className={`coach-cat-ascii shrink-0 text-[11px] leading-[1.05] ${accentClass}`}>
            {frames[frameIndex]}
          </pre>
          <div className="min-w-0">
            <p className="text-sm font-medium">{state?.message}</p>
            {state?.caption ? <p className="mt-1 text-xs text-[#bac4b7]">{state.caption}</p> : null}
            {state?.footer ? <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-[#8f9a8d]">{state.footer}</p> : null}
          </div>
        </div>
        <div className="grid gap-3 border-t border-white/10 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {['lime', 'sky', 'ember'].map((skin) => (
              <button
                key={skin}
                type="button"
                onClick={() => {
                  setUi((prev) => ({ ...prev, skin }));
                  onMemoryChange?.({ lastInteractionAt: Date.now(), lastInteractionType: `skin:${skin}` });
                }}
                className={`rounded-full border px-3 py-1 text-xs transition ${ui.skin === skin ? 'border-white/20 bg-white/10 text-[#f2f5ef]' : 'border-white/8 bg-black/10 text-[#aeb7a8] hover:bg-black/20'}`}
              >
                {skin}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {['cold', 'cute', 'steady', 'strict'].map((personality) => (
              <button
                key={personality}
                type="button"
                onClick={() => {
                  setUi((prev) => ({ ...prev, personality }));
                  onPersonalityChange?.(personality);
                  onMemoryChange?.({ lastInteractionAt: Date.now(), lastInteractionType: `personality:${personality}` });
                }}
                className={`rounded-full border px-3 py-1 text-xs transition ${ui.personality === personality ? 'border-white/20 bg-white/10 text-[#f2f5ef]' : 'border-white/8 bg-black/10 text-[#aeb7a8] hover:bg-black/20'}`}
              >
                {PERSONALITY_LABEL[personality]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildPositionStyle(position) {
  return {
    right: position?.x === null ? '1.25rem' : 'auto',
    bottom: position?.y === null ? '1.25rem' : 'auto',
    left: position?.x === null ? 'auto' : `${position.x}px`,
    top: position?.y === null ? 'auto' : `${position.y}px`,
  };
}

function snapPosition(position, width, height) {
  const safeX = Number.isFinite(position?.x) ? position.x : null;
  const safeY = Number.isFinite(position?.y) ? position.y : null;
  if (safeX === null || safeY === null) return { x: null, y: null };

  const maxX = Math.max(8, window.innerWidth - width - 8);
  const maxY = Math.max(8, window.innerHeight - height - 8);
  const snapLeft = safeX < window.innerWidth / 2;
  return {
    x: snapLeft ? 8 : maxX,
    y: Math.max(8, Math.min(maxY, safeY)),
  };
}

function resolveDisplayTone(tone, microMood, autonomyMode) {
  if (autonomyMode === 'celebrate' && microMood === 'celebrate') return 'completeCelebrate';
  if (tone === 'idle' && microMood === 'blink') return 'idleBlink';
  if (tone === 'idle' && microMood === 'yawn') return 'idleYawn';
  return tone || 'idle';
}

function getToneAnimationClass(tone, intensity = 'steady') {
  const suffix = intensity === 'sharp' ? ' coach-cat-sharp' : intensity === 'burst' ? ' coach-cat-burst' : intensity === 'soft' ? ' coach-cat-soft' : '';
  if (tone === 'push') return `coach-cat-push${suffix}`;
  if (tone === 'recover') return `coach-cat-recover${suffix}`;
  if (tone === 'complete') return `coach-cat-complete${suffix}`;
  if (tone === 'hype') return `coach-cat-hype${suffix}`;
  if (tone === 'steady') return `coach-cat-steady${suffix}`;
  return `coach-cat-idle${suffix}`;
}
