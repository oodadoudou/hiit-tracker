export default function VisualGuide({ guide }) {
  return (
    <div>
      <h3 className="text-xl font-medium text-[#f2f5ef]">{guide.name}</h3>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {guide.images.map((src, index) => (
          <img
            key={`${src}-${index}`}
            src={src}
            alt={`${guide.name} ${index + 1}`}
            className="h-56 w-[22rem] flex-none rounded-[1.4rem] border border-white/10 bg-panel2 object-cover sm:h-64 sm:w-[26rem]"
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2 text-sm text-[#c3ccbe]">
        {guide.tips.map((tip) => (
          <li key={tip} className="rounded-xl bg-black/20 px-3 py-2">• {tip}</li>
        ))}
      </ul>
    </div>
  );
}
