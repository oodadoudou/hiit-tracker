import { useRef, useState } from 'react';
import JsonManager from '../components/settings/JsonManager';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../hooks/useToast';

const IMPORT_MODES = [
  { key: 'full', label: 'Full Restore · 完整恢复', desc: '覆盖所有数据（历史、套路、动作库、设置）' },
  { key: 'routines', label: 'Routines Only · 仅导入套路', desc: '仅导入套路，不影响历史记录和个人数据' },
  { key: 'exercises', label: 'Exercises Only · 仅导入动作', desc: '仅导入自定义动作库，相同名称覆盖' },
  { key: 'merge', label: 'Merge · 合并（保留本地）', desc: '新套路和新动作加入，已有同名内容保持不变' },
];

export default function DataPage() {
  const { exportState, importState, importStatePartial } = useAppContext();
  const [importMode, setImportMode] = useState('full');
  const fileInputRef = useRef(null);
  const toast = useToast();

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
        if (importMode === 'full') {
          importState(String(reader.result));
        } else {
          importStatePartial(String(reader.result), importMode);
        }
        toast.show('Import completed.');
      } catch (error) {
        console.error(error);
        toast.show('Import failed — check that the file format is correct.', 'error');
      }
      // Reset file input so the same file can be re-imported
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const selectedMode = IMPORT_MODES.find((m) => m.key === importMode);

  return (
    <div className="space-y-4">
      {toast.node}
      <div className="rounded-[2rem] border border-white/10 bg-[rgba(18,22,20,0.82)] px-5 py-5 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:px-7">
        <p className="text-[11px] uppercase tracking-[0.35em] text-[#9aa394]">Data</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f2f5ef]">Backup And Restore</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#aeb7a8]">
          单独管理导入导出，避免和训练配置混在一起。这里会打包或恢复训练历史、日常记录、套路和个人偏好。
        </p>
      </div>

      {/* Import mode selector */}
      <div className="rounded-[2rem] border border-white/10 bg-[rgba(20,25,22,0.82)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.35em] text-[#9aa394]">Import</p>
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#f2f5ef]">
          Import Mode · 导入方式
        </h3>
        <p className="mt-2 text-sm text-[#aeb7a8]">选择导入模式，避免覆盖本地已有的内容。</p>

        <div className="mt-4 space-y-2">
          {IMPORT_MODES.map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => setImportMode(mode.key)}
              className={`w-full rounded-[1.4rem] border px-4 py-3.5 text-left transition ${
                importMode === mode.key
                  ? 'border-[#d4ff6a]/40 bg-[#d4ff6a]/8'
                  : 'border-white/8 bg-white/[0.02] hover:border-white/15'
              }`}
            >
              <p className={`text-sm font-semibold ${importMode === mode.key ? 'text-[#d4ff6a]' : 'text-[#f2f5ef]'}`}>
                {mode.label}
              </p>
              <p className="mt-0.5 text-xs text-[#6b7566]">{mode.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-full bg-[#d4ff6a] px-5 py-2.5 text-sm font-semibold text-black">
            <span>选择文件导入</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          {selectedMode && (
            <p className="text-xs text-[#6b7566]">{selectedMode.desc}</p>
          )}
        </div>
      </div>

      <JsonManager onExport={handleExport} onImport={handleImport} />
    </div>
  );
}
