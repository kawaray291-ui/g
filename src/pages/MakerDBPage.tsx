import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { makerStore } from '../store';
import { Maker } from '../types';

export default function MakerDBPage() {
  const navigate = useNavigate();
  const [makers, setMakers] = useState<Maker[]>(() => makerStore.getAll());
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  function reload() { setMakers(makerStore.getAll()); }

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    makerStore.add(name);
    setNewName('');
    setShowAdd(false);
    reload();
  }

  function startEdit(maker: Maker) {
    setEditingId(maker.id);
    setEditName(maker.name);
  }

  function saveEdit() {
    const name = editName.trim();
    if (!name || !editingId) return;
    makerStore.update(editingId, name);
    setEditingId(null);
    reload();
  }

  function handleDelete(id: string) {
    if (!window.confirm('このメーカーを削除しますか？')) return;
    makerStore.delete(id);
    reload();
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="bg-blue-800 text-white px-4 py-3 flex items-center gap-2 shadow">
        <button className="p-1 text-blue-200 active:text-white" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold flex-1">メーカーDB</h1>
        <button
          className="p-2 text-blue-200 active:text-white"
          onClick={() => { setShowAdd(true); setEditingId(null); }}
        >
          <Plus size={22} />
        </button>
      </header>

      {/* 追加フォーム */}
      {showAdd && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex gap-2 items-center">
          <input
            autoFocus
            type="text"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500"
            placeholder="メーカー名を入力"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setShowAdd(false); setNewName(''); }
            }}
          />
          <button
            className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium active:bg-blue-800"
            onClick={handleAdd}
          >
            追加
          </button>
          <button
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm active:bg-gray-50"
            onClick={() => { setShowAdd(false); setNewName(''); }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-8">
        {makers.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            メーカーがありません。右上の＋から追加してください。
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 bg-white mt-3 mx-3 rounded-xl overflow-hidden shadow">
            {makers.map(maker => (
              <li key={maker.id} className="px-4 py-3 flex items-center gap-3">
                {editingId === maker.id ? (
                  <>
                    <input
                      autoFocus
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-base outline-none focus:border-blue-500"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <button className="p-1.5 text-blue-600 active:text-blue-800" onClick={saveEdit}>
                      <Check size={16} />
                    </button>
                    <button className="p-1.5 text-gray-400 active:text-gray-600" onClick={() => setEditingId(null)}>
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-base font-medium text-gray-800">{maker.name}</span>
                    <button className="p-1.5 text-gray-400 active:text-blue-500" onClick={() => startEdit(maker)}>
                      <Pencil size={15} />
                    </button>
                    <button className="p-1.5 text-gray-400 active:text-red-500" onClick={() => handleDelete(maker.id)}>
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
