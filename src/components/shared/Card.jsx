export default function Card({ title, subtitle, children, className = '' }) {
  return (
    <section className={`rounded-[2rem] border border-white/10 bg-[rgba(20,25,22,0.82)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-6 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-5">
          {subtitle ? <p className="text-[11px] uppercase tracking-[0.35em] text-[#9aa394]">{subtitle}</p> : null}
          {title ? <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f2f5ef]">{title}</h2> : null}
        </div>
      )}
      {children}
    </section>
  );
}
