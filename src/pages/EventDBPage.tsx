import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { mediaSourceStore, eventTemplateStore } from '../store';
import { MediaSource, EventTemplate } from '../types';

export default function EventDBPage() {
  const navigate = useNavigate();

  const [mediaSources, setMediaSources] = useState<MediaSource[]>(() => mediaSourceStore.getAll());
  const [eventsByMedia, setEventsByMedia] = useState<Record<string, EventTemplate[]>>(() => {
    const map: Record<string, EventTemplate[]> = {};
    mediaSourceStore.getAll().forEach(m => {
      map[m.id] = eventTemplateStore.getByMedia(m.id);
    });
    return map;
  });

  // アコーディオン開閉状態
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  // 媒体追加インラインフォーム
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [newMediaName, setNewMediaName] = useState('');

  // イベント追加インラインフォーム（媒体IDをキーに）
  const [addingEventFor, setAddingEventFor] = useState<string | null>(null);
  const [newEventName, setNewEventName] = useState('');

  function reload() {
    const sources = mediaSourceStore.getAll();
    setMediaSources(sources);
    const map: Record<string, EventTemplate[]> = {};
    sources.forEach(m => {
      map[m.id] = eventTemplateStore.getByMedia(m.id);
    });
    setEventsByMedia(map);
  }

  function toggleOpen(id: string) {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddMedia() {
    const name = newMediaName.trim();
    if (!name) return;
    mediaSourceStore.add(name);
    setNewMediaName('');
    setShowAddMedia(false);
    reload();
  }

  function handleDeleteMedia(id: string) {
    mediaSourceStore.delete(id);
    reload();
  }

  function handleAddEvent(mediaSourceId: string) {
    const name = newEventName.trim();
    if (!name) return;
    eventTemplateStore.add(mediaSourceId, name);
    setNewEventName('');
    setAddingEventFor(null);
    reload();
  }

  function handleDeleteEvent(id: string) {
    eventTemplateStore.delete(id);
    reload();
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-blue-800 text-white px-4 py-3 flex items-center gap-2 shadow">
        <button
          className="p-1 text-blue-200 active:text-white"
          onClick={() => navigate(-1)}
          aria-label="戻る"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold flex-1">イベントDB</h1>
        <button
          className="p-2 text-blue-200 active:text-white"
          onClick={() => { setShowAddMedia(true); setAddingEventFor(null); }}
          aria-label="媒体を追加"
        >
          <Plus size={22} />
        </button>
      </header>

      {/* 媒体追加インラインフォーム */}
      {showAddMedia && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex gap-2 items-center">
          <input
            autoFocus
            type="text"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500"
            placeholder="媒体名を入力"
            value={newMediaName}
            onChange={e => setNewMediaName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddMedia();
              if (e.key === 'Escape') { setShowAddMedia(false); setNewMediaName(''); }
            }}
          />
          <button
            className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium active:bg-blue-800"
            onClick={handleAddMedia}
          >
            追加
          </button>
          <button
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm active:bg-gray-50"
            onClick={() => { setShowAddMedia(false); setNewMediaName(''); }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 媒体一覧 */}
      <div className="flex-1 overflow-y-auto pb-8">
        {mediaSources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
            <p className="text-sm">媒体がありません。右上の＋ボタンで追加してください。</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {mediaSources.map(media => {
              const isOpen = openIds.has(media.id);
              const events = eventsByMedia[media.id] ?? [];
              return (
                <li key={media.id} className="bg-white">
                  {/* 媒体ヘッダー行 */}
                  <div className="flex items-center px-4 py-3 gap-2">
                    <button
                      className="flex-1 flex items-center gap-2 text-left active:opacity-70"
                      onClick={() => toggleOpen(media.id)}
                    >
                      {isOpen ? (
                        <ChevronDown size={18} className="text-gray-400 shrink-0" />
                      ) : (
                        <ChevronRight size={18} className="text-gray-400 shrink-0" />
                      )}
                      <span className="font-semibold text-gray-800">{media.name}</span>
                      <span className="text-xs text-gray-400 ml-1">{events.length}件</span>
                    </button>
                    <button
                      className="p-1.5 text-gray-400 active:text-red-500"
                      onClick={() => handleDeleteMedia(media.id)}
                      aria-label="媒体を削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* アコーディオン展開エリア */}
                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 pb-3">
                      {/* イベント一覧 */}
                      {events.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2">イベントがありません</p>
                      ) : (
                        <ul className="py-2 flex flex-col gap-1">
                          {events.map(ev => (
                            <li key={ev.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
                              <span className="flex-1 text-sm text-gray-700">{ev.name}</span>
                              <button
                                className="p-1 text-gray-400 active:text-red-500"
                                onClick={() => handleDeleteEvent(ev.id)}
                                aria-label="イベントを削除"
                              >
                                <Trash2 size={14} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* イベント追加エリア */}
                      {addingEventFor === media.id ? (
                        <div className="flex gap-2 items-center mt-1">
                          <input
                            autoFocus
                            type="text"
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                            placeholder="イベント名を入力"
                            value={newEventName}
                            onChange={e => setNewEventName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleAddEvent(media.id);
                              if (e.key === 'Escape') { setAddingEventFor(null); setNewEventName(''); }
                            }}
                          />
                          <button
                            className="px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-medium active:bg-blue-800"
                            onClick={() => handleAddEvent(media.id)}
                          >
                            追加
                          </button>
                          <button
                            className="px-2 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-xs active:bg-gray-50"
                            onClick={() => { setAddingEventFor(null); setNewEventName(''); }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          className="mt-1 flex items-center gap-1 text-blue-600 text-sm font-medium active:text-blue-800"
                          onClick={() => { setAddingEventFor(media.id); setNewEventName(''); }}
                        >
                          <Plus size={14} />
                          イベント追加
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
