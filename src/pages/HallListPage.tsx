import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Pencil, Trash2, Building2 } from 'lucide-react';
import { hallStore } from '../store';
import { Hall } from '../types';

export default function HallListPage() {
  const navigate = useNavigate();
  const [halls, setHalls] = useState<Hall[]>(() => hallStore.getAll());
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; hall?: Hall } | null>(null);
  const [form, setForm] = useState({ name: '', address: '', notes: '' });
  const [deleteTarget, setDeleteTarget] = useState<Hall | null>(null);

  function openAdd() {
    setForm({ name: '', address: '', notes: '' });
    setModal({ mode: 'add' });
  }

  function openEdit(hall: Hall) {
    setForm({ name: hall.name, address: hall.address ?? '', notes: hall.notes ?? '' });
    setModal({ mode: 'edit', hall });
  }

  function saveHall() {
    if (!form.name.trim()) return;
    if (modal?.mode === 'add') {
      hallStore.add(form.name.trim(), form.address.trim() || undefined, form.notes.trim() || undefined);
    } else if (modal?.mode === 'edit' && modal.hall) {
      hallStore.update(modal.hall.id, {
        name: form.name.trim(),
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
    }
    setHalls(hallStore.getAll());
    setModal(null);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    hallStore.delete(deleteTarget.id);
    setHalls(hallStore.getAll());
    setDeleteTarget(null);
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-blue-800 text-white px-4 py-3 flex items-center gap-2 safe-top shadow">
        <Building2 size={22} />
        <h1 className="text-lg font-bold flex-1">パチンコホール管理</h1>
      </header>

      {/* ホール一覧 */}
      <div className="flex-1 overflow-y-auto">
        {halls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
            <Building2 size={48} strokeWidth={1} />
            <p className="text-sm">ホールを追加してください</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 bg-white mt-3 mx-3 rounded-xl overflow-hidden shadow">
            {halls.map(hall => (
              <li key={hall.id} className="flex items-center px-4 py-3 active:bg-gray-50">
                <button
                  className="flex-1 text-left"
                  onClick={() => navigate(`/halls/${hall.id}`)}
                >
                  <p className="font-semibold text-gray-900">{hall.name}</p>
                  {hall.address && <p className="text-xs text-gray-500 mt-0.5">{hall.address}</p>}
                </button>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    className="p-2 text-gray-400 active:text-blue-600"
                    onClick={() => openEdit(hall)}
                    aria-label="編集"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="p-2 text-gray-400 active:text-red-600"
                    onClick={() => setDeleteTarget(hall)}
                    aria-label="削除"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 追加FAB */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-700 text-white shadow-lg flex items-center justify-center active:bg-blue-800"
        onClick={openAdd}
        aria-label="ホールを追加"
      >
        <Plus size={28} />
      </button>

      {/* 追加/編集モーダル */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setModal(null)}>
          <div
            className="bg-white w-full rounded-t-2xl p-5 pb-8 flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-800">
              {modal.mode === 'add' ? 'ホールを追加' : 'ホールを編集'}
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium text-gray-600">ホール名 *</label>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500"
                  placeholder="例：パチンコホールA"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">住所</label>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500"
                  placeholder="例：東京都渋谷区..."
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">メモ</label>
                <textarea
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500 resize-none"
                  rows={2}
                  placeholder="自由メモ"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium active:bg-gray-100"
                onClick={() => setModal(null)}
              >
                キャンセル
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-medium active:bg-blue-800 disabled:opacity-40"
                onClick={saveHall}
                disabled={!form.name.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-800">ホールを削除</h2>
            <p className="text-sm text-gray-600">
              「{deleteTarget.name}」とその全データ（島・台・メモ・来店記録）を削除します。この操作は取り消せません。
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
