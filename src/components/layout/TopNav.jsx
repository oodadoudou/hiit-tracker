export default function TopNav({ page, onChange }) {
  const items = ['workout', 'dashboard', 'history', 'settings'];
  return (
    <nav className="sticky top-0 z-30 border-b border-white/10 bg-[rgba(13,17,15,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={page === item
              ? 'min-w-[96px] rounded-full bg-[#d4ff6a] px-4 py-2.5 text-center text-sm font-semibold text-black'
              : 'min-w-[96px] rounded-full px-4 py-2.5 text-center text-sm font-medium text-[#c7d0c2] transition hover:bg-white/5 hover:text-white'}
          >
            {item === 'workout' ? 'Workout' : item === 'dashboard' ? 'Dashboard' : item === 'history' ? 'History' : 'Settings'}
          </button>
        ))}
      </div>
    </nav>
  );
}
