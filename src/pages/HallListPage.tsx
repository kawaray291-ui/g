import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Filter, X, ArrowUpDown, Tags, ArrowLeft } from 'lucide-react';
import { hallStore, chainTagStore } from '../store';
import { Hall, ChainTag } from '../types';
import ChainManagerModal from '../components/ChainManagerModal';
import HallCard from '../components/HallCard';
import HallFormModal, {
  EMPTY_HALL_FORM,
  hallToForm,
} from '../components/HallFormModal';

export default function HallListPage() {
  const navigate = useNavigate();
  const [halls, setHalls] = useState<Hall[]>(() => hallStore.getAll());
  const [chainTags, setChainTags] = useState<ChainTag[]>(() => chainTagStore.getAll());
  const [chainManagerOpen, setChainManagerOpen] = useState(false);

  // ─── フィルター ────────────────────────────────────────────
  const [filterChain, setFilterChain]           = useState('');
  const [filterPrefecture, setFilterPrefecture] = useState('');

  type SortKey = '' | 'medals-desc' | 'medals-asc' | 'chain-asc';
  const [sortKey, setSortKey] = useState<SortKey>('');

  const chains = useMemo(
    () => [...new Set(halls.map(h => h.chain).filter((c): c is string => !!c))].sort(),
    [halls],
  );
  const prefectures = useMemo(
    () => [...new Set(halls.map(h => h.prefecture).filter((p): p is string => !!p))].sort(),
    [halls],
  );
  const filtered = useMemo(() => {
    const base = halls.filter(h =>
      (!filterChain      || h.chain      === filterChain) &&
      (!filterPrefecture || h.prefecture === filterPrefecture)
    );
    const arr = [...base];
    switch (sortKey) {
      case 'medals-desc':
        return arr.sort((a, b) => (b.savedMedals ?? -1) - (a.savedMedals ?? -1));
      case 'medals-asc':
        return arr.sort((a, b) => (a.savedMedals ?? Infinity) - (b.savedMedals ?? Infinity));
      case 'chain-asc': {
        const tagOrder = new Map(chainTags.map((t, i) => [t.name, i]));
        return arr.sort((a, b) => {
          const ai = tagOrder.has(a.chain ?? '') ? tagOrder.get(a.chain!)! : Infinity;
          const bi = tagOrder.has(b.chain ?? '') ? tagOrder.get(b.chain!)! : Infinity;
          return ai - bi;
        });
      }
      default:
        return arr;
    }
  }, [halls, filterChain, filterPrefecture, sortKey]);
  const isFiltered = filterChain !== '' || filterPrefecture !== '';

  // ─── 追加 / 編集モーダル ───────────────────────────────────
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; hall?: Hall } | null>(null);

  function openAdd() {
    setModal({ mode: 'add' });
  }
  function openEdit(hall: Hall) {
    setModal({ mode: 'edit', hall });
  }
  function handleSave(data: Omit<Hall, 'id' | 'createdAt'>) {
    if (modal?.mode === 'add') {
      hallStore.add(data);
    } else if (modal?.mode === 'edit' && modal.hall) {
      hallStore.update(modal.hall.id, data);
    }
    setHalls(hallStore.getAll());
    setModal(null);
  }

  // ─── 削除 ─────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Hall | null>(null);

  function confirmDelete() {
    if (!deleteTarget) return;
    hallStore.delete(deleteTarget.id);
    setHalls(hallStore.getAll());
    setDeleteTarget(null);
  }

  // ─── 描画 ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-blue-800 text-white px-4 py-3 flex items-center gap-2 shadow">
        <button
          className="p-1 text-blue-200 active:text-white"
          onClick={() => navigate(-1)}
          aria-label="戻る"
        >
          <ArrowLeft size={22} />
        </button>
        <Building2 size={22} />
        <h1 className="text-lg font-bold flex-1">パチンコホール管理</h1>
        {halls.length > 0 && (
          <span className="text-xs text-blue-200">{filtered.length}/{halls.length}件</span>
        )}
        <button
          className="p-2 text-blue-200 active:text-white"
          onClick={() => setChainManagerOpen(true)}
          title="系列管理"
        >
          <Tags size={20} />
        </button>
      </header>

      {/* フィルター・並び替えバー（1件以上ある場合のみ表示） */}
      {halls.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-3 py-2 flex flex-col gap-2">
          {/* フィルター行 */}
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-gray-400 shrink-0" />
            <select
              className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 outline-none min-w-0"
              value={filterChain}
              onChange={e => setFilterChain(e.target.value)}
            >
              <option value="">系列: すべて</option>
              {chains.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 outline-none min-w-0"
              value={filterPrefecture}
              onChange={e => setFilterPrefecture(e.target.value)}
            >
              <option value="">都道府県: すべて</option>
              {prefectures.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {isFiltered && (
              <button
                className="shrink-0 text-xs text-blue-600 font-medium flex items-center gap-0.5 active:text-blue-800"
                onClick={() => { setFilterChain(''); setFilterPrefecture(''); }}
              >
                <X size={12} />クリア
              </button>
            )}
          </div>
          {/* 並び替え行 */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={13} className="text-gray-400 shrink-0" />
            <select
              className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 outline-none"
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
            >
              <option value="">並び替え: デフォルト</option>
              <option value="medals-desc">貯メダル: 多い順</option>
              <option value="medals-asc">貯メダル: 少ない順</option>
              <option value="chain-asc">系列: タグ順</option>
            </select>
          </div>
        </div>
      )}

      {/* ホール一覧 */}
      <div className="flex-1 overflow-y-auto pt-3 pb-24">
        {halls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
            <Building2 size={48} strokeWidth={1} />
            <p className="text-sm">ホールを追加してください</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <Filter size={32} strokeWidth={1} />
            <p className="text-sm">条件に一致するホールがありません</p>
          </div>
        ) : (
          <ul>
            {filtered.map(hall => (
              <HallCard
                key={hall.id}
                hall={hall}
                chainTags={chainTags}
                onEdit={() => openEdit(hall)}
                onDelete={() => setDeleteTarget(hall)}
                onClick={() => navigate(`/halls/${hall.id}`)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* 追加FAB */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-700 text-white shadow-lg flex items-center justify-center active:bg-blue-800 z-10"
        onClick={openAdd}
        aria-label="ホールを追加"
      >
        <Plus size={28} />
      </button>

      {/* 系列管理モーダル */}
      {chainManagerOpen && (
        <ChainManagerModal
          onClose={() => {
            setChainManagerOpen(false);
            setChainTags(chainTagStore.getAll());  // タグ変更をカードに反映
          }}
        />
      )}

      {/* 追加 / 編集モーダル */}
      {modal && (
        <HallFormModal
          mode={modal.mode}
          initialForm={modal.hall ? hallToForm(modal.hall) : EMPTY_HALL_FORM}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* 削除確認 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-800">ホールを削除</h2>
            <p className="text-sm text-gray-600">
              「{deleteTarget.name}」とその全データ（島・台・メモ・来店記録）を削除します。
              この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium"
                onClick={() => setDeleteTarget(null)}
              >
                キャンセル
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium"
                onClick={confirmDelete}
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
