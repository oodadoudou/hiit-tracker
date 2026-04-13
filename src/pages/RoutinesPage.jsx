import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../hooks/useToast';
import RoutineEditor from '../components/settings/RoutineEditor';
import ExerciseLibraryManager from '../components/settings/ExerciseLibraryManager';
import RoutineGeneratorCard from '../components/workout/RoutineGeneratorCard';
import { useAppContext } from '../context/AppContext';
import { FALLBACK_GUIDE_IMAGE } from '../utils/constants';
import { buildRoutineGeneratorLibrary, generateRoutineBatchFromLibrary, generateRoutineFromLibrary } from '../utils/routineGenerator';

function createBlankExercise() {
  return {
    name: '',
    imageUrl: FALLBACK_GUIDE_IMAGE,
    tipsText: 'Keep good form\nStay controlled',
    focus: 'general',
    jointLoad: 'medium',
    impactLevel: 'medium',
    tempo: 'steady',
    regression: 'reduce speed and use the easiest stable variation',
    breathingCue: '',
    commonMistakesText: '',
    workSecOverride: null,
    restSecOverride: null,
  };
}

function createBlankForm() {
  return {
    id: '',
    name: '',
    mode: 'finite',
    workSec: 40,
    restSec: 20,
    circuitRestSec: 45,
    circuits: 3,
    exercises: [createBlankExercise()],
  };
}

function createGeneratorForm() {
  return {
    baseName: '',
    targets: [],
    requiredTags: [],
    allowedTempos: [],
    allowedDifficulties: [],
    allowedEquipment: [],
    exerciseCount: 6,
    routineCount: 1,
  };
}

export default function RoutinesPage() {
  const { state, saveRoutine, deleteRoutine, setSelectedRoutine, saveExerciseToLibrary } = useAppContext();
  const selectedRoutine = useMemo(
    () => state.routines.find((routine) => routine.id === state.selectedRoutineId),
    [state.routines, state.selectedRoutineId],
  );
  const generatorLibrary = useMemo(() => buildRoutineGeneratorLibrary(), []);
  const [form, setForm] = useState(() => (selectedRoutine ? toForm(selectedRoutine) : createBlankForm()));
  const [generatorOptions, setGeneratorOptions] = useState(createGeneratorForm);
  const [generatorStatus, setGeneratorStatus] = useState('');
  const [generatedRoutines, setGeneratedRoutines] = useState([]);
  const toast = useToast();

  // Generator presets (saved in localStorage)
  const [generatorPresets, setGeneratorPresets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('generator-presets') || '[]'); } catch { return []; }
  });

  const routineStats = useMemo(() => {
    if (!form.id || !state.workoutHistory?.length) return null;
    const entries = state.workoutHistory.filter((h) => h.routineId === form.id);
    if (!entries.length) return null;
    const count = entries.length;
    const avgCal = Math.round(entries.reduce((s, h) => s + (h.caloriesBurned || 0), 0) / count);
    const maxDurMin = Math.round(Math.max(...entries.map((h) => h.totalDurationSec || 0)) / 60);
    return { count, avgCal, maxDurMin };
  }, [form.id, state.workoutHistory]);

  useEffect(() => {
    setForm(selectedRoutine ? toForm(selectedRoutine) : createBlankForm());
  }, [selectedRoutine]);

  const handleSelect = (id) => {
    const routine = state.routines.find((item) => item.id === id);
    setSelectedRoutine(id);
    setForm(routine ? toForm(routine) : createBlankForm());
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleExerciseChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, exerciseIndex) => (
        exerciseIndex === index ? { ...exercise, [field]: value } : exercise
      )),
    }));
  };

  const handleExerciseReplace = (index, newData) => {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, exerciseIndex) => (
        exerciseIndex === index ? { ...exercise, ...newData } : exercise
      )),
    }));
  };

  const handleExerciseAdd = () => {
    setForm((prev) => ({ ...prev, exercises: [...prev.exercises, createBlankExercise()] }));
  };

  const handleExerciseRemove = (index) => {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, exerciseIndex) => exerciseIndex !== index),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = saveRoutine(toRoutinePayload(form));
    if (!result?.ok) {
      toast.show('Routine is invalid. Add a name and at least one valid exercise.', 'error');
      return;
    }
    // Auto-save named exercises to library (dedup by name handled in context)
    form.exercises.forEach((ex) => {
      if (!ex.name) return;
      saveExerciseToLibrary({
        name: ex.name,
        category: ex.focus || 'general',
        imageUrl: ex.imageUrl || '',
        tips: (ex.tipsText || '').split('\n').filter((t) => t.trim()),
        tempo: ex.tempo || 'steady',
        difficulty: ex.impactLevel === 'high' ? 'hard' : ex.impactLevel === 'low' ? 'easy' : 'medium',
      });
    });
    toast.show('Routine saved.');
  };

  const handleDelete = () => {
    if (!form.id) return;
    const result = deleteRoutine(form.id);
    if (!result?.ok) {
      if (result?.reason === 'builtin-routine') {
        toast.show('Built-in routines can be edited but cannot be deleted.', 'error');
        return;
      }
      toast.show('At least one routine must remain.', 'error');
      return;
    }
  };

  const toggleTarget = (target) => {
    setGeneratorOptions((prev) => ({
      ...prev,
      targets: prev.targets.includes(target)
        ? prev.targets.filter((item) => item !== target)
        : [...prev.targets, target],
    }));
  };

  const toggleTag = (tag) => {
    setGeneratorOptions((prev) => ({
      ...prev,
      requiredTags: prev.requiredTags.includes(tag)
        ? prev.requiredTags.filter((item) => item !== tag)
        : [...prev.requiredTags, tag],
    }));
  };

  const updateGeneratorOption = (field, value) => {
    if (field === 'toggleAllowedTempos' || field === 'toggleAllowedDifficulties' || field === 'toggleAllowedEquipment') {
      const targetField = field === 'toggleAllowedTempos'
        ? 'allowedTempos'
        : field === 'toggleAllowedDifficulties'
          ? 'allowedDifficulties'
          : 'allowedEquipment';
      setGeneratorOptions((prev) => ({
        ...prev,
        [targetField]: prev[targetField].includes(value)
          ? prev[targetField].filter((item) => item !== value)
          : [...prev[targetField], value],
      }));
      return;
    }
    setGeneratorOptions((prev) => ({
      ...prev,
      [field]: field === 'exerciseCount'
        ? Math.max(3, Math.min(12, Number(value) || 6))
        : field === 'routineCount'
          ? Math.max(1, Math.min(8, Number(value) || 1))
          : value,
    }));
  };

  const handleSavePreset = (name) => {
    if (!name.trim()) return;
    const preset = { name: name.trim(), options: { ...generatorOptions } };
    const next = [...generatorPresets.filter((p) => p.name !== preset.name), preset];
    setGeneratorPresets(next);
    try { localStorage.setItem('generator-presets', JSON.stringify(next)); } catch { /* storage full */ }
  };

  const handleLoadPreset = (preset) => {
    setGeneratorOptions(preset.options);
  };

  const handleDeletePreset = (name) => {
    const next = generatorPresets.filter((p) => p.name !== name);
    setGeneratorPresets(next);
    try { localStorage.setItem('generator-presets', JSON.stringify(next)); } catch { /* storage full */ }
  };

  const handleGenerate = () => {
    const result = generateRoutineBatchFromLibrary({
      library: generatorLibrary,
      ...generatorOptions,
    });

    if (!result.ok) {
      setGeneratedRoutines([]);
      setGeneratorStatus(
        result.reason === 'not-enough-matches'
          ? `当前筛选只匹配到 ${result.matches} 个动作，数量不够。放宽条件后再试。`
          : '没有足够的不重复动作来生成这套训练。',
      );
      return;
    }

    const saved = [];
    for (const routine of result.routines) {
      const saveResult = saveRoutine(routine);
      if (saveResult?.ok) saved.push(saveResult.routine);
    }

    if (!saved.length) {
      setGeneratedRoutines([]);
      setGeneratorStatus('生成成功，但保存训练失败。请检查动作数据后再试。');
      return;
    }

    setGeneratedRoutines(saved);
    setGeneratorStatus(
      saved.length < result.requestedCount
        ? `已生成 ${saved.length} 套可区分的套路。当前筛选下暂时凑不出更多不重复组合。`
        : '',
    );
    handleSelect(saved[0].id);
  };

  const handleRerollRoutine = (routineId) => {
    const current = generatedRoutines.find((routine) => routine.id === routineId);
    if (!current) return;

    const result = generateRoutineFromLibrary({
      library: generatorLibrary,
      ...generatorOptions,
      baseName: current.name,
      excludeSignatures: generatedRoutines
        .map((routine) => routine.exercises.map((exercise) => exercise.name).sort().join('|')),
    });

    if (!result.ok || !result.routine) {
      setGeneratorStatus('当前筛选下没有足够的新组合来替换这一套。');
      return;
    }

    const replacement = {
      ...result.routine,
      id: current.id,
      name: current.name,
    };
    const saveResult = saveRoutine(replacement);
    if (!saveResult?.ok) {
      setGeneratorStatus('重新生成成功，但保存替换失败。');
      return;
    }

    setGeneratedRoutines((prev) => prev.map((routine) => (routine.id === routineId ? saveResult.routine : routine)));
    setGeneratorStatus('');
    handleSelect(saveResult.routine.id);
  };

  const handleCreateVariant = (routineId) => {
    const current = generatedRoutines.find((routine) => routine.id === routineId);
    if (!current) return;

    const result = generateRoutineFromLibrary({
      library: generatorLibrary,
      ...generatorOptions,
      baseName: `${current.name} Variant`,
      excludeSignatures: generatedRoutines
        .map((routine) => routine.exercises.map((exercise) => exercise.name).sort().join('|')),
    });

    if (!result.ok || !result.routine) {
      setGeneratorStatus('当前筛选下没有足够的新组合来生成变体。');
      return;
    }

    const saveResult = saveRoutine(result.routine);
    if (!saveResult?.ok) {
      setGeneratorStatus('变体生成成功，但保存失败。');
      return;
    }

    setGeneratedRoutines((prev) => [...prev, saveResult.routine]);
    setGeneratorStatus('');
    handleSelect(saveResult.routine.id);
  };

  return (
    <div className="space-y-4">
      {toast.node}
      <RoutineGeneratorCard
        options={generatorOptions}
        onToggleTarget={toggleTarget}
        onToggleTag={toggleTag}
        onOptionChange={updateGeneratorOption}
        onGenerate={handleGenerate}
        generatedRoutines={generatedRoutines}
        generatorStatus={generatorStatus}
        onSelectRoutine={handleSelect}
        selectedRoutineId={form.id}
        onRerollRoutine={handleRerollRoutine}
        onCreateVariant={handleCreateVariant}
        presets={generatorPresets}
        onSavePreset={handleSavePreset}
        onLoadPreset={handleLoadPreset}
        onDeletePreset={handleDeletePreset}
      />
      <RoutineEditor
        form={form}
        onFieldChange={handleFieldChange}
        onExerciseChange={handleExerciseChange}
        onExerciseReplace={handleExerciseReplace}
        onExerciseAdd={handleExerciseAdd}
        onExerciseRemove={handleExerciseRemove}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        routines={state.routines}
        selectedId={form.id}
        onSelect={handleSelect}
        onNew={() => setForm(createBlankForm())}
        routineStats={routineStats}
      />
      <ExerciseLibraryManager />
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
    exercises: Array.isArray(routine.exercises) && routine.exercises.length
      ? routine.exercises.map((exercise) => ({
        name: exercise.name || '',
        imageUrl: exercise.images?.[0] || FALLBACK_GUIDE_IMAGE,
        tipsText: Array.isArray(exercise.tips) ? exercise.tips.join('\n') : '',
        focus: exercise.focus || 'general',
        jointLoad: exercise.jointLoad || 'medium',
        impactLevel: exercise.impactLevel || 'medium',
        tempo: exercise.tempo || 'steady',
        regression: exercise.regression || '',
        breathingCue: exercise.breathingCue || '',
        commonMistakesText: Array.isArray(exercise.commonMistakes) ? exercise.commonMistakes.join('\n') : '',
        workSecOverride: exercise.workSecOverride ?? null,
        restSecOverride: exercise.restSecOverride ?? null,
      }))
      : [createBlankExercise()],
  };
}

function toRoutinePayload(form) {
  return {
    id: form.id || crypto.randomUUID(),
    name: String(form.name || '').trim(),
    mode: form.mode,
    workSec: Number(form.workSec),
    restSec: Number(form.restSec),
    circuitRestSec: Number(form.circuitRestSec),
    circuits: Number(form.circuits),
    exercises: form.exercises.map((exercise) => ({
      name: String(exercise.name || '').trim(),
      images: [String(exercise.imageUrl || FALLBACK_GUIDE_IMAGE).trim()].filter(Boolean),
      tips: String(exercise.tipsText || '').split('\n').map((item) => item.trim()).filter(Boolean),
      commonMistakes: String(exercise.commonMistakesText || '').split('\n').map((item) => item.trim()).filter(Boolean),
      breathingCue: String(exercise.breathingCue || '').trim(),
      focus: exercise.focus,
      jointLoad: exercise.jointLoad,
      impactLevel: exercise.impactLevel,
      tempo: exercise.tempo,
      regression: String(exercise.regression || '').trim(),
      workSecOverride: exercise.workSecOverride != null ? Math.max(5, Number(exercise.workSecOverride)) : null,
      restSecOverride: exercise.restSecOverride != null ? Math.max(0, Number(exercise.restSecOverride)) : null,
    })),
  };
}
