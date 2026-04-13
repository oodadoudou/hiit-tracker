import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../hooks/useToast';

const FOCUS_OPTIONS = ['general', 'cardio', 'upper', 'core', 'legs', 'recovery'];
const TEMPO_OPTIONS = ['slow', 'controlled', 'steady', 'rhythmic'];
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'];
const EQUIPMENT_OPTIONS = ['bodyweight', 'dumbbell'];

// Known tags from the built-in library — shown as quick-add chips
const KNOWN_TAGS = [
  'jump', 'no-jump', 'standing', 'floor', 'dumbbell',
  'bilateral', 'unilateral', 'push', 'pull', 'hinge',
  'squat', 'lunge', 'plank', 'rotation', 'isometric',
];

function createBlankForm() {
  return { name: '', category: 'general', imageUrl: '', tipsText: '', tempo: 'steady', difficulty: 'medium', equipment: 'bodyweight', tags: '' };
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <label className="text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">{label}</label>
        {hint && <span className="text-[10px] text-[#5a6358]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function ExerciseLibraryManager() {
  const { state, saveExerciseToLibrary, deleteExerciseFromLibrary } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState(createBlankForm);
  const [editingName, setEditingName] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const toast = useToast();

  const customExercises = (state.exerciseLibrary || []).filter((ex) => !ex.isBuiltin);
  const filtered = customExercises.filter((ex) =>
    (ex.name || '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleTag = (tag) => {
    const current = form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
    handleChange('tags', next.join(', '));
  };

  const activeTags = form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

  const handleEdit = (ex) => {
    setForm({
      name: ex.name || '',
      category: ex.category || 'general',
      imageUrl: ex.imageUrl || '',
      tipsText: Array.isArray(ex.tips) ? ex.tips.join('\n') : '',
      tempo: ex.tempo || 'steady',
      difficulty: ex.difficulty || 'medium',
      equipment: ex.equipment || 'bodyweight',
      tags: Array.isArray(ex.tags) ? ex.tags.join(', ') : '',
    });
    setEditingName(ex.name);
    setExpanded(true);
    setTimeout(() => document.getElementById('ex-lib-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleDelete = (name) => {
    setPendingDelete(name);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteExerciseFromLibrary(pendingDelete);
    if (editingName === pendingDelete) { setForm(createBlankForm()); setEditingName(null); }
    setPendingDelete(null);
    toast.show('Exercise deleted.');
  };

  const handleSave = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) { toast.show('Exercise name is required.', 'error'); return; }
    if (editingName && editingName !== name) deleteExerciseFromLibrary(editingName);
    saveExerciseToLibrary({
      name,
      category: form.category,
      imageUrl: form.imageUrl.trim(),
      tips: form.tipsText.split('\n').map((t) => t.trim()).filter(Boolean),
      tempo: form.tempo,
      difficulty: form.difficulty,
      equipment: form.equipment,
      tags: form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
    });
    setForm(createBlankForm());
    setEditingName(null);
    toast.show(editingName ? 'Exercise updated.' : 'Exercise added to library.');
  };

  const handleCancel = () => { setForm(createBlankForm()); setEditingName(null); };

  return (
    <div className="rounded-[2rem] border border-white/10 bg-[rgba(20,25,22,0.82)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-6">
      {toast.node}
      {pendingDelete && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="pointer-events-auto w-full max-w-sm rounded-[2rem] border border-white/10 bg-[rgba(20,25,22,0.98)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
            <p className="text-sm font-medium text-[#ff8b2b]">Delete exercise?</p>
            <p className="mt-1 text-sm text-[#ffc490]">"{pendingDelete}" will be removed from your library.</p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setPendingDelete(null)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[#f2f5ef]">Cancel</button>
              <button type="button" onClick={confirmDelete} className="rounded-full bg-[#ff8b2b] px-4 py-2.5 text-sm font-semibold text-black">Delete</button>
            </div>
          </div>
        </div>
      )}
      {/* Header — matches RoutineEditor style */}
      <div
        className="flex cursor-pointer items-center justify-between gap-3"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#9aa394]">
            Exercise Library
            <span className="ml-2 normal-case tracking-normal text-[#6b7566]">· 动作库</span>
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f2f5ef]">
            Manage Exercises
            <span className="ml-2 text-base font-normal text-[#8d9688]">管理动作</span>
          </h2>
          <p className="mt-1 text-sm text-[#aeb7a8]">
            {customExercises.length > 0
              ? `${customExercises.length} custom exercise${customExercises.length > 1 ? 's' : ''} · 自定义动作`
              : '添加自定义动作，加入生成器候选池'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {customExercises.length > 0 && (
            <span className="rounded-full bg-[#d4ff6a]/15 px-3 py-1 text-xs font-semibold text-[#d4ff6a]">
              {customExercises.length}
            </span>
          )}
          <span className="text-sm text-[#8d9688]">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="mt-5 grid gap-6 border-t border-white/8 pt-5 lg:grid-cols-2">

          {/* ── Left: Add / Edit form ── */}
          <div id="ex-lib-form">
            <p className="mb-1 text-[11px] uppercase tracking-[0.35em] text-[#9aa394]">
              {editingName ? 'Edit Exercise · 编辑动作' : 'New Exercise · 添加动作'}
            </p>
            {editingName && (
              <div className="mt-2 mb-3 rounded-[1.2rem] border border-[#d4ff6a]/20 bg-[#d4ff6a]/8 px-4 py-2.5">
                <p className="text-xs text-[#c8ef60]">
                  Editing: <span className="font-semibold">{editingName}</span>
                  <span className="ml-1.5 text-[#8d9688]">· 修改后点击 Update 保存</span>
                </p>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-3 space-y-4">
              <Field label="Name · 动作名称" hint="required">
                <input
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Push-Up / 俯卧撑"
                  className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 text-sm outline-none placeholder:text-[#3d443d]"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Category · 分类">
                  <select value={form.category} onChange={(e) => handleChange('category', e.target.value)} className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 text-sm outline-none [color-scheme:dark]">
                    {FOCUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Difficulty · 难度">
                  <select value={form.difficulty} onChange={(e) => handleChange('difficulty', e.target.value)} className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 text-sm outline-none [color-scheme:dark]">
                    {DIFFICULTY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Tempo · 节奏">
                  <select value={form.tempo} onChange={(e) => handleChange('tempo', e.target.value)} className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 text-sm outline-none [color-scheme:dark]">
                    {TEMPO_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Equipment · 器械">
                  <select value={form.equipment} onChange={(e) => handleChange('equipment', e.target.value)} className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 text-sm outline-none [color-scheme:dark]">
                    {EQUIPMENT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              </div>

              {/* Tags */}
              <Field label="Tags · 标签" hint="用于生成器筛选">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {KNOWN_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                        activeTags.includes(tag)
                          ? 'border-[#d4ff6a]/40 bg-[#d4ff6a]/15 text-[#d4ff6a]'
                          : 'border-white/10 bg-white/3 text-[#6b7566] hover:text-[#9aa394]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <input
                  value={form.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  placeholder="或手动输入，逗号分隔"
                  className="w-full rounded-[1.4rem] border border-white/10 px-4 py-2.5 text-xs outline-none placeholder:text-[#3d443d]"
                />
              </Field>

              <Field label="Image URL · 图片链接" hint="optional">
                <input
                  value={form.imageUrl}
                  onChange={(e) => handleChange('imageUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 text-sm outline-none placeholder:text-[#3d443d]"
                />
              </Field>

              <Field label="Tips · 动作提示" hint="每行一条">
                <textarea
                  rows="3"
                  value={form.tipsText}
                  onChange={(e) => handleChange('tipsText', e.target.value)}
                  placeholder="Keep core tight&#10;Land softly"
                  className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 text-sm outline-none placeholder:text-[#3d443d]"
                />
              </Field>

              <div className="flex gap-2 pt-1">
                <button type="submit" className="rounded-full bg-[#d4ff6a] px-5 py-2.5 text-sm font-semibold text-black">
                  {editingName ? 'Update · 更新' : 'Add to Library · 加入库'}
                </button>
                {editingName && (
                  <button type="button" onClick={handleCancel} className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-[#aeb7a8] hover:bg-white/5">
                    Cancel · 取消
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* ── Right: Custom exercise list ── */}
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.35em] text-[#9aa394]">
              My Exercises · 自定义动作列表
            </p>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search · 搜索..."
              className="mb-3 w-full rounded-[1.4rem] border border-white/10 px-4 py-2.5 text-sm outline-none placeholder:text-[#3d443d]"
            />

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-white/10 py-10">
                <p className="text-sm text-[#5a6358]">
                  {customExercises.length === 0 ? 'No custom exercises yet' : 'No results · 未找到'}
                </p>
                {customExercises.length === 0 && (
                  <p className="mt-1 text-xs text-[#3d443d]">填写左侧表单添加第一个动作</p>
                )}
              </div>
            ) : (
              <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
                {filtered.map((ex) => (
                  <div key={ex.name} className="group flex items-center justify-between gap-3 rounded-[1.2rem] border border-white/8 bg-white/3 px-4 py-3 transition hover:border-white/15">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#f2f5ef]">{ex.name}</p>
                      <p className="mt-0.5 text-[11px] text-[#6b7566]">
                        {ex.category}{ex.difficulty ? ` · ${ex.difficulty}` : ''}{ex.equipment ? ` · ${ex.equipment}` : ''}
                      </p>
                      {Array.isArray(ex.tags) && ex.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {ex.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] text-[#5a6358]">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1.5 opacity-60 transition group-hover:opacity-100">
                      <button type="button" onClick={() => handleEdit(ex)} className="rounded-full border border-[#d4ff6a]/30 bg-[#d4ff6a]/10 px-2.5 py-1 text-xs font-semibold text-[#d4ff6a]">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(ex.name)} className="rounded-full border border-[#ff8b2b]/30 bg-[#ff8b2b]/10 px-2.5 py-1 text-xs font-semibold text-[#ff8b2b]">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
