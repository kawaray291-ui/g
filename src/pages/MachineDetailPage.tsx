import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, StickyNote, Info } from 'lucide-react';
import { machineStore, islandStore, noteStore, hallStore } from '../store';
import { MachineNote, SettingRating } from '../types';

type Tab = 'memo' | 'info';

function StarRating({
  value,
  onChange,
}: {
  value?: SettingRating;
  onChange: (v: SettingRating) => void;
}) {
  return (
    <div className="flex gap-1">
      {([1, 2, 3, 4, 5] as SettingRating[]).map(n => (
        <button
          key={n}
          className={`text-2xl ${n <= (value ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`}
          onClick={() => onChange(value === n ? (1 as SettingRating) : n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ratingLabel(r?: SettingRating): string {
  if (!r) return '未評価';
  return ['', '入りにくい', 'やや入りにくい', '普通', 'やや入りやすい', '入りやすい'][r];
}

export default function MachineDetailPage() {
  const { hallId, machineId } = useParams<{ hallId: string; machineId: string }>();
  const navigate = useNavigate();

  const machine = machineStore.getById(machineId!);
  const island = machine ? islandStore.getAll().find(i => i.id === machine.islandId) : undefined;
  const hall = hallStore.getAll().find(h => h.id === hallId);

  const [tab, setTab] = useState<Tab>('memo');
  const [note, setNote] = useState<MachineNote | undefined>(() => noteStore.getByMachine(machineId!));

  const [memoText, setMemoText] = useState(note?.memo ?? '');
  const [settingRating, setSettingRating] = useState<SettingRating | undefined>(note?.settingRating);
  const [memoSaved, setMemoSaved] = useState(false);

  const [editingModel, setEditingModel] = useState(false);
  const [modelName, setModelName] = useState(machine?.modelName ?? '');
  const [machineNumber, setMachineNumber] = useState(machine?.number ?? '');

  function saveMemo() {
    noteStore.upsert(machineId!, { settingRating, memo: memoText });
    setNote(noteStore.getByMachine(machineId!));
    setMemoSaved(true);
    setTimeout(() => setMemoSaved(false), 1500);
  }

  function saveMachineInfo() {
    if (!machine) return;
    machineStore.update(machine.id, { number: machineNumber, modelName });
    setEditingModel(false);
  }

  if (!machine || !island) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">台が見つかりません</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-blue-800 text-white px-4 py-3 flex items-center gap-3 shadow">
        <button onClick={() => navigate(`/halls/${hallId}`)} className="active:opacity-70">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">{machine.number}番台</h1>
            {note?.settingRating && (
              <span className="text-yellow-300 text-sm">
                {'★'.repeat(note.settingRating)}
              </span>
            )}
          </div>
          <p className="text-xs text-blue-200 truncate">
            {hall?.name} / {island.name}
            {machine.modelName ? ` / ${machine.modelName}` : ''}
          </p>
        </div>
      </header>

      {/* タブ */}
      <div className="flex bg-white border-b border-gray-200 shadow-sm">
        {([
          { key: 'memo', label: 'メモ', icon: StickyNote },
          { key: 'info', label: '台情報', icon: Info },
        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
              tab === key
                ? 'text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-500'
            }`}
            onClick={() => setTab(key)}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto">
        {/* ─── メモタブ ─── */}
        {tab === 'memo' && (
          <div className="p-4 flex flex-col gap-4">
            <div className="bg-white rounded-xl p-4 shadow">
              <p className="text-sm font-semibold text-gray-700 mb-2">設定の入りやすさ</p>
              <StarRating value={settingRating} onChange={v => setSettingRating(v)} />
              <p className="text-xs text-gray-400 mt-1">{ratingLabel(settingRating)}</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow">
              <p className="text-sm font-semibold text-gray-700 mb-2">メモ</p>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-400 resize-none"
                rows={6}
                placeholder="台の特徴、傾向、気になった点など自由に..."
                value={memoText}
                onChange={e => setMemoText(e.target.value)}
              />
            </div>

            <button
              className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${
                memoSaved ? 'bg-green-500' : 'bg-blue-700 active:bg-blue-800'
              }`}
              onClick={saveMemo}
            >
              {memoSaved ? '保存しました！' : 'メモを保存'}
            </button>
          </div>
        )}

        {/* ─── 台情報タブ ─── */}
        {tab === 'info' && (
          <div className="p-4 flex flex-col gap-4">
            <div className="bg-white rounded-xl p-4 shadow">
              {editingModel ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">台番号</label>
                    <input
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500"
                      value={machineNumber}
                      onChange={e => setMachineNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">機種名</label>
                    <input
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500"
                      placeholder="例：北斗無双 など"
                      value={modelName}
                      onChange={e => setModelName(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm"
                      onClick={() => setEditingModel(false)}
                    >
                      キャンセル
                    </button>
                    <button
                      className="flex-1 py-2 rounded-lg bg-blue-700 text-white text-sm"
                      onClick={saveMachineInfo}
                    >
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">台番号</p>
                    <p className="text-lg font-bold text-gray-900">{machine.number}</p>
                    <p className="text-xs text-gray-500 mt-2">機種名</p>
                    <p className="text-base text-gray-800">
                      {machine.modelName || <span className="text-gray-400">未設定</span>}
                    </p>
                  </div>
                  <button
                    className="text-sm text-blue-600 font-medium px-3 py-1 rounded-lg active:bg-blue-50"
                    onClick={() => setEditingModel(true)}
                  >
                    編集
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-4 shadow">
              <p className="text-xs text-gray-500">ホール</p>
              <p className="text-base text-gray-800">{hall?.name}</p>
              <p className="text-xs text-gray-500 mt-2">機種タイプ</p>
              <p className="text-base text-gray-800">
                {island.machineType === 'pachinko' ? 'パチンコ' : 'スロット'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
