import { useState } from 'react';
import {
  ROUTINE_GENERATOR_DIFFICULTIES,
  ROUTINE_GENERATOR_EQUIPMENT,
  ROUTINE_GENERATOR_TAGS,
  ROUTINE_GENERATOR_TARGETS,
  ROUTINE_GENERATOR_TEMPOS,
} from '../../utils/routineGenerator';

export default function RoutineGeneratorCard({
  options,
  onToggleTarget,
  onToggleTag,
  onOptionChange,
  onGenerate,
  generatedRoutines,
  generatorStatus,
  onSelectRoutine,
  selectedRoutineId,
  onRerollRoutine,
  onCreateVariant,
  presets = [],
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
}) {
  const [presetName, setPresetName] = useState('');
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[rgba(20,25,22,0.82)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#9aa394]">Routine Lab</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f2f5ef]">Generate Random Routines</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#aeb7a8]">
            先选训练类别、动作标签、每套动作数和要生成的套路数量。生成后可以直接选中其中一套，继续做个人定制。
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          className="rounded-full bg-[#d4ff6a] px-4 py-3 text-sm font-semibold text-black"
        >
          Generate
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">Routine Name</label>
          <input
            type="text"
            value={options.baseName}
            onChange={(event) => onOptionChange('baseName', event.target.value)}
            placeholder="例如：晨间燃脂"
            className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="动作数量"
            min="3"
            max="12"
            value={options.exerciseCount}
            onChange={(value) => onOptionChange('exerciseCount', value)}
          />
          <NumberField
            label="套路数量"
            min="1"
            max="8"
            value={options.routineCount}
            onChange={(value) => onOptionChange('routineCount', value)}
          />
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-3 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">训练类别</label>
        <div className="flex flex-wrap gap-2">
          {ROUTINE_GENERATOR_TARGETS.map((target) => {
            const active = options.targets.includes(target.key);
            return (
              <FilterChip
                key={target.key}
                active={active}
                onClick={() => onToggleTarget(target.key)}
              >
                {target.label}
              </FilterChip>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-3 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">动作标签</label>
        <div className="flex flex-wrap gap-2">
          {ROUTINE_GENERATOR_TAGS.map((tag) => {
            const active = options.requiredTags.includes(tag.key);
            return (
              <FilterChip
                key={tag.key}
                active={active}
                onClick={() => onToggleTag(tag.key)}
              >
                {tag.label}
              </FilterChip>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <FilterGroup
          label="动作节奏"
          options={ROUTINE_GENERATOR_TEMPOS}
          activeKeys={options.allowedTempos}
          onToggle={(key) => onOptionChange('toggleAllowedTempos', key)}
        />
        <FilterGroup
          label="难度"
          options={ROUTINE_GENERATOR_DIFFICULTIES}
          activeKeys={options.allowedDifficulties}
          onToggle={(key) => onOptionChange('toggleAllowedDifficulties', key)}
        />
        <FilterGroup
          label="器械"
          options={ROUTINE_GENERATOR_EQUIPMENT}
          activeKeys={options.allowedEquipment}
          onToggle={(key) => onOptionChange('toggleAllowedEquipment', key)}
        />
      </div>

      {/* Generator presets — save / load / delete */}
      <div className="mt-5 rounded-[1.4rem] border border-white/8 bg-white/[0.02] p-4">
        <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">
          Presets · 筛选预设
        </p>
        {presets.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {presets.map((preset) => (
              <div key={preset.name} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onLoadPreset(preset)}
                  className="rounded-full border border-[#d4ff6a]/30 bg-[#d4ff6a]/10 px-3 py-1 text-xs font-medium text-[#d4ff6a] transition hover:bg-[#d4ff6a]/20"
                >
                  {preset.name}
                </button>
                <button
                  type="button"
                  onClick={() => onDeletePreset(preset.name)}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[#5a6358] transition hover:text-[#ff8b2b]"
                  title="删除预设"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="预设名称..."
            className="flex-1 rounded-full border border-white/10 px-4 py-2 text-sm outline-none placeholder:text-[#3d443d]"
          />
          <button
            type="button"
            onClick={() => { if (presetName.trim()) { onSavePreset(presetName); setPresetName(''); } }}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#aeb7a8] transition hover:bg-white/10"
          >
            保存当前设置
          </button>
        </div>
      </div>

      {generatorStatus ? (
        <div className="mt-5 rounded-[1.2rem] border border-[#ff8b2b]/25 bg-[#ff8b2b]/8 px-4 py-3 text-sm text-[#ffc490]">
          {generatorStatus}
        </div>
      ) : null}

      {generatedRoutines.length ? (
        <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-black/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#f2f5ef]">Generated Routines</p>
              <p className="mt-1 text-xs text-[#9ca69a]">点一套进入下方编辑器继续个性化修改。</p>
            </div>
            <span className="rounded-full border border-[#d4ff6a]/30 bg-[#d4ff6a]/10 px-3 py-1 text-xs font-semibold text-[#d4ff6a]">
              {generatedRoutines.length} saved
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {generatedRoutines.map((routine) => {
              const active = routine.id === selectedRoutineId;
              return (
                <button
                  key={routine.id}
                  type="button"
                  onClick={() => onSelectRoutine(routine.id)}
                  className={`rounded-[1.2rem] border px-4 py-4 text-left transition ${
                    active
                      ? 'border-[#d4ff6a]/35 bg-[#d4ff6a]/10'
                      : 'border-white/8 bg-white/[0.03] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#f2f5ef]">{routine.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#8d9688]">
                        {routine.exercises.length} exercises
                      </p>
                    </div>
                    {active ? (
                      <span className="shrink-0 rounded-full border border-[#d4ff6a]/30 bg-[#d4ff6a]/10 px-2.5 py-1 text-[10px] font-semibold text-[#d4ff6a]">
                        Editing
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {routine.exercises.slice(0, 5).map((exercise) => (
                      <span key={`${routine.id}-${exercise.name}`} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-[#c7d0c2]">
                        {exercise.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRerollRoutine(routine.id);
                      }}
                      className="rounded-full border border-[#8dd3ff]/25 bg-[#8dd3ff]/10 px-3 py-1.5 text-xs font-semibold text-[#8dd3ff]"
                    >
                      重新生成这一套
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onCreateVariant(routine.id);
                      }}
                      className="rounded-full border border-[#d4ff6a]/25 bg-[#d4ff6a]/10 px-3 py-1.5 text-xs font-semibold text-[#d4ff6a]"
                    >
                      复制一套变体
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active
        ? 'rounded-full border border-[#d4ff6a]/35 bg-[#d4ff6a]/12 px-3 py-1.5 text-sm font-semibold text-[#d4ff6a]'
        : 'rounded-full border border-white/10 bg-black/10 px-3 py-1.5 text-sm font-medium text-[#c7d0c2]'}
    >
      {children}
    </button>
  );
}

function NumberField({ label, value, min, max, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[1.4rem] border border-white/10 px-4 py-3 outline-none"
      />
    </div>
  );
}

function FilterGroup({ label, options, activeKeys, onToggle }) {
  return (
    <div>
      <label className="mb-3 block text-[11px] uppercase tracking-[0.25em] text-[#8d9688]">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <FilterChip
            key={option.key}
            active={activeKeys.includes(option.key)}
            onClick={() => onToggle(option.key)}
          >
            {option.label}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}
