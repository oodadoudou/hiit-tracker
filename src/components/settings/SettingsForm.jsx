export default function SettingsForm({ settings, estimatedMetabolism, onChange, onCommit }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[rgba(20,25,22,0.82)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-6">
      <p className="text-[11px] uppercase tracking-[0.35em] text-[#9aa394]">User</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f2f5ef]">Body Data</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Age</label>
          <input name="age" value={settings.age} onChange={onChange} onBlur={() => onCommit('age', { min: 18 })} type="number" min="18" className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none" />
        </div>
        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Height</label>
          <input name="heightCm" value={settings.heightCm} onChange={onChange} onBlur={() => onCommit('heightCm', { min: 120 })} type="number" min="120" className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none" />
        </div>
        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Weight</label>
          <input name="weightKg" value={settings.weightKg} onChange={onChange} onBlur={() => onCommit('weightKg', { min: 30, allowFloat: true })} type="number" min="30" step="0.1" className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none" />
        </div>
        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Calorie Goal</label>
          <input name="calorieGoal" value={settings.calorieGoal} onChange={onChange} onBlur={() => onCommit('calorieGoal', { min: 0 })} type="number" min="0" className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none" />
        </div>
      </div>
      <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Estimated Daily Metabolism</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#f2f5ef]">{estimatedMetabolism} kcal</p>
        <p className="mt-2 text-sm text-[#aeb7a8]">Based on Mifflin-St Jeor formula, female profile.</p>
      </div>
      <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-[#222925] px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Coach Feedback</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Coach Style</label>
            <select name="coachStyle" value={settings.coachStyle} onChange={onChange} className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none [color-scheme:dark]">
              <option value="cold">Cold</option>
              <option value="cute">Cute</option>
              <option value="steady">Steady</option>
              <option value="strict">Strict</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Reminder Pace</label>
            <select name="coachPromptFrequency" value={settings.coachPromptFrequency} onChange={onChange} className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none [color-scheme:dark]">
              <option value="light">Light</option>
              <option value="balanced">Balanced</option>
              <option value="active">Active</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Warmup Reminders</label>
            <select name="warmupPreference" value={settings.warmupPreference} onChange={onChange} className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none [color-scheme:dark]">
              <option value="minimal">Minimal</option>
              <option value="full">Full</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Min Saved Workout</label>
            <input name="minimumSavedWorkoutSec" value={settings.minimumSavedWorkoutSec} onChange={onChange} onBlur={() => onCommit('minimumSavedWorkoutSec', { min: 0 })} type="number" min="0" step="30" className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none" />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <label className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-white/8 bg-black/15 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#f2f5ef]">Enable Coach Cat</p>
              <p className="mt-1 text-xs text-[#9ca69a]">Show the floating ASCII cat encouragement bubble during training.</p>
            </div>
            <input
              name="enableCoachCat"
              type="checkbox"
              checked={settings.enableCoachCat}
              onChange={onChange}
              className="h-5 w-5 accent-[#d4ff6a]"
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-white/8 bg-black/15 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#f2f5ef]">Enable Encouragement Audio</p>
              <p className="mt-1 text-xs text-[#9ca69a]">Keep motivational tones in addition to the base timer countdown cues.</p>
            </div>
            <input
              name="enableEncouragementAudio"
              type="checkbox"
              checked={settings.enableEncouragementAudio}
              onChange={onChange}
              className="h-5 w-5 accent-[#d4ff6a]"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
