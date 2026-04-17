import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, List, Eye, Pencil, History } from 'lucide-react';
import { hallStore, islandStore, machineStore, noteStore, dailySnapshotStore, registeredFloorMapStore } from '../store';
import { Island, Machine, MachineNote, MachineType } from '../types';
import FloorMapCanvas from '../components/FloorMapCanvas';

type Tab = 'map' | 'list';

interface AddForm {
  machineType: MachineType;
  startNum: string;
  endNum: string;
}

const defaultAddForm: AddForm = { machineType: 'slot', startNum: '', endNum: '' };

export default function FloorMapPage() {
  const { hallId } = useParams<{ hallId: string }>();
  const navigate = useNavigate();

  const hall = hallStore.getAll().find(h => h.id === hallId);
  const [islands, setIslands] = useState<Island[]>(() => islandStore.getByHall(hallId!));
  const [machines, setMachines] = useState<Machine[]>(() =>
    machineStore.getAll().filter(m => islandStore.getByHall(hallId!).some(i => i.id === m.islandId))
  );
  const [notes, setNotes] = useState<MachineNote[]>(() => noteStore.getAll());

  const [tab, setTab] = useState<Tab>('map');
  const [isEditMode, setIsEditMode] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(defaultAddForm);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerDate, setRegisterDate] = useState(() => {
    const t = new Date();
    return [t.getFullYear(), String(t.getMonth() + 1).padStart(2, '0'), String(t.getDate()).padStart(2, '0')].join('-');
  });
  const [snapshotDates, setSnapshotDates] = useState<string[]>(() =>
    registeredFloorMapStore.getByHall(hallId!)
  );

  function refresh() {
    const newIslands = islandStore.getByHall(hallId!);
    setIslands(newIslands);
    setMachines(machineStore.getAll().filter(m => newIslands.some(i => i.id === m.islandId)));
    setNotes(noteStore.getAll());
  }

  function refreshSnapshotDates() {
    setSnapshotDates(registeredFloorMapStore.getByHall(hallId!));
  }

  function handleAddRange() {
    const start = parseInt(addForm.startNum);
    const end = parseInt(addForm.endNum);
    if (isNaN(start) || isNaN(end) || end < start) return;
    islandStore.addRange(hallId!, addForm.machineType, start, end);
    refresh();
    setAddForm(defaultAddForm);
    setAddOpen(false);
  }

  function handleDeleteMachine(machineId: string) {
    if (!window.confirm('この台を削除しますか？')) return;
    machineStore.delete(machineId);
    refresh();
  }

  const handleMachineMove = useCallback((machineId: string, x: number, y: number) => {
    machineStore.update(machineId, { x, y });
    setMachines(prev => prev.map(m => m.id === machineId ? { ...m, x, y } : m));
  }, []);

  const handleMachineTap = useCallback((machineId: string) => {
    navigate(`/halls/${hallId}/machines/${machineId}`);
  }, [hallId, navigate]);

  if (!hall) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">ホールが見つかりません</p>
      </div>
    );
  }

  const addCount = (() => {
    const s = parseInt(addForm.startNum);
    const e = parseInt(addForm.endNum);
    return (!isNaN(s) && !isNaN(e) && e >= s) ? e - s + 1 : null;
  })();

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-blue-800 text-white px-4 py-3 flex items-center gap-3 shadow">
        <button onClick={() => navigate(`/halls/${hallId}`)} className="active:opacity-70">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-base font-bold flex-1 truncate">{hall.name}</h1>
        <button
          className="flex items-center gap-1 text-xs text-blue-200 bg-blue-700 px-2.5 py-1.5 rounded-full active:bg-blue-600 shrink-0"
          onClick={() => setRegisterOpen(true)}
        >
          <Plus size={13} />島図を保存
        </button>
        {snapshotDates.length > 0 && (
          <button
            className="flex items-center gap-1 text-xs text-blue-200 bg-blue-700 px-2.5 py-1.5 rounded-full active:bg-blue-600 shrink-0"
            onClick={() => setHistoryOpen(true)}
          >
            <History size={13} />過去の島図
          </button>
        )}
        {tab === 'map' && (
          <button
            className={`p-1.5 rounded-full active:opacity-70 ${isEditMode ? 'bg-yellow-400/30' : ''}`}
            onClick={() => setIsEditMode(e => !e)}
            title={isEditMode ? '閲覧モードへ' : '編集モードへ'}
          >
            {isEditMode ? <Eye size={20} /> : <Pencil size={20} />}
          </button>
        )}
      </header>

      {/* タブ */}
      <div className="flex bg-blue-900 text-white">
        {([
          {
            key: 'map' as Tab,
            label: '島図',
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            ),
          },
          { key: 'list' as Tab, label: '台一覧', icon: <List size={14} /> },
        ]).map(({ key, label, icon }) => (
          <button
            key={key}
            className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
              tab === key ? 'border-b-2 border-yellow-400 text-yellow-300' : 'text-blue-200'
            }`}
            onClick={() => setTab(key)}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      {tab === 'map' && (
        <FloorMapCanvas
          islands={islands}
          machines={machines}
          notes={notes}
          isEditMode={isEditMode}
          onMachineMove={handleMachineMove}
          onMachineTap={handleMachineTap}
        />
      )}

      {tab === 'list' && (
        <div className="flex-1 overflow-y-auto pb-20">
          {machines.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              台がありません
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 bg-white mt-3 mx-3 rounded-xl overflow-hidden shadow">
              {[...machines]
                .sort((a, b) => parseInt(a.number) - parseInt(b.number) || a.number.localeCompare(b.number))
                .map(m => {
                  const island = islands.find(i => i.id === m.islandId);
                  const isSlot = island?.machineType !== 'pachinko';
                  return (
                    <li key={m.id} className="px-4 py-3 flex items-center gap-3">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                        style={{ background: isSlot ? '#7c3aed' : '#1e40af' }}
                      >
                        {isSlot ? 'スロ' : 'パチ'}
                      </span>
                      <button
                        className="flex-1 text-left text-sm font-semibold text-gray-800"
                        onClick={() => navigate(`/halls/${hallId}/machines/${m.id}`)}
                      >
                        {m.number}番台
                        {m.modelName && <span className="ml-2 text-xs text-gray-500 font-normal">{m.modelName}</span>}
                      </button>
                      <button
                        className="text-xs text-red-400 active:text-red-600 shrink-0"
                        onClick={() => handleDeleteMachine(m.id)}
                      >
                        削除
                      </button>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      )}

      {/* 台追加FAB */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-700 text-white shadow-lg flex items-center justify-center active:bg-blue-800 z-10"
        onClick={() => setAddOpen(true)}
        aria-label="台を追加"
      >
        <Plus size={28} />
      </button>

      {/* 台追加モーダル */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setAddOpen(false)}>
          <div
            className="bg-white w-full rounded-t-2xl p-5 pb-8 flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-800">台を追加</h2>

            <div>
              <label className="text-sm font-medium text-gray-600">機種タイプ</label>
              <div className="mt-1 flex gap-2">
                {(['slot', 'pachinko'] as MachineType[]).map(t => (
                  <button
                    key={t}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      addForm.machineType === t
                        ? t === 'pachinko'
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-purple-600 text-white border-purple-600'
                        : 'border-gray-300 text-gray-600'
                    }`}
                    onClick={() => setAddForm(f => ({ ...f, machineType: t }))}
                  >
                    {t === 'pachinko' ? 'パチンコ' : 'スロット'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-600">開始番台</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500"
                  placeholder="例：101"
                  value={addForm.startNum}
                  onChange={e => setAddForm(f => ({ ...f, startNum: e.target.value }))}
                  autoFocus
                />
              </div>
              <span className="text-gray-400 pb-2.5">〜</span>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-600">終了番台</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500"
                  placeholder="例：120"
                  value={addForm.endNum}
                  onChange={e => setAddForm(f => ({ ...f, endNum: e.target.value }))}
                />
              </div>
            </div>

            {addCount !== null && (
              <p className="text-sm text-blue-600 font-medium -mt-2">
                {addForm.startNum}番台〜{addForm.endNum}番台（{addCount}台）を追加します
              </p>
            )}

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium"
                onClick={() => { setAddForm(defaultAddForm); setAddOpen(false); }}
              >
                キャンセル
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-medium disabled:opacity-40"
                onClick={handleAddRange}
                disabled={addCount === null}
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 島図を保存モーダル */}
      {registerOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setRegisterOpen(false)}>
          <div
            className="bg-white w-full rounded-t-2xl p-5 pb-8 flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">過去の島図に登録</h2>
              <button className="text-gray-400 active:text-gray-600 p-1 text-lg" onClick={() => setRegisterOpen(false)}>
                ✕
              </button>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">日付</label>
              <input
                type="date"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500"
                value={registerDate}
                onChange={e => setRegisterDate(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium"
                onClick={() => setRegisterOpen(false)}
              >
                キャンセル
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-medium disabled:opacity-40"
                disabled={!registerDate}
                onClick={() => {
                  if (!dailySnapshotStore.getByHallDate(hallId!, registerDate)) {
                    dailySnapshotStore.createFromTemplate(hallId!, registerDate);
                  }
                  registeredFloorMapStore.add(hallId!, registerDate);
                  refreshSnapshotDates();
                  setRegisterOpen(false);
                  navigate(`/halls/${hallId}/map/daily/${registerDate}`);
                }}
              >
                登録して開く
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 過去の島図モーダル */}
      {historyOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setHistoryOpen(false)}>
          <div
            className="bg-white w-full rounded-t-2xl flex flex-col max-h-[70vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <History size={16} className="text-blue-600" />過去の島図
              </h2>
              <button className="text-gray-400 active:text-gray-600 p-1 text-lg" onClick={() => setHistoryOpen(false)}>
                ✕
              </button>
            </div>
            <ul className="overflow-y-auto divide-y divide-gray-100">
              {snapshotDates.map(d => {
                const [y, m, day] = d.split('-').map(Number);
                return (
                  <li key={d}>
                    <button
                      className="w-full flex items-center gap-3 px-5 py-3.5 active:bg-gray-50 text-left"
                      onClick={() => {
                        setHistoryOpen(false);
                        navigate(`/halls/${hallId}/map/daily/${d}`);
                      }}
                    >
                      <span className="text-sm text-gray-800 font-medium">{y}年{m}月{day}日</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
