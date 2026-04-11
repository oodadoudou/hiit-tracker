export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[rgba(20,25,22,0.95)] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl" onClick={(event) => event.stopPropagation()}>
        {title ? <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[#f2f5ef]">{title}</h3> : null}
        {children}
      </div>
    </div>
  );
}
