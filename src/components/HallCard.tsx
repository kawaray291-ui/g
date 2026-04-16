import { Pencil, Trash2, ChevronRight, ExternalLink } from 'lucide-react';
import { Hall, ChainTag } from '../types';

interface Props {
  hall: Hall;
  chainTags: ChainTag[];
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

// レートバッジの定義
const RATE_DEFS = [
  { key: 'pachinko4'  as const, label: 'P 4円',  cls: 'bg-blue-100 text-blue-800'   },
  { key: 'pachinko2'  as const, label: 'P 2円',  cls: 'bg-blue-100 text-blue-800'   },
  { key: 'pachinko1'  as const, label: 'P 1円',  cls: 'bg-sky-100  text-sky-800'    },
  { key: 'pachinko05' as const, label: 'P 0.5円', cls: 'bg-sky-100  text-sky-800'   },
  { key: 'slot20'     as const, label: 'S 20円', cls: 'bg-purple-100 text-purple-800' },
  { key: 'slot5'      as const, label: 'S 5円',  cls: 'bg-purple-100 text-purple-800' },
  { key: 'slot2'      as const, label: 'S 2円',  cls: 'bg-violet-100 text-violet-800' },
  { key: 'slot1'      as const, label: 'S 1円',  cls: 'bg-violet-100 text-violet-800' },
];

const PARKING_LABEL: Record<string, { text: string; cls: string }> = {
  free: { text: '🅿 無料', cls: 'bg-green-100 text-green-700' },
  paid: { text: '🅿 有料', cls: 'bg-amber-100 text-amber-700' },
  none: { text: '🅿 なし', cls: 'bg-gray-100 text-gray-500'  },
};

export default function HallCard({ hall, chainTags, onEdit, onDelete, onClick }: Props) {
  const activeRates = RATE_DEFS.filter(d => (hall.rates?.[d.key] ?? 0) > 0);
  const chainTag = hall.chain ? chainTags.find(t => t.name === hall.chain) : undefined;
  const parking = hall.parking ? PARKING_LABEL[hall.parking] : null;
  const hasAnni = hall.anniversaryMonth && hall.anniversaryDay;
  const hasMachineInfo =
    hall.totalMachines || hall.pachinkoCount || hall.slotCount || activeRates.length > 0;

  return (
    <li className="bg-white rounded-xl shadow mx-3 mb-3 overflow-hidden">
      {/* ── メインエリア（タップで島図へ） ── */}
      <div
        className="px-4 pt-3 pb-2 active:bg-gray-50 cursor-pointer"
        onClick={onClick}
      >
        {/* 行1: ホール名 + 系列タグ */}
        <div className="flex items-start gap-2">
          <p className="font-bold text-gray-900 text-base flex-1 leading-snug">{hall.name}</p>
          {hall.chain && (
            <span
              className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
              style={chainTag
                ? { backgroundColor: chainTag.color + '28', color: chainTag.color }
                : { backgroundColor: '#f3f4f6', color: '#6b7280' }
              }
            >
              {hall.chain}
            </span>
          )}
        </div>

        {/* 行2: 都道府県 + 周年 + 住所 */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
          {hall.prefecture && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {hall.prefecture}
            </span>
          )}
          {hasAnni && (
            <span className="text-xs text-orange-600 font-medium">
              🎊 {hall.anniversaryMonth}/{hall.anniversaryDay}周年
            </span>
          )}
          {hall.address && (
            <span className="text-xs text-gray-400 truncate">{hall.address}</span>
          )}
        </div>

        {/* 行3: レートバッジ */}
        {activeRates.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {activeRates.map(d => (
              <span key={d.key} className={`text-xs font-medium px-1.5 py-0.5 rounded ${d.cls}`}>
                {d.label} {hall.rates![d.key]}台
              </span>
            ))}
          </div>
        )}

        {/* 行4: 台数サマリー + 駐車場 */}
        {hasMachineInfo && (
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {hall.totalMachines && (
              <span className="text-xs text-gray-600">総 {hall.totalMachines}台</span>
            )}
            {(hall.pachinkoCount || hall.slotCount) && (
              <span className="text-xs text-gray-500">
                {[
                  hall.pachinkoCount ? `P:${hall.pachinkoCount}` : '',
                  hall.slotCount     ? `S:${hall.slotCount}`     : '',
                ].filter(Boolean).join(' / ')}
              </span>
            )}
            {parking && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${parking.cls}`}>
                {parking.text}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── アクションバー ── */}
      <div className="flex items-center border-t border-gray-100 px-3 py-1.5 gap-1">
        {/* リンク */}
        {(hall.links ?? []).length > 0 && (
          <div className="flex items-center gap-2 mr-auto">
            {hall.links!.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-xs text-blue-600 active:text-blue-800"
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink size={11} />
                {link.label || 'リンク'}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-0.5 ml-auto">
          <button
            className="p-2 text-gray-400 active:text-blue-600"
            onClick={e => { e.stopPropagation(); onEdit(); }}
            aria-label="編集"
          >
            <Pencil size={15} />
          </button>
          <button
            className="p-2 text-gray-400 active:text-red-600"
            onClick={e => { e.stopPropagation(); onDelete(); }}
            aria-label="削除"
          >
            <Trash2 size={15} />
          </button>
          <button
            className="p-1 text-gray-300"
            onClick={onClick}
            aria-label="島図を開く"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </li>
  );
}
