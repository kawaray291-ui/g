import { useState, useEffect, useRef, useCallback } from 'react';
import { Map } from 'lucide-react';
import { CalendarEntry } from '../types';
import { mediaSourceStore, eventTemplateStore } from '../store';

interface SaveData {
  memo: string;
  medalDiff?: number;
  avgRotation?: number;
  queueCount?: number;
  eventTemplateIds?: string[];
}

interface Props {
  date: string;
  entry?: CalendarEntry;
  onSave: (data: SaveData) => void;
  onDelete: () => void;
  onOpenDailyMap: () => void;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

export default function CalendarEntryModal({
  date, entry, onSave, onDelete, onOpenDailyMap, onClose,
}: Props) {
  const [memo, setMemo]           = useState(entry?.memo ?? '');
  const [medalSign, setMedalSign] = useState<'+' | '-'>(
    entry?.medalDiff !== undefined && entry.medalDiff < 0 ? '-' : '+'
  );
  const [medalAbs, setMedalAbs]   = useState(
    entry?.medalDiff !== undefined ? Math.abs(entry.medalDiff).toString() : ''
  );
  const [avgRotation, setAvgRotation] = useState(entry?.avgRotation?.toString() ?? '');
  const [queueCount, setQueueCount]   = useState(entry?.queueCount?.toString() ?? '');
  const [hasSaved, setHasSaved]       = useState(entry !== undefined);

  // 複数媒体・複数イベント選択
  const allMediaSources = mediaSourceStore.getAll();
  const allEventTemplates = eventTemplateStore.getAll();

  // 選択済みイベントIDのSet
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(
    () => new Set(entry?.eventTemplateIds ?? [])
  );

  // 選択済みイベントが属する媒体IDのSet（展開済み媒体）
  const [openMediaIds, setOpenMediaIds] = useState<Set<string>>(() => {
    const ids = entry?.eventTemplateIds ?? [];
    const mediaIds = new Set<string>();
    ids.forEach(eid => {
      const ev = allEventTemplates.find(e => e.id === eid);
      if (ev) mediaIds.add(ev.mediaSourceId);
    });
    return mediaIds;
  });

  const isFirstRender = useRef(true);
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildData = useCallback((): SaveData => {
    const medalDiffVal = medalAbs !== ''
      ? (medalSign === '-' ? -1 : 1) * Number(medalAbs)
      : undefined;
    const ids = Array.from(selectedEventIds);
    return {
      memo,
      medalDiff:        medalDiffVal,
      avgRotation:      avgRotation !== '' ? Number(avgRotation) : undefined,
      queueCount:       queueCount  !== '' ? Number(queueCount)  : undefined,
      eventTemplateIds: ids.length > 0 ? ids : undefined,
    };
  }, [memo, medalSign, medalAbs, avgRotation, queueCount, selectedEventIds]);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSave(buildData());
      setHasSaved(true);
    }, 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [memo, medalSign, medalAbs, avgRotation, queueCount, selectedEventIds]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      onSave(buildData());
    }
    onClose();
  }

  function toggleMedia(mediaId: string) {
    setOpenMediaIds(prev => {
      const next = new Set(prev);
      if (next.has(mediaId)) {
        next.delete(mediaId);
        // その媒体のイベント選択も解除
        const mediaEventIds = allEventTemplates
          .filter(e => e.mediaSourceId === mediaId)
          .map(e => e.id);
        setSelectedEventIds(prevSel => {
          const s = new Set(prevSel);
          mediaEventIds.forEach(id => s.delete(id));
          return s;
        });
      } else {
        next.add(mediaId);
      }
      return next;
    });
  }

  function toggleEvent(eventId: string) {
    setSelectedEventIds(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  }

  const inputCls =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={handleClose}>
      <div
        className="bg-white w-full rounded-t-2xl flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">{formatDate(date)}</h2>
          <button className="text-gray-400 active:text-gray-600 p-1 text-lg" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* フォーム */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
          {/* 島図ボタン */}
          <button
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold rounded-xl active:bg-indigo-700"
            style={{ fontSize: 18, paddingTop: 16, paddingBottom: 16 }}
            onClick={onOpenDailyMap}
          >
            <Map size={22} />
            島図
          </button>

          {/* イベント選択（媒体複数・イベント複数） */}
          {allMediaSources.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600">イベント</label>
              <div className="mt-2 flex flex-col gap-2">
                {allMediaSources.map(media => {
                  const isOpen  = openMediaIds.has(media.id);
                  const events  = allEventTemplates.filter(e => e.mediaSourceId === media.id);
                  const selCount = events.filter(e => selectedEventIds.has(e.id)).length;
                  return (
                    <div key={media.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* 媒体トグル */}
                      <button
                        type="button"
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold active:bg-gray-50 ${
                          isOpen ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700'
                        }`}
                        onClick={() => toggleMedia(media.id)}
                      >
                        <span>{media.name}</span>
                        <span className="flex items-center gap-1.5">
                          {selCount > 0 && (
                            <span className="text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.5 font-bold">
                              {selCount}
                            </span>
                          )}
                          <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                        </span>
                      </button>

                      {/* イベント一覧 */}
                      {isOpen && (
                        <div className="px-3 pb-3 pt-1 bg-white flex flex-wrap gap-2 border-t border-gray-100">
                          {events.length === 0 ? (
                            <p className="text-xs text-gray-400 py-1">イベントがありません</p>
                          ) : events.map(ev => {
                            const active = selectedEventIds.has(ev.id);
                            return (
                              <button
                                key={ev.id}
                                type="button"
                                className={`px-3 py-1.5 rounded-full text-sm border font-medium ${
                                  active
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-600 border-gray-300 active:bg-gray-50'
                                }`}
                                onClick={() => toggleEvent(ev.id)}
                              >
                                {ev.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-600">予定・メモ</label>
            <textarea
              className={`mt-1 ${inputCls} resize-none`}
              rows={3}
              placeholder="当日の予定、狙い台、イベント情報など"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">差枚数</label>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex rounded-lg border border-gray-300 overflow-hidden shrink-0">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-bold ${medalSign === '+' ? 'bg-green-500 text-white' : 'text-gray-500 active:bg-gray-100'}`}
                  onClick={() => setMedalSign('+')}
                >
                  ＋
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-bold border-l border-gray-300 ${medalSign === '-' ? 'bg-red-500 text-white' : 'text-gray-500 active:bg-gray-100'}`}
                  onClick={() => setMedalSign('-')}
                >
                  −
                </button>
              </div>
              <input
                type="number"
                inputMode="numeric"
                className={`flex-1 ${inputCls}`}
                placeholder="例：3000"
                value={medalAbs}
                onChange={e => setMedalAbs(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">平均回転率</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              className={`mt-1 ${inputCls}`}
              placeholder="例：20.5"
              value={avgRotation}
              onChange={e => setAvgRotation(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">並び人数</label>
            <input
              type="number"
              inputMode="numeric"
              className={`mt-1 ${inputCls}`}
              placeholder="例：30"
              value={queueCount}
              onChange={e => setQueueCount(e.target.value)}
            />
          </div>
        </div>

        {/* 削除ボタン */}
        {(entry !== undefined || hasSaved) && (
          <div className="px-5 py-3 border-t border-gray-100">
            <button
              className="px-4 py-2 rounded-xl border border-red-300 text-red-500 font-medium text-sm active:bg-red-50"
              onClick={onDelete}
            >
              削除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
