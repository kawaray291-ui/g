import { useState } from 'react';
import { Island } from '../types';

interface Props {
  islands: Island[];
  defaultIslandId?: string;
  onAdd: (islandId: string, number: string, modelName: string, shortMemo: string) => void;
  onClose: () => void;
}

export default function AddMachineModal({ islands, defaultIslandId, onAdd, onClose }: Props) {
  const [islandId, setIslandId]   = useState(defaultIslandId ?? islands[0]?.id ?? '');
  const [number, setNumber]       = useState('');
  const [modelName, setModelName] = useState('');
  const [shortMemo, setShortMemo] = useState('');

  function handleAdd() {
    if (!number.trim()) return;
    onAdd(islandId, number.trim(), modelName.trim(), shortMemo.trim());
  }

  const inputCls =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-2xl flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">台を追加</h2>
          <button className="text-gray-400 active:text-gray-600 p-1 text-lg" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* フォーム */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
          {islands.length > 1 && (
            <div>
              <label className="text-sm font-medium text-gray-600">島</label>
              <select
                className={`mt-1 ${inputCls} bg-white`}
                value={islandId}
                onChange={e => setIslandId(e.target.value)}
              >
                {islands.map(isl => (
                  <option key={isl.id} value={isl.id}>{isl.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-600">台番号 <span className="text-red-500">*</span></label>
            <input
              type="text"
              inputMode="numeric"
              className={`mt-1 ${inputCls}`}
              placeholder="例：101"
              value={number}
              onChange={e => setNumber(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">機種名</label>
            <input
              type="text"
              className={`mt-1 ${inputCls}`}
              placeholder="例：Lゴッドイーター"
              value={modelName}
              onChange={e => setModelName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">一言メモ</label>
            <input
              type="text"
              className={`mt-1 ${inputCls}`}
              placeholder="例：角台、高設定濃厚"
              value={shortMemo}
              onChange={e => setShortMemo(e.target.value)}
            />
          </div>
        </div>

        {/* ボタン */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          <button
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium"
            onClick={onClose}
          >
            キャンセル
          </button>
          <button
            className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-medium active:bg-blue-800 disabled:opacity-40"
            disabled={!number.trim()}
            onClick={handleAdd}
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
}
