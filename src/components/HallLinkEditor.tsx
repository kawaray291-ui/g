import { useState } from 'react';
import { Plus, X, ExternalLink } from 'lucide-react';
import { HallLink } from '../types';

interface Props {
  links: HallLink[];
  onSave: (links: HallLink[]) => void;
}

export default function HallLinkEditor({ links, onSave }: Props) {
  // ローカルで編集中の行を管理（blurで親に保存）
  const [rows, setRows] = useState<HallLink[]>(links);

  function persist(updated: HallLink[]) {
    setRows(updated);
    // 空行は保存しない
    onSave(updated.filter(l => l.label.trim() || l.url.trim()));
  }

  function updateField(i: number, field: keyof HallLink, val: string) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  }

  function commitRow() {
    persist(rows);
  }

  function remove(i: number) {
    persist(rows.filter((_, idx) => idx !== i));
  }

  function add() {
    setRows(r => [...r, { label: '', url: '' }]);
  }

  return (
    <div>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100">
          {/* ラベル */}
          <input
            className="w-24 shrink-0 text-sm text-gray-600 bg-transparent outline-none border-b border-gray-200 focus:border-blue-400 py-0.5"
            value={row.label}
            onChange={e => updateField(i, 'label', e.target.value)}
            onBlur={() => commitRow()}
            placeholder="ラベル"
          />

          {/* URL */}
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            <input
              type="url"
              inputMode="url"
              className="flex-1 text-sm text-gray-900 bg-transparent outline-none border-b border-gray-200 focus:border-blue-400 py-0.5 min-w-0"
              value={row.url}
              onChange={e => updateField(i, 'url', e.target.value)}
              onBlur={() => commitRow()}
              placeholder="https://..."
            />
            {row.url.startsWith('http') && (
              <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-blue-500 active:opacity-70"
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink size={15} />
              </a>
            )}
          </div>

          {/* 削除 */}
          <button
            className="shrink-0 text-gray-300 active:text-red-500 p-0.5"
            onClick={() => remove(i)}
          >
            <X size={17} />
          </button>
        </div>
      ))}

      {/* 行追加 */}
      <button
        className="flex items-center gap-1.5 px-4 py-3 text-sm text-blue-600 font-medium w-full active:bg-blue-50"
        onClick={add}
      >
        <Plus size={15} />リンクを追加
      </button>
    </div>
  );
}
