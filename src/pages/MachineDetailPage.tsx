import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Star, CalendarDays, StickyNote, Info } from 'lucide-react';
import { machineStore, islandStore, noteStore, visitStore, hallStore } from '../store';
import { MachineNote, VisitRecord, SettingRating } from '../types';

type Tab = 'memo' | 'visits' | 'info';

interface VisitForm {
  date: string;
  result: string;
  bigBonusCount: string;
  notes: string;
}

const emptyVisitForm = (): VisitForm => ({
  date: new Date().toISOString().slice(0, 10),
  result: '',
  bigBonusCount: '',
  notes: '',
});

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

function formatResult(result?: number): string {
  if (result === undefined || result === null) return '—';
  const sign = result >= 0 ? '+' : '';
  return `${sign}${result.toLocaleString()}`;
}

export default function MachineDetailPage() {
  const { hallId, machineId } = useParams<{ hallId: string; machineId: string }>();
  const navigate = useNavigate();

  const machine = machineStore.getById(machineId!);
  const island = machine ? islandStore.getAll().find(i => i.id === machine.islandId) : undefined;
  const hall = hallStore.getAll().find(h => h.id === hallId);

  const [tab, setTab] = useState<Tab>('memo');
  const [note, setNote] = useState<MachineNote | undefined>(() => noteStore.getByMachine(machineId!));
  const [visits, setVisits] = useState<VisitRecord[]>(() => visitStore.getByMachine(machineId!));

  // メモ編集
  const [memoText, setMemoText] = useState(note?.memo ?? '');
  const [settingRating, setSettingRating] = useState<SettingRating | undefined>(note?.settingRating);
  const [memoSaved, setMemoSaved] = useState(false);

  function saveMemo() {
    noteStore.upsert(machineId!, { settingRating, memo: memoText });
    setNote(noteStore.getByMachine(machineId!));
    setMemoSaved(true);
    setTimeout(() => setMemoSaved(false), 1500);
  }

  // 来店記録
  const [visitModal, setVisitModal] = useState<{ mode: 'add' | 'edit'; record?: VisitRecord } | null>(null);
  const [visitForm, setVisitForm] = useState<VisitForm>(emptyVisitForm);
  const [deleteVisit, setDeleteVisit] = useState<VisitRecord | null>(null);

  // 機種名編集
  const [editingModel, setEditingModel] = useState(false);
  const [modelName, setModelName] = useState(machine?.modelName ?? '');
  const [machineNumber, setMachineNumber] = useState(machine?.number ?? '');

  function openAddVisit() {
    setVisitForm(emptyVisitForm());
    setVisitModal({ mode: 'add' });
  }

  function openEditVisit(record: VisitRecord) {
    setVisitForm({
      date: record.date,
      result: record.result !== undefined ? String(record.result) : '',
      bigBonusCount: record.bigBonusCount !== undefined ? String(record.bigBonusCount) : '',
      notes: record.notes ?? '',
    });
    setVisitModal({ mode: 'edit', record });
  }

  function saveVisit() {
    const result = visitForm.result !== '' ? Number(visitForm.result) : undefined;
    const bigBonusCount = visitForm.bigBonusCount !== '' ? Number(visitForm.bigBonusCount) : undefined;
    if (visitModal?.mode === 'add') {
      visitStore.add(machineId!, visitForm.date, result, bigBonusCount, visitForm.notes || undefined);
    } else if (visitModal?.mode === 'edit' && visitModal.record) {
      visitStore.update(visitModal.record.id, {
        date: visitForm.date,
        result,
        bigBonusCount,
        notes: visitForm.notes || undefined,
      });
    }
    setVisits(visitStore.getByMachine(machineId!));
    setVisitModal(null);
  }

  function confirmDeleteVisit() {
    if (!deleteVisit) return;
    visitStore.delete(deleteVisit.id);
    setVisits(visitStore.getByMachine(machineId!));
    setDeleteVisit(null);
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

  const totalResult = visits.reduce((sum, v) => sum + (v.result ?? 0), 0);
  const visitCount = visits.length;

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

      {/* サマリーバー */}
      <div className="bg-blue-900 text-white flex divide-x divide-blue-700">
        <div className="flex-1 py-2 text-center">
          <p className="text-xs text-blue-300">来店回数</p>
          <p className="text-base font-bold">{visitCount}回</p>
        </div>
        <div className="flex-1 py-2 text-center">
          <p className="text-xs text-blue-300">収支合計</p>
          <p className={`text-base font-bold ${totalResult >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            {formatResult(totalResult)}
          </p>
        </div>
        <div className="flex-1 py-2 text-center">
          <p className="text-xs text-blue-300">設定評価</p>
          <p className="text-base font-bold">
            {note?.settingRating ? `${'★'.repeat(note.settingRating)}` : '—'}
          </p>
        </div>
      </div>

      {/* タブ */}
      <div className="flex bg-white border-b border-gray-200 shadow-sm">
        {([
          { key: 'memo', label: 'メモ', icon: StickyNote },
          { key: 'visits', label: '来店記録', icon: CalendarDays },
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

        {/* ─── 来店記録タブ ─── */}
        {tab === 'visits' && (
          <div className="pb-24">
            {visits.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                <CalendarDays size={36} strokeWidth={1} />
                <p className="text-sm">来店記録がありません</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 bg-white mt-3 mx-3 rounded-xl overflow-hidden shadow">
                {visits.map(record => (
                  <li key={record.id} className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-800">{record.date}</span>
                          {record.bigBonusCount !== undefined && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              大当 {record.bigBonusCount}回
                            </span>
                          )}
                        </div>
                        {record.result !== undefined && (
                          <p className={`text-base font-bold ${record.result >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {formatResult(record.result)}円
                          </p>
                        )}
                        {record.notes && (
                          <p className="text-xs text-gray-500 mt-1">{record.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          className="p-1.5 text-gray-400 active:text-blue-600"
                          onClick={() => openEditVisit(record)}
                        >
                          <Star size={14} />
                        </button>
                        <button
                          className="p-1.5 text-gray-400 active:text-red-600"
                          onClick={() => setDeleteVisit(record)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <button
              className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-700 text-white shadow-lg flex items-center justify-center active:bg-blue-800 z-10"
              onClick={openAddVisit}
            >
              <Plus size={28} />
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
              <p className="text-xs text-gray-500 mt-2">島</p>
              <p className="text-base text-gray-800">
                {island.name}（{island.machineType === 'pachinko' ? 'パチンコ' : 'スロット'} / {island.doubleSided ? '両面' : '片面'}）
              </p>
              <p className="text-xs text-gray-500 mt-2">位置</p>
              <p className="text-base text-gray-800">
                {machine.side === 0 ? '表列' : '裏列'} {machine.pos + 1}番目
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 来店記録 追加/編集モーダル */}
      {visitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setVisitModal(null)}>
          <div
            className="bg-white w-full rounded-t-2xl p-5 pb-8 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-800">
              {visitModal.mode === 'add' ? '来店記録を追加' : '来店記録を編集'}
            </h2>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium text-gray-600">日付</label>
                <input
                  type="date"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500"
                  value={visitForm.date}
                  onChange={e => setVisitForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">収支（円）</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500"
                  placeholder="例：3000（プラス）、-5000（マイナス）"
                  value={visitForm.result}
                  onChange={e => setVisitForm(f => ({ ...f, result: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">大当たり回数</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500"
                  placeholder="例：5"
                  value={visitForm.bigBonusCount}
                  onChange={e => setVisitForm(f => ({ ...f, bigBonusCount: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">メモ</label>
                <textarea
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder="その日の状況、設定推測など"
                  value={visitForm.notes}
                  onChange={e => setVisitForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium"
                onClick={() => setVisitModal(null)}
              >
                キャンセル
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-medium"
                onClick={saveVisit}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 来店記録 削除確認 */}
      {deleteVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-800">記録を削除</h2>
            <p className="text-sm text-gray-600">
              {deleteVisit.date} の来店記録を削除しますか？
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium"
                onClick={() => setDeleteVisit(null)}
              >
                キャンセル
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium"
                onClick={confirmDeleteVisit}
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
