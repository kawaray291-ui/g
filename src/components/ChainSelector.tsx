import { useState } from 'react';
import { chainTagStore } from '../store';
import { ChainTag } from '../types';

interface Props {
  value: string;
  onSave: (v: string) => void;
}

export default function ChainSelector({ value, onSave }: Props) {
  const [tags] = useState<ChainTag[]>(() => chainTagStore.getAll());
  const tag = tags.find(t => t.name === value);

  return (
    <div className="flex items-center min-h-[44px] px-4 py-2 border-b border-gray-100 gap-3">
      <span className="text-sm text-gray-400 w-24 shrink-0 leading-tight">系列</span>
      <div className="flex-1 min-w-0 relative">
        {/* バッジ表示（ポインタイベントは select に委譲） */}
        <div className="pointer-events-none">
          {tag ? (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: tag.color + '28',
                borderColor: tag.color + '55',
                color: tag.color,
              }}
            >
              {tag.name}
            </span>
          ) : (
            <span className="text-sm text-gray-300">なし</span>
          )}
        </div>

        {/* ネイティブ select をオーバーレイして picker を起動 */}
        <select
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          value={value}
          onChange={e => onSave(e.target.value)}
        >
          <option value="">なし</option>
          {tags.map(t => (
            <option key={t.id} value={t.name}>{t.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
