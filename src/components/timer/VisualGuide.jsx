export default function VisualGuide({ guide }) {
  return (
    <div>
      <h3 className="text-xl font-medium text-[#f2f5ef]">{guide.name}</h3>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)] lg:items-start">
        <div className="min-w-0 lg:col-span-2">
          <img
            src={guide.images[0]}
            alt={guide.name}
            className="h-56 w-full rounded-[1.4rem] border border-white/10 bg-panel2 object-contain sm:h-64"
          />
          <ul className="mt-4 space-y-2 text-sm text-[#c3ccbe]">
            {guide.tips.map((tip) => (
              <li key={tip} className="rounded-xl bg-black/20 px-3 py-2">• {tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
