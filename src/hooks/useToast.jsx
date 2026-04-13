import { useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);
  const show = (message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 2800);
  };
  const node = toast ? (
    <div className={`pointer-events-none fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-full border px-6 py-3 text-sm font-medium shadow-[0_24px_60px_rgba(0,0,0,0.4)] ${
      toast.type === 'error'
        ? 'border-[#ff8b2b]/30 bg-[rgba(40,22,10,0.94)] text-[#ffc490]'
        : 'border-[#d4ff6a]/25 bg-[rgba(18,22,20,0.94)] text-[#d4ff6a]'
    }`}>
      {toast.message}
    </div>
  ) : null;
  return { show, node };
}
