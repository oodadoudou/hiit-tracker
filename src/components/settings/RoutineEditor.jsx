import { useEffect, useState } from 'react';
import Modal from '../shared/Modal';
import { useAppContext } from '../../context/AppContext';

const FOCUS_OPTIONS = ['general', 'cardio', 'upper', 'core', 'legs', 'recovery'];
const LEVEL_OPTIONS = ['low', 'medium', 'high'];
const TEMPO_OPTIONS = ['slow', 'controlled', 'steady', 'rhythmic'];

export default function RoutineEditor({
  form,
  onFieldChange,
  onExerciseChange,
  onExerciseReplace,
  onExerciseAdd,
  onExerciseRemove,
  onSubmit,
  onDelete,
  routines,
  selectedId,
  onSelect,
  onNew,
  routineStats,
}) {
  const { state, deleteExerciseFromLibrary } = useAppContext();
  const [browsingIndex, setBrowsingIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', ...FOCUS_OPTIONS];

  const filteredLibrary = (state.exerciseLibrary || []).filter((ex) => {
    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    const matchesSearch = (ex.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLibrarySelect = (libEx) => {
    if (browsingIndex === null) return;

    onExerciseReplace(browsingIndex, {
      name: libEx.name || '',
      imageUrl: libEx.imageUrl || '',
      tipsText: Array.isArray(libEx.tips) ? libEx.tips.join('\n') : '',
      focus: libEx.category || 'general',
      tempo: libEx.tempo || 'steady',
      impactLevel: libEx.difficulty === 'hard' ? 'high' : libEx.difficulty === 'easy' ? 'low' : 'medium',
    });

    setBrowsingIndex(null);
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const handleDeleteFromLibrary = (e, name) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${name}" from your library?`)) {
      deleteExerciseFromLibrary(name);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
      <div className="rounded-[2rem] border border-white/10 bg-[rgba(20,25,22,0.82)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#9aa394]">Routines</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f2f5ef]">Routine Builder</h2>
          </div>
          <button type="button" onClick={onNew} className="rounded-full bg-[#d4ff6a] px-4 py-3 font-semibold text-black">New</button>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Routine</label>
          <select value={selectedId || ''} onChange={(event) => onSelect(event.target.value)} className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none [color-scheme:dark]">
            <option value="">New routine</option>
            {routines.map((routine) => <option key={routine.id} value={routine.id}>{routine.name}</option>)}
          </select>
          {routineStats && routineStats.count > 0 && (
            <div className="mt-2 flex flex-wrap gap-3 rounded-[1.2rem] border border-white/8 bg-white/3 px-4 py-2.5 text-xs text-[#8d9688]">
              <span>已完成 <span className="font-semibold text-[#f2f5ef]">{routineStats.count}</span> 次</span>
              <span>平均 <span className="font-semibold text-[#d4ff6a]">{routineStats.avgCal} kcal</span></span>
              <span>最长 <span className="font-semibold text-[#f2f5ef]">{routineStats.maxDurMin} 分钟</span></span>
            </div>
          )}
        </div>

        <form className="mt-4 space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={onFieldChange}
              className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Mode</label>
              <select name="mode" value={form.mode} onChange={onFieldChange} className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none [color-scheme:dark]">
                <option value="infinite">Infinite</option>
                <option value="finite">Finite</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Circuits</label>
              {form.mode === 'infinite'
                ? <div className="flex w-full items-center rounded-[1.4rem] border border-white/8 bg-white/[0.02] px-4 py-3 text-lg font-semibold text-[#5a6358]">∞</div>
                : <input name="circuits" type="number" min="1" value={form.circuits} onChange={onFieldChange} className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none" />}
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Work Sec</label>
              <TimeField name="workSec" min="5" value={form.workSec} onChange={onFieldChange} />
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Rest Sec</label>
              <TimeField name="restSec" min="0" value={form.restSec} onChange={onFieldChange} />
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Circuit Rest</label>
              <TimeField name="circuitRestSec" min="0" value={form.circuitRestSec} onChange={onFieldChange} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Exercises</p>
                <p className="mt-1 text-sm text-[#aeb7a8]">Build the routine exercise by exercise instead of editing raw JSON.</p>
              </div>
              <button
                type="button"
                onClick={onExerciseAdd}
                className="rounded-full border border-[#d4ff6a]/25 bg-[#d4ff6a]/10 px-4 py-2 text-sm font-semibold text-[#d4ff6a]"
              >
                Add Exercise
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {form.exercises.map((exercise, index) => (
                <ExerciseCard
                  key={index}
                  exercise={exercise}
                  index={index}
                  onChange={onExerciseChange}
                  onBrowse={() => setBrowsingIndex(index)}
                  onRemove={onExerciseRemove}
                  canRemove={form.exercises.length > 1}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="submit" className="rounded-full bg-[#d4ff6a] px-4 py-4 font-semibold text-black">Save Routine</button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full bg-[#ff8b2b] px-4 py-4 font-semibold text-black"
            >
              Delete
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-[rgba(20,25,22,0.82)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.35em] text-[#9aa394]">Guide</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f2f5ef]">Routine Structure</h2>
        <div className="mt-4 space-y-4 text-sm text-[#c3ccbe]">
          <div className="rounded-[1.4rem] bg-[#222925] p-4">
            <p className="font-medium text-[#f2f5ef]">Recommended workflow</p>
            <ul className="mt-3 space-y-2">
              <li>1. Set the overall routine timing first.</li>
              <li>2. Add exercises in the order they should play.</li>
              <li>3. Use one image URL per exercise to keep the guide stable.</li>
              <li>4. Put one tip or mistake per line for cleaner cards.</li>
            </ul>
          </div>
          <div className="rounded-[1.4rem] bg-[#222925] p-4">
            <p className="font-medium text-[#f2f5ef]">Fields used by the app</p>
            <ul className="mt-3 space-y-2">
              <li>`focus`, `jointLoad`, `impactLevel`, and `tempo` drive readiness guidance.</li>
              <li>`regression` is shown when the app wants a safer variation.</li>
              <li>`breathingCue` and `commonMistakes` show up in the live visual guide.</li>
            </ul>
          </div>
        </div>
      </div>

      <Modal
        open={browsingIndex !== null}
        title="Exercise Library"
        onClose={() => {
          setBrowsingIndex(null);
          setSearchQuery('');
          setSelectedCategory('all');
        }}
      >
        <div className="mt-4 space-y-4">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none"
            />
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selectedCategory === cat
                      ? 'border-[#d4ff6a]/40 bg-[#d4ff6a]/15 text-[#d4ff6a]'
                      : 'border-white/10 bg-white/5 text-[#9aa394] hover:border-white/20'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[50vh] overflow-y-auto pr-2">
            <div className="grid gap-2 sm:grid-cols-2">
              {filteredLibrary.map((ex) => (
                <div key={ex.name} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleLibrarySelect(ex)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-left transition hover:border-[#d4ff6a]/20 hover:bg-[#d4ff6a]/5"
                  >
                    <img
                      src={ex.imageUrl}
                      alt={ex.name}
                      className="h-12 w-12 shrink-0 rounded-lg bg-black/20 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[#f2f5ef]">{ex.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#9aa394]">
                          {ex.category}
                        </span>
                        {ex.difficulty && (
                          <span className="rounded-full bg-[#d4ff6a]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#d4ff6a]">
                            {ex.difficulty}
                          </span>
                        )}
                        {!ex.isBuiltin && (
                          <span className="rounded-full bg-[#ff8b2b]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#ff8b2b]">
                            custom
                          </span>
                        )}
                        {Array.isArray(ex.tags) && ex.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full bg-white/3 px-2 py-0.5 text-[10px] text-[#5a6358]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                  {!ex.isBuiltin && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteFromLibrary(e, ex.name)}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#ff8b2b]/10 text-[#ff8b2b] opacity-0 transition group-hover:opacity-100 hover:bg-[#ff8b2b]/20"
                      title="Delete from library"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {filteredLibrary.length === 0 && (
              <p className="py-8 text-center text-sm text-[#8d9688]">
                No exercises found matching your filters.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ExerciseCard({ exercise, index, onChange, onBrowse, onRemove, canRemove }) {
  const [expanded, setExpanded] = useState(false);
  const hasCustomTiming = exercise.workSecOverride != null || exercise.restSecOverride != null;
  const displayName = exercise.name || `Exercise ${index + 1}`;

  const handleTimingToggle = (useCustom) => {
    if (!useCustom) {
      onChange(index, 'workSecOverride', null);
      onChange(index, 'restSecOverride', null);
    } else {
      onChange(index, 'workSecOverride', exercise.workSecOverride ?? 40);
      onChange(index, 'restSecOverride', exercise.restSecOverride ?? 20);
    }
  };

  // Clamp to min on blur so the displayed value snaps to a valid number
  const clampOnBlur = (field, e) => {
    const minVal = field === 'workSecOverride' ? 5 : 0;
    const raw = Number(e.target.value);
    const clamped = Number.isFinite(raw) && e.target.value !== '' ? Math.max(minVal, raw) : minVal;
    onChange(index, field, clamped);
  };

  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-[#222925]">
      {/* Collapsed header — always visible */}
      <div
        className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-xs tabular-nums text-[#8d9688]">{index + 1}</span>
          <span className="truncate text-sm font-semibold text-[#f2f5ef]">{displayName}</span>
          {hasCustomTiming && (
            <span className="shrink-0 rounded-full bg-[#d4ff6a]/15 px-2 py-0.5 text-[10px] font-semibold text-[#d4ff6a]">Custom Timing</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onBrowse}
              className="rounded-full border border-[#d4ff6a]/30 bg-[#d4ff6a]/10 px-2.5 py-1 text-xs font-semibold text-[#d4ff6a]"
            >
              Browse
            </button>
            {canRemove ? (
              <button type="button" onClick={() => onRemove(index)} className="rounded-full border border-[#ff8b2b]/30 bg-[#ff8b2b]/10 px-2.5 py-1 text-xs font-semibold text-[#ff8b2b]">
                Remove
              </button>
            ) : null}
          </div>
          <span className="text-sm text-[#8d9688]">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-3">
          <Field label="Name">
            <input value={exercise.name} onChange={(event) => onChange(index, 'name', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none" />
          </Field>

          <Field label="Image URL">
            <input value={exercise.imageUrl} onChange={(event) => onChange(index, 'imageUrl', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none" />
          </Field>

          {/* Per-exercise timing */}
          <div className="rounded-[1.2rem] border border-white/8 bg-white/3 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#8d9688]">Timing</span>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-[#aeb7a8]">
                <input
                  type="checkbox"
                  checked={hasCustomTiming}
                  onChange={(e) => handleTimingToggle(e.target.checked)}
                  className="accent-[#d4ff6a]"
                />
                Custom
              </label>
            </div>
            {hasCustomTiming && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Work (sec)">
                  <input
                    type="number"
                    min="5"
                    step="1"
                    value={exercise.workSecOverride ?? ''}
                    onChange={(e) => onChange(index, 'workSecOverride', e.target.value)}
                    onBlur={(e) => clampOnBlur('workSecOverride', e)}
                    className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none"
                  />
                </Field>
                <Field label="Rest (sec)">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={exercise.restSecOverride ?? ''}
                    onChange={(e) => onChange(index, 'restSecOverride', e.target.value)}
                    onBlur={(e) => clampOnBlur('restSecOverride', e)}
                    className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none"
                  />
                </Field>
              </div>
            )}
            {!hasCustomTiming && (
              <p className="mt-1.5 text-[11px] text-[#6b7566]">Using routine global timing</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Focus">
              <select value={exercise.focus} onChange={(event) => onChange(index, 'focus', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none [color-scheme:dark]">
                {FOCUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </Field>
            <Field label="Tempo">
              <select value={exercise.tempo} onChange={(event) => onChange(index, 'tempo', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none [color-scheme:dark]">
                {TEMPO_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </Field>
            <Field label="Joint Load">
              <select value={exercise.jointLoad} onChange={(event) => onChange(index, 'jointLoad', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none [color-scheme:dark]">
                {LEVEL_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </Field>
            <Field label="Impact">
              <select value={exercise.impactLevel} onChange={(event) => onChange(index, 'impactLevel', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none [color-scheme:dark]">
                {LEVEL_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Tips">
            <textarea rows="3" value={exercise.tipsText} onChange={(event) => onChange(index, 'tipsText', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none" />
          </Field>

          <Field label="Common Mistakes">
            <textarea rows="2" value={exercise.commonMistakesText} onChange={(event) => onChange(index, 'commonMistakesText', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none" />
          </Field>

          <Field label="Breathing Cue">
            <input value={exercise.breathingCue} onChange={(event) => onChange(index, 'breathingCue', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none" />
          </Field>

          <Field label="Regression">
            <input value={exercise.regression} onChange={(event) => onChange(index, 'regression', event.target.value)} className="w-full rounded-[1.2rem] border border-white/10 px-4 py-3 outline-none" />
          </Field>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">{label}</label>
      {children}
    </div>
  );
}

function TimeField({ name, min, value, onChange, disabled = false }) {
  const safeSeconds = Math.max(0, Number(value) || 0);
  // Always default to seconds; user explicitly switches to minutes if desired
  const [unit, setUnit] = useState('sec');
  // Local draft lets the user clear/retype without the field snapping back
  const [draft, setDraft] = useState(null);

  // Only show draft when it exists (user is mid-edit), otherwise derive from parent
  const displayValue = draft !== null
    ? draft
    : (unit === 'min' ? String(safeSeconds / 60) : String(safeSeconds));

  const minDisplay = unit === 'min' ? Math.ceil(Number(min) / 60) : Number(min);

  const commitValue = (raw, nextUnit = unit) => {
    const numeric = Number(raw);
    const seconds = Number.isFinite(numeric) && raw !== ''
      ? Math.max(Number(min), Math.round(nextUnit === 'min' ? numeric * 60 : numeric))
      : Number(min);
    setDraft(null);
    onChange({ target: { name, value: String(seconds) } });
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] gap-2">
      <input
        name={name}
        type="number"
        min={minDisplay}
        step="1"
        value={displayValue}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => commitValue(event.target.value)}
        className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none"
        disabled={disabled}
      />
      <select
        value={unit}
        onChange={(event) => {
          const nextUnit = event.target.value;
          // Preserve the current displayed number — just reinterpret it in the new unit
          const currentDisplay = draft !== null ? draft : displayValue;
          setUnit(nextUnit);
          setDraft(null);
          commitValue(currentDisplay, nextUnit);
        }}
        className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none [color-scheme:dark]"
        disabled={disabled}
      >
        <option value="sec">Seconds</option>
        <option value="min">Minutes</option>
      </select>
    </div>
  );
}
