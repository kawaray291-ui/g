import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, List } from 'lucide-react';
import { hallStore, islandStore, machineStore, noteStore } from '../store';
import { Island, Machine, MachineNote, MachineType } from '../types';
import FloorMapCanvas from '../components/FloorMapCanvas';

type Tab = 'map' | 'list';

interface IslandFormState {
  name: string;
  machineType: MachineType;
  doubleSided: boolean;
  machineCount: string;
  startNumber: string;
}

const defaultForm: IslandFormState = {
  name: '',
  machineType: 'pachinko',
  doubleSided: true,
  machineCount: '10',
  startNumber: '101',
};

export default function FloorMapPage() {
  const { hallId } = useParams<{ hallId: string }>();
  const navigate = useNavigate();

  const hall = hallStore.getAll().find(h => h.id === hallId);
  const [islands, setIslands] = useState<Island[]>(() =>
    islandStore.getByHall(hallId!)
  );
  const [machines, setMachines] = useState<Machine[]>(() =>
    machineStore.getAll().filter(m => islands.some(i => i.id === m.islandId))
  );
  const [notes, setNotes] = useState<MachineNote[]>(() => noteStore.getAll());

  const [tab, setTab] = useState<Tab>('map');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; island?: Island } | null>(null);
  const [form, setForm] = useState<IslandFormState>(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState<Island | null>(null);

  function refresh() {
    const newIslands = islandStore.getByHall(hallId!);
    setIslands(newIslands);
    setMachines(machineStore.getAll().filter(m => newIslands.some(i => i.id === m.islandId)));
    setNotes(noteStore.getAll());
  }

  function openAdd() {
    setForm(defaultForm);
    setModal({ mode: 'add' });
  }

  function openEdit(island: Island) {
    setForm({
      name: island.name,
      machineType: island.machineType,
      doubleSided: island.doubleSided,
      machineCount: String(island.machineCount),
      startNumber: String(island.startNumber),
    });
    setModal({ mode: 'edit', island });
  }

  function saveIsland() {
    const count = Math.max(1, Math.min(30, parseInt(form.machineCount) || 10));
    const start = parseInt(form.startNumber) || 101;
    if (!form.name.trim()) return;

    if (modal?.mode === 'add') {
      islandStore.add(
        hallId!,
        form.name.trim(),
        form.machineType,
        form.doubleSided,
        count,
        start
      );
    } else if (modal?.mode === 'edit' && modal.island) {
      islandStore.update(modal.island.id, {
        name: form.name.trim(),
        machineType: form.machineType,
        doubleSided: form.doubleSided,
        // 台数・番号変更は島の再作成が必要なため今回は変更のみ
      });
    }
    refresh();
    setModal(null);
  }

  const handleIslandMove = useCallback((islandId: string, x: number, y: number) => {
    islandStore.update(islandId, { x, y });
    setIslands(islandStore.getByHall(hallId!));
  }, [hallId]);

  function confirmDelete() {
    if (!deleteTarget) return;
    islandStore.delete(deleteTarget.id);
    refresh();
    setDeleteTarget(null);
  }

  if (!hall) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">ホールが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-blue-800 text-white px-4 py-3 flex items-center gap-3 shadow">
        <button onClick={() => navigate('/')} className="active:opacity-70">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-base font-bold flex-1 truncate">{hall.name}</h1>
      </header>

      {/* タブ */}
      <div className="flex bg-blue-900 text-white">
        {(['map', 'list'] as Tab[]).map(t => (
          <button
            key={t}
            className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
              tab === t ? 'border-b-2 border-yellow-400 text-yellow-300' : 'text-blue-200'
            }`}
            onClick={() => setTab(t)}
          >
            {t === 'map' ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                </svg>
                島図
              </>
            ) : (
              <>
                <List size={14} />
                島一覧
              </>
            )}
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      {tab === 'map' ? (
        <FloorMapCanvas
          hallId={hallId!}
          islands={islands}
          machines={machines}
          notes={notes}
          onIslandMove={handleIslandMove}
          onIslandEdit={openEdit}
          onIslandDelete={setDeleteTarget}
        />
      ) : (
        <div className="flex-1 overflow-y-auto pb-20">
          {islands.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              島がありません
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 bg-white mt-3 mx-3 rounded-xl overflow-hidden shadow">
              {islands.map(island => {
                const islandMachines = machines.filter(m => m.islandId === island.id);
                return (
                  <li key={island.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: island.machineType === 'pachinko' ? '#1e40af' : '#7c3aed' }}
                      >
                        {island.machineType === 'pachinko' ? 'パチンコ' : 'スロット'}
                      </span>
                      <span className="font-semibold text-gray-900">{island.name}</span>
                      <span className="text-xs text-gray-400">
                        {island.doubleSided ? '両面' : '片面'} / {island.machineCount}台
                      </span>
                      <button
                        className="ml-auto text-xs text-blue-600"
                        onClick={() => openEdit(island)}
                      >
                        編集
                      </button>
                      <button
                        className="text-xs text-red-500"
                        onClick={() => setDeleteTarget(island)}
                      >
                        削除
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {islandMachines
                        .sort((a, b) => a.side - b.side || a.pos - b.pos)
                        .map(m => {
                          const note = notes.find(n => n.machineId === m.id);
                          return (
                            <button
                              key={m.id}
                              className={`px-2 py-1 rounded border text-xs font-medium ${
                                note?.settingRating && note.settingRating >= 4
                                  ? 'bg-green-100 border-green-400 text-green-800'
                                  : note?.settingRating && note.settingRating <= 2
                                  ? 'bg-red-50 border-red-300 text-red-700'
                                  : 'bg-gray-100 border-gray-300 text-gray-700'
                              }`}
                              onClick={() => navigate(`/halls/${hallId}/machines/${m.id}`)}
                            >
                              {m.number}
                            </button>
                          );
                        })}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* 追加FAB */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-700 text-white shadow-lg flex items-center justify-center active:bg-blue-800 z-10"
        onClick={openAdd}
        aria-label="島を追加"
      >
        <Plus size={28} />
      </button>

      {/* 島追加/編集モーダル */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setModal(null)}>
          <div
            className="bg-white w-full rounded-t-2xl p-5 pb-8 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-800">
              {modal.mode === 'add' ? '島を追加' : '島を編集'}
            </h2>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium text-gray-600">島名 *</label>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500"
                  placeholder="例：北1島"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">機種タイプ</label>
                <div className="mt-1 flex gap-2">
                  {(['pachinko', 'slot'] as MachineType[]).map(t => (
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
                <label className="text-sm font-medium text-gray-600">島の形</label>
                <div className="mt-1 flex gap-2">
                  {[true, false].map(v => (
                    <button
                      key={String(v)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium ${
                        form.doubleSided === v
                          ? 'bg-blue-100 border-blue-500 text-blue-800'
                          : 'border-gray-300 text-gray-600'
                      }`}
                      onClick={() => setForm(f => ({ ...f, doubleSided: v }))}
                      disabled={modal.mode === 'edit'}
                    >
                      {v ? '両面島' : '片面島'}
                    </button>
                  ))}
                </div>
              </div>

              {modal.mode === 'add' && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-600">片面台数</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500"
                      placeholder="10"
                      value={form.machineCount}
                      min={1}
                      max={30}
                      onChange={e => setForm(f => ({ ...f, machineCount: e.target.value }))}
                    />
                    <p className="text-xs text-gray-400 mt-0.5">
                      {form.doubleSided
                        ? `両面: ${form.machineCount}台 × 2 = ${Number(form.machineCount) * 2}台`
                        : `${form.machineCount}台`}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">台番号 開始番号</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500"
                      placeholder="101"
                      value={form.startNumber}
                      onChange={e => setForm(f => ({ ...f, startNumber: e.target.value }))}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium"
                onClick={() => setModal(null)}
              >
                キャンセル
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-medium disabled:opacity-40"
                onClick={saveIsland}
                disabled={!form.name.trim()}
              >
                {modal.mode === 'add' ? '追加' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-800">島を削除</h2>
            <p className="text-sm text-gray-600">
              「{deleteTarget.name}」とその全台データを削除します。この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium"
                onClick={() => setDeleteTarget(null)}
              >
                キャンセル
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium"
                onClick={confirmDelete}
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
