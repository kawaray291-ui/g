import { useState } from 'react';
import { Map } from 'lucide-react';
import { CalendarEntry } from '../types';

interface SaveData {
  memo: string;
  medalDiff?: number;
  avgRotation?: number;
  queueCount?: number;
}

interface Props {
  date: string;           // YYYY-MM-DD
  entry?: CalendarEntry;
  onSave: (data: SaveData) => void;
  onDelete: () => void;
  onOpenDailyMap: () => void;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

export default function CalendarEntryModal({
  date, entry, onSave, onDelete, onOpenDailyMap, onClose,
}: Props) {
  const [memo, setMemo]               = useState(entry?.memo ?? '');
  const [medalDiff, setMedalDiff]     = useState(entry?.medalDiff?.toString() ?? '');
  const [avgRotation, setAvgRotation] = useState(entry?.avgRotation?.toString() ?? '');
  const [queueCount, setQueueCount]   = useState(entry?.queueCount?.toString() ?? '');

  function handleSave() {
    onSave({
      memo,
      medalDiff:   medalDiff   !== '' ? Number(medalDiff)   : undefined,
      avgRotation: avgRotation !== '' ? Number(avgRotation) : undefined,
      queueCount:  queueCount  !== '' ? Number(queueCount)  : undefined,
    });
  }

  const hasData = entry !== undefined;
  const inputCls =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-2xl flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">{formatDate(date)}</h2>
          <button className="text-gray-400 active:text-gray-600 p-1 text-lg" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* フォーム */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
          {/* 島図ボタン（大） */}
          <button
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold rounded-xl active:bg-indigo-700"
            style={{ fontSize: 18, paddingTop: 16, paddingBottom: 16, paddingLeft: 32, paddingRight: 32 }}
            onClick={onOpenDailyMap}
          >
            <Map size={22} />
            島図
          </button>
          <div>
            <label className="text-sm font-medium text-gray-600">予定・メモ</label>
            <textarea
              className={`mt-1 ${inputCls} resize-none`}
              rows={3}
              placeholder="当日の予定、狙い台、イベント情報など"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">差枚数（±枚）</label>
            <input
              type="number"
              inputMode="numeric"
              className={`mt-1 ${inputCls}`}
              placeholder="例：+3000 や -1500"
              value={medalDiff}
              onChange={e => setMedalDiff(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">平均回転率</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              className={`mt-1 ${inputCls}`}
              placeholder="例：20.5"
              value={avgRotation}
              onChange={e => setAvgRotation(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">並び人数</label>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                className="w-11 h-11 rounded-lg border border-gray-300 text-xl font-bold text-gray-600 active:bg-gray-100 shrink-0 flex items-center justify-center"
                onClick={() => setQueueCount(v => String(Math.max(0, (Number(v) || 0) - 1)))}
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                className={`flex-1 ${inputCls} text-center`}
                placeholder="0"
                value={queueCount}
                onChange={e => setQueueCount(e.target.value)}
              />
              <button
                type="button"
                className="w-11 h-11 rounded-lg border border-gray-300 text-xl font-bold text-gray-600 active:bg-gray-100 shrink-0 flex items-center justify-center"
                onClick={() => setQueueCount(v => String((Number(v) || 0) + 1))}
              >
                ＋
              </button>
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          {hasData && (
            <button
              className="px-4 py-3 rounded-xl border border-red-300 text-red-500 font-medium text-sm active:bg-red-50"
              onClick={onDelete}
            >
              削除
            </button>
          )}
          <button
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium"
            onClick={onClose}
          >
            キャンセル
          </button>
          <button
            className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-medium active:bg-blue-800"
            onClick={handleSave}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
