import { useState } from 'react';
import { Machine, DailyMachineData, SettingRating } from '../types';

interface Props {
  machine: Machine;
  daily?: DailyMachineData;
  date: string;
  onSave: (patch: Partial<Pick<DailyMachineData, 'settingRating' | 'medalDiff' | 'rotationRate' | 'memo'>>) => void;
  onDelete: () => void;
  onClose: () => void;
}

const RATINGS: SettingRating[] = [1, 2, 3, 4, 5];
const RATING_COLOR: Record<SettingRating, string> = {
  1: 'bg-red-500 text-white',
  2: 'bg-orange-400 text-white',
  3: 'bg-yellow-400 text-gray-800',
  4: 'bg-lime-500 text-white',
  5: 'bg-green-600 text-white',
};
const RATING_INACTIVE = 'bg-gray-100 text-gray-500 border border-gray-300';

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

export default function DailyMachineModal({ machine, daily, date, onSave, onDelete, onClose }: Props) {
  const [rating, setRating] = useState<SettingRating | undefined>(daily?.settingRating);
  const [medalDiff, setMedalDiff] = useState(daily?.medalDiff?.toString() ?? '');
  const [rotationRate, setRotationRate] = useState(daily?.rotationRate?.toString() ?? '');
  const [memo, setMemo] = useState(daily?.memo ?? '');

  function handleSave() {
    onSave({
      settingRating: rating,
      medalDiff: medalDiff !== '' ? Number(medalDiff) : undefined,
      rotationRate: rotationRate !== '' ? Number(rotationRate) : undefined,
      memo: memo.trim() || undefined,
    });
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-2xl flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-gray-900">台 {machine.number}</span>
              {machine.modelName && (
                <span className="ml-2 text-sm text-gray-500">{machine.modelName}</span>
              )}
            </div>
            <button className="text-gray-400 active:text-gray-600 p-1 text-lg" onClick={onClose}>✕</button>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(date)}</p>
        </div>

        {/* フォーム */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
          {/* 設定評価 */}
          <div>
            <label className="text-sm font-medium text-gray-600">設定評価</label>
            <div className="flex gap-2 mt-1.5">
              {RATINGS.map(r => (
                <button
                  key={r}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                    rating === r ? RATING_COLOR[r] : RATING_INACTIVE
                  }`}
                  onClick={() => setRating(rating === r ? undefined : r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 差枚数 */}
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

          {/* 回転率 */}
          <div>
            <label className="text-sm font-medium text-gray-600">回転率</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              className={`mt-1 ${inputCls}`}
              placeholder="例：20.5"
              value={rotationRate}
              onChange={e => setRotationRate(e.target.value)}
            />
          </div>

          {/* メモ */}
          <div>
            <label className="text-sm font-medium text-gray-600">メモ</label>
            <textarea
              className={`mt-1 ${inputCls} resize-none`}
              rows={3}
              placeholder="気になった点など"
              value={memo}
              onChange={e => setMemo(e.target.value)}
            />
          </div>
        </div>

        {/* ボタン */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          {daily && (
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
