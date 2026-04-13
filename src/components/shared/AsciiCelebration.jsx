import { useEffect, useMemo, useState } from 'react';

const FRAMES = [
  [
    "   *     .    '    *",
    "      .  .-=========-.  .",
    "  *      \\'-=======-'/      *",
    "        _|   .=.   |_",
    "       ((|  {{1}}  |))",
    "        \\|   /|\\   |/",
    "         \\__ '`' __/",
    "           _`) (`_",
    "         _/_______\\_",
  ].join('\n'),
  [
    " .   *    '   .   * ",
    "    *  .-=========-.   .",
    "       \\'-=======-'/   *",
    "   .   _|   .=.   |_     .",
    "      ((|  {{1}}  |))  *",
    "       \\|   /|\\   |/    .",
    "        \\__ '`' __/  *",
    "          _`) (`_",
    "        _/_______\\_",
  ].join('\n'),
  [
    "   '   .   *    .   ",
    " .    .-=========-.    *",
    "   *   \\'-=======-'/  .",
    "      _|   .=.   |_   *",
    "   . ((|  {{1}}  |))    .",
    "      \\|   /|\\   |/  *",
    "   *   \\__ '`' __/   .",
    "         _`) (`_   *",
    "       _/_______\\_",
  ].join('\n'),
  [
    " *    .   '    *   .",
    "    .-=========-.   .   *",
    " .   \\'-=======-'/     .",
    "   * _|   .=.   |_  *",
    "     ((|  {{1}}  |))   .",
    "  .   \\|   /|\\   |/  *",
    "      \\__ '`' __/    .",
    "   *    _`) (`_   *",
    "      _/_______\\_",
  ].join('\n'),
];

export default function AsciiCelebration({ open }) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    setFrameIndex(0);
    const intervalId = window.setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % FRAMES.length);
    }, 120);
    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
    }, 1600);
    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [open]);

  const text = useMemo(() => FRAMES[frameIndex] || FRAMES[0], [frameIndex]);

  if (!open) return null;
  return (
    <div className="mt-3 rounded-[1.4rem] border border-[#d4ff6a]/15 bg-[#d4ff6a]/[0.06] px-4 py-3">
      <pre className="select-none whitespace-pre font-mono text-[11px] leading-[1.15] text-[#d4ff6a]">
        {text}
      </pre>
    </div>
  );
}

