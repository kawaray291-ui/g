import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { chainTagStore, genId } from '../store';
import { ChainTag } from '../types';

interface Props {
  value: string;       // hall.chain（タグ名）
  onSave: (v: string) => void;
}

export default function ChainTagManager({ value, onSave }: Props) {
  const [tags, setTags]   = useState<ChainTag[]>(() => chainTagStore.getAll());
  const [input, setInput] = useState('');

  function persist(updated: ChainTag[]) {
    setTags(updated);
    chainTagStore.save(updated);
  }

  function addTag() {
    const name = input.trim();
    if (!name || tags.find(t => t.name === name)) { setInput(''); return; }
    persist([...tags, { id: genId(), name, color: '#6b7280' }]);
    setInput('');
  }

  function deleteTag(id: string) {
    const tag = tags.find(t => t.id === id);
    persist(tags.filter(t => t.id !== id));
    if (tag && value === tag.name) onSave('');
  }

  function toggleTag(tag: ChainTag) {
    onSave(value === tag.name ? '' : tag.name);
  }

  return (
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="flex items-start gap-3">
        <span className="text-sm text-gray-400 w-20 shrink-0 pt-0.5">系列</span>
        <div className="flex-1">
          {/* タグ一覧 */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.length === 0 && (
              <span className="text-sm text-gray-300">タグなし</span>
            )}
            {tags.map(tag => {
              const selected = value === tag.name;
              return (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-xs border select-none"
                  style={selected
                    ? { backgroundColor: tag.color, borderColor: tag.color, color: '#fff' }
                    : { backgroundColor: tag.color + '22', borderColor: tag.color + '66', color: tag.color }
                  }
                >
                  <button className="active:opacity-70" onClick={() => toggleTag(tag)}>
                    {tag.name}
                  </button>
                  <button
                    className="ml-0.5 rounded-full w-4 h-4 flex items-center justify-center active:bg-black/10"
                    style={{ color: selected ? 'rgba(255,255,255,0.7)' : tag.color + 'aa' }}
                    onClick={e => { e.stopPropagation(); deleteTag(tag.id); }}
                    title="タグを削除"
                  >
                    <X size={10} />
                  </button>
                </span>
              );
            })}
          </div>

          {/* 新規追加 */}
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
