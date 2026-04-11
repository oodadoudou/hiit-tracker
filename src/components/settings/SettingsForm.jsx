export default function SettingsForm({ settings, estimatedMetabolism, onChange }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[rgba(20,25,22,0.82)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-6">
      <p className="text-[11px] uppercase tracking-[0.35em] text-[#9aa394]">User</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f2f5ef]">Body Data</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Age</label>
          <input name="age" value={settings.age} onChange={onChange} type="number" min="18" className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none" />
        </div>
        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Height</label>
          <input name="heightCm" value={settings.heightCm} onChange={onChange} type="number" min="120" className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none" />
        </div>
        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Weight</label>
          <input name="weightKg" value={settings.weightKg} onChange={onChange} type="number" min="30" step="0.1" className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none" />
        </div>
        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Calorie Goal</label>
          <input name="calorieGoal" value={settings.calorieGoal} onChange={onChange} type="number" min="0" className="w-full rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-3 outline-none" />
        </div>
      </div>
      <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Estimated Daily Metabolism</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#f2f5ef]">{estimatedMetabolism} kcal</p>
        <p className="mt-2 text-sm text-[#aeb7a8]">Based on Mifflin-St Jeor formula, female profile.</p>
      </div>
    </div>
  );
}
