import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react';
import { machineModelStore, makerStore } from '../store';
import { MachineModel, MachineType } from '../types';

interface FormState {
  name: string;
  machineType: MachineType;
  makerId: string;
  notes: string;
}

const emptyForm = (): FormState => ({ name: '', machineType: 'slot', makerId: '', notes: '' });

export default function MachineModelDBPage() {
  const navigate = useNavigate();
  const [models, setModels] = useState<MachineModel[]>(() => machineModelStore.getAll());
  const makers = makerStore.getAll();

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<MachineModel | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  function reload() { setModels(machineModelStore.getAll()); }

  function openAdd() {
    setForm(emptyForm());
    setEditTarget(null);
    setModalMode('add');
  }

  function openEdit(model: MachineModel) {
    setForm({
      name: model.name,
      machineType: model.machineType,
      makerId: model.makerId ?? '',
      notes: model.notes ?? '',
    });
    setEditTarget(model);
    setModalMode('edit');
  }

  function handleSave() {
    const name = form.name.trim();
    if (!name) return;
    const makerId = form.makerId || undefined;
    const notes = form.notes.trim() || undefined;
    if (modalMode === 'add') {
      machineModelStore.add(name, form.machineType, makerId, notes);
    } else if (modalMode === 'edit' && editTarget) {
      machineModelStore.update(editTarget.id, { name, machineType: form.machineType, makerId, notes });
    }
    setModalMode(null);
    reload();
  }

  function handleDelete(id: string) {
    if (!window.confirm('この機種を削除しますか？')) return;
    machineModelStore.delete(id);
    reload();
  }

  const makerMap = new Map(makers.map(m => [m.id, m.name]));

  const sorted = [...models].sort((a, b) => a.name.localeCompare(b.name, 'ja'));

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="bg-blue-800 text-white px-4 py-3 flex items-center gap-2 shadow">
        <button className="p-1 text-blue-200 active:text-white" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold flex-1">機種DB</h1>
        <button className="p-2 text-blue-200 active:text-white" onClick={openAdd}>
          <Plus size={22} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-8">
        {sorted.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            機種がありません。右上の＋から追加してください。
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 bg-white mt-3 mx-3 rounded-xl overflow-hidden shadow">
            {sorted.map(model => (
              <li key={model.id} className="px-4 py-3 flex items-center gap-3">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                  style={{ background: model.machineType === 'pachinko' ? '#1e40af' : '#7c3aed' }}
                >
                  {model.machineType === 'pachinko' ? 'パチ' : 'スロ'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-800 truncate">{model.name}</p>
                  {model.makerId && (
                    <p className="text-xs text-gray-400">{makerMap.get(model.makerId) ?? ''}</p>
                  )}
                  {model.notes && (
                    <p className="text-xs text-gray-500 truncate">{model.notes}</p>
                  )}
                </div>
                <button className="p-1.5 text-gray-400 active:text-blue-500 shrink-0" onClick={() => openEdit(model)}>
                  <Pencil size={15} />
                </button>
                <button className="p-1.5 text-gray-400 active:text-red-500 shrink-0" onClick={() => handleDelete(model.id)}>
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 追加/編集モーダル */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setModalMode(null)}>
          <div
            className="bg-white w-full rounded-t-2xl p-5 pb-8 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-800">
              {modalMode === 'add' ? '機種を追加' : '機種を編集'}
            </h2>

            <div>
              <label className="text-sm font-medium text-gray-600">機種タイプ</label>
              <div className="mt-1 flex gap-2">
                {(['slot', 'pachinko'] as MachineType[]).map(t => (
                  <button
                    key={t}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      form.machineType === t
                        ? t === 'pachinko'
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-purple-600 text-white border-purple-600'
                        : 'border-gray-300 text-gray-600'
                    }`}
                    onClick={() => setForm(f => ({ ...f, machineType: t }))}
                  >
                    {t === 'pachinko' ? 'パチンコ' : 'スロット'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">機種名 *</label>
              <input
                autoFocus
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500"
                placeholder="例：北斗の拳 宿命"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">メーカー</label>
              <select
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none bg-white focus:border-blue-500"
                value={form.makerId}
                onChange={e => setForm(f => ({ ...f, makerId: e.target.value }))}
              >
                <option value="">未選択</option>
                {makers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              {makers.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  メーカーDBにメーカーを登録すると選択できます
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">メモ</label>
              <textarea
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500 resize-none"
                rows={3}
                placeholder="スペック、特徴など"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium"
                onClick={() => setModalMode(null)}
              >
                キャンセル
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-medium disabled:opacity-40"
                disabled={!form.name.trim()}
                onClick={handleSave}
              >
                {modalMode === 'add' ? '追加' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
