import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { chainTagStore } from '../store';

interface Props {
  value: string;          // 現在のホールの系列値
  onSave: (v: string) => void;
}

export default function ChainTagManager({ value, onSave }: Props) {
  const [tags, setTags]   = useState<string[]>(() => chainTagStore.getAll());
  const [input, setInput] = useState('');

  function addTag() {
    const tag = input.trim();
    if (!tag || tags.includes(tag)) { setInput(''); return; }
    const updated = [...tags, tag];
    setTags(updated);
    chainTagStore.save(updated);
    setInput('');
  }

  function deleteTag(tag: string) {
    const updated = tags.filter(t => t !== tag);
    setTags(updated);
    chainTagStore.save(updated);
    if (value === tag) onSave('');
  }

  function toggleTag(tag: string) {
    onSave(value === tag ? '' : tag);
  }

  return (
    <div className="px-4 py-3 border-b border-gray-100">
      {/* ラベル行 */}
      <div className="flex items-start gap-3">
        <span className="text-sm text-gray-400 w-20 shrink-0 pt-0.5">系列</span>
        <div className="flex-1">
          {/* タグ一覧 */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.length === 0 && (
              <span className="text-sm text-gray-300">タグなし</span>
            )}
            {tags.map(tag => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-xs border select-none ${
                  value === tag
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-700'
                }`}
              >
                {/* タグ選択 */}
                <button className="active:opacity-70" onClick={() => toggleTag(tag)}>
                  {tag}
                </button>
                {/* タグ削除 */}
                <button
                  className={`ml-0.5 rounded-full w-4 h-4 flex items-center justify-center active:bg-black/10 ${
                    value === tag ? 'text-blue-200' : 'text-gray-400'
                  }`}
                  onClick={e => { e.stopPropagation(); deleteTag(tag); }}
                  title="タグを削除"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>

          {/* 新規タグ追加 */}
          <div className="flex items-center gap-1.5">
            <input
              className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-400"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
              placeholder="新しい系列名"
            />
            <button
              className="shrink-0 flex items-center gap-1 text-sm text-blue-600 font-medium border border-blue-200 px-3 py-1.5 rounded-lg active:bg-blue-50"
              onClick={addTag}
            >
              <Plus size={14} />追加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
