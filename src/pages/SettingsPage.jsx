import { useEffect, useState } from 'react';
import SettingsForm from '../components/settings/SettingsForm';
import { useAppContext } from '../context/AppContext';

export default function SettingsPage() {
  const { state, estimatedMetabolism, updateUserSettings } = useAppContext();
  const [settingsDraft, setSettingsDraft] = useState(() => toSettingsDraft(state.userSettings));

  useEffect(() => {
    setSettingsDraft(toSettingsDraft(state.userSettings));
  }, [state.userSettings]);

  const handleSettingsDraftChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setSettingsDraft((prev) => ({ ...prev, [name]: nextValue }));
    if (type === 'checkbox' || ['coachStyle', 'coachPromptFrequency', 'warmupPreference'].includes(name)) {
      updateUserSettings({ [name]: nextValue });
    }
  };

  const commitSettingsField = (name, options = {}) => {
    const nextValue = parseNumericDraft(settingsDraft[name], state.userSettings[name], options);
    updateUserSettings({ [name]: nextValue });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[2rem] border border-white/10 bg-[rgba(18,22,20,0.82)] px-5 py-5 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:px-7">
        <p className="text-[11px] uppercase tracking-[0.35em] text-[#9aa394]">Profile</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f2f5ef]">Personal Settings</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#aeb7a8]">
          Body data, coach style, and prompt preferences. Routine editing and generator are on the Routines page. Import / export is on the Data page.
        </p>
      </div>
      <SettingsForm
        settings={settingsDraft}
        estimatedMetabolism={estimatedMetabolism}
        onChange={handleSettingsDraftChange}
        onCommit={commitSettingsField}
      />
    </div>
  );
}

function toSettingsDraft(settings) {
  return {
    age: String(settings.age ?? ''),
    heightCm: String(settings.heightCm ?? ''),
    weightKg: String(settings.weightKg ?? ''),
    calorieGoal: String(settings.calorieGoal ?? ''),
    coachStyle: settings.coachStyle || 'cold',
    enableCoachCat: Boolean(settings.enableCoachCat),
    enableEncouragementAudio: settings.enableEncouragementAudio !== false,
    coachPromptFrequency: settings.coachPromptFrequency || 'balanced',
    warmupPreference: settings.warmupPreference || 'minimal',
    minimumSavedWorkoutSec: String(settings.minimumSavedWorkoutSec ?? 120),
  };
}

function parseNumericDraft(rawValue, fallbackValue, { min = 0, allowFloat = false } = {}) {
  if (rawValue === '') return fallbackValue;
  const parsed = allowFloat ? Number.parseFloat(rawValue) : Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed)) return fallbackValue;
  return Math.max(min, allowFloat ? parsed : Math.round(parsed));
}
