import { useEffect, useMemo, useState } from 'react';
import JsonManager from '../components/settings/JsonManager';
import RoutineEditor from '../components/settings/RoutineEditor';
import SettingsForm from '../components/settings/SettingsForm';
import { useAppContext } from '../context/AppContext';

function createBlankForm() {
  return {
    id: '',
    name: '',
    mode: 'infinite',
    workSec: 40,
    restSec: 20,
    circuitRestSec: 0,
    circuits: 1,
    exercisesJson: JSON.stringify([{ name: 'Exercise', images: ['https://via.placeholder.com/640x360?text=Exercise'], tips: ['Tip 1', 'Tip 2'] }], null, 2),
  };
}

export default function SettingsPage() {
  const { state, estimatedMetabolism, saveRoutine, deleteRoutine, exportState, importState, updateUserSettings } = useAppContext();
  const selectedRoutine = useMemo(() => state.routines.find((routine) => routine.id === state.selectedRoutineId), [state.routines, state.selectedRoutineId]);
  const [form, setForm] = useState(() => selectedRoutine ? toForm(selectedRoutine) : createBlankForm());

  useEffect(() => {
    setForm(selectedRoutine ? toForm(selectedRoutine) : createBlankForm());
  }, [selectedRoutine]);

  const handleSelect = (id) => {
    const routine = state.routines.find((item) => item.id === id);
    setForm(routine ? toForm(routine) : createBlankForm());
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    try {
      saveRoutine({
        id: form.id || crypto.randomUUID(),
        name: form.name,
        mode: form.mode,
        workSec: Number(form.workSec),
        restSec: Number(form.restSec),
        circuitRestSec: Number(form.circuitRestSec),
        circuits: Number(form.circuits),
        exercises: JSON.parse(form.exercisesJson),
      });
      alert('Routine saved.');
    } catch (error) {
      console.error(error);
      alert('Routine JSON is invalid.');
    }
  };

  const handleDelete = () => {
    if (!form.id) return;
    deleteRoutine(form.id);
    setForm(createBlankForm());
  };

  const handleExport = () => {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'hiit-tracker-full-backup.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importState(String(reader.result));
        alert('Import completed.');
      } catch (error) {
        console.error(error);
        alert('Import failed.');
      }
    };
    reader.readAsText(file);
  };

  const handleSettingsChange = (event) => {
    updateUserSettings({ [event.target.name]: Number(event.target.value) || 0 });
  };

  return (
    <div className="space-y-4">
        <RoutineEditor form={form} onChange={handleChange} onSubmit={handleSubmit} onDelete={handleDelete} routines={state.routines} selectedId={form.id} onSelect={handleSelect} onNew={() => setForm(createBlankForm())} />
      <div className="grid gap-4 lg:grid-cols-2">
        <SettingsForm settings={state.userSettings} estimatedMetabolism={estimatedMetabolism} onChange={handleSettingsChange} />
        <JsonManager onExport={handleExport} onImport={handleImport} />
      </div>
    </div>
  );
}

function toForm(routine) {
  return {
    id: routine.id,
    name: routine.name,
    mode: routine.mode,
    workSec: routine.workSec,
    restSec: routine.restSec,
    circuitRestSec: routine.circuitRestSec,
    circuits: routine.circuits,
    exercisesJson: JSON.stringify(routine.exercises, null, 2),
  };
}
