import { useState } from 'react';
import { chainTagStore } from '../store';
import { ChainTag } from '../types';

interface Props {
  value: string;          // hall.chain（タグ名）
  onSave: (v: string) => void;
}

/** HallDetailPage 用：既存タグから1つだけ選ぶ（タップで選択・解除） */
export default function ChainSelector({ value, onSave }: Props) {
  const [tags] = useState<ChainTag[]>(() => chainTagStore.getAll());

  return (
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="flex items-start gap-3">
        <span className="text-sm text-gray-400 w-20 shrink-0 pt-0.5">系列</span>
        <div className="flex-1 flex flex-wrap gap-1.5">
          {tags.length === 0 ? (
            <span className="text-sm text-gray-300">
              ホール一覧の系列管理からタグを追加してください
            </span>
          ) : (
            tags.map(tag => {
              const selected = value === tag.name;
              return (
                <button
                  key={tag.id}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium border select-none active:opacity-70 transition-colors"
                  style={selected
                    ? { backgroundColor: tag.color, borderColor: tag.color, color: '#fff' }
                    : { backgroundColor: tag.color + '22', borderColor: tag.color + '55', color: tag.color }
                  }
                  onClick={() => onSave(selected ? '' : tag.name)}
                >
                  {tag.name}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
