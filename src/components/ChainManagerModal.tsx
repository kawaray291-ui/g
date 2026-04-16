import { useState } from 'react';
import { X, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { chainTagStore, genId } from '../store';
import { ChainTag } from '../types';
import { CHAIN_PRESET_COLORS } from '../constants';

interface Props {
  onClose: () => void;
}

export default function ChainManagerModal({ onClose }: Props) {
  const [tags, setTags]           = useState<ChainTag[]>(() => chainTagStore.getAll());
  const [input, setInput]         = useState('');
  const [colorPickFor, setColorPickFor] = useState<string | null>(null);

  function persist(updated: ChainTag[]) {
    setTags(updated);
    chainTagStore.save(updated);
  }

  function addTag() {
    const name = input.trim();
    if (!name || tags.find(t => t.name === name)) { setInput(''); return; }
    const color = CHAIN_PRESET_COLORS[tags.length % CHAIN_PRESET_COLORS.length];
    persist([...tags, { id: genId(), name, color }]);
    setInput('');
  }

  function deleteTag(id: string) {
    persist(tags.filter(t => t.id !== id));
    if (colorPickFor === id) setColorPickFor(null);
  }

  function setColor(id: string, color: string) {
    persist(tags.map(t => t.id === id ? { ...t, color } : t));
    setColorPickFor(null);
  }

  function moveUp(i: number) {
    if (i === 0) return;
    const a = [...tags];
    [a[i - 1], a[i]] = [a[i], a[i - 1]];
    persist(a);
  }

  function moveDown(i: number) {
    if (i === tags.length - 1) return;
    const a = [...tags];
    [a[i], a[i + 1]] = [a[i + 1], a[i]];
    persist(a);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-2xl flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">系列タグ管理</h2>
          <button className="text-gray-400 active:text-gray-600 p-1 text-lg" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* タグ一覧 */}
        <div className="overflow-y-auto flex-1">
          {tags.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">タグがありません</p>
          )}
          {tags.map((tag, i) => (
            <div key={tag.id}>
              {/* タグ行 */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
                {/* カラー円（タップでピッカー開閉） */}
                <button
                  className="w-7 h-7 rounded-full shrink-0 border-2 border-white shadow-sm active:scale-95"
                  style={{ backgroundColor: tag.color }}
                  onClick={() => setColorPickFor(colorPickFor === tag.id ? null : tag.id)}
                  title="色を変更"
                />

                {/* タグ名 */}
                <span className="flex-1 text-sm font-medium text-gray-800">{tag.name}</span>

                {/* 上下ボタン */}
                <button
                  className="p-1 text-gray-400 active:text-blue-600 disabled:opacity-20"
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  className="p-1 text-gray-400 active:text-blue-600 disabled:opacity-20"
                  onClick={() => moveDown(i)}
                  disabled={i === tags.length - 1}
                >
                  <ChevronDown size={16} />
                </button>

                {/* 削除 */}
                <button
                  className="p-1 text-gray-300 active:text-red-500"
                  onClick={() => deleteTag(tag.id)}
                >
                  <X size={16} />
                </button>
              </div>

              {/* カラーピッカー（選択中タグのみ展開） */}
              {colorPickFor === tag.id && (
                <div className="flex flex-wrap gap-2.5 px-5 py-3 bg-gray-50 border-b border-gray-200">
                  {CHAIN_PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded-full border-[3px] active:scale-95 transition-transform"
                      style={{
                        backgroundColor: color,
                        borderColor: tag.color === color ? '#1e293b' : 'transparent',
                      }}
                      onClick={() => setColor(tag.id, color)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* タグ追加フォーム */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-2">
          <input
            className="flex-1 text-sm border border-gray-300 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
            placeholder="新しい系列名"
            autoFocus
          />
          <button
            className="shrink-0 flex items-center gap-1 text-sm text-white font-medium bg-blue-700 px-4 py-2.5 rounded-xl active:bg-blue-800 disabled:opacity-40"
            onClick={addTag}
            disabled={!input.trim()}
          >
            <Plus size={15} />追加
          </button>
        </div>
      </div>
    </div>
  );
}
