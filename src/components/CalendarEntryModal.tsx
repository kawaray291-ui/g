import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Map as MapIcon, Plus, X } from 'lucide-react';
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

type Row = { mediaId: string; eventIds: string[] };

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

  const allMediaSources  = mediaSourceStore.getAll();
  const allEventTemplates = eventTemplateStore.getAll();

  // 媒体+イベントの行リスト
  const [rows, setRows] = useState<Row[]>(() => {
    const ids = entry?.eventTemplateIds ?? [];
    if (ids.length === 0) return [{ mediaId: '', eventIds: [] }];
    // 保存済みのIDを媒体ごとにグループ化して復元
    const grouped = new Map<string, string[]>();
    ids.forEach(eid => {
      const ev = allEventTemplates.find(e => e.id === eid);
      if (ev) {
        const arr = grouped.get(ev.mediaSourceId) ?? [];
        arr.push(eid);
        grouped.set(ev.mediaSourceId, arr);
      }
    });
    const restored = Array.from(grouped.entries()).map(([mediaId, eventIds]) => ({ mediaId, eventIds }));
    return restored.length > 0 ? restored : [{ mediaId: '', eventIds: [] }];
  });

  const allSelectedIds = useMemo(
    () => rows.flatMap(r => r.eventIds),
    [rows],
  );

  const isFirstRender = useRef(true);
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildData = useCallback((): SaveData => {
    const medalDiffVal = medalAbs !== ''
      ? (medalSign === '-' ? -1 : 1) * Number(medalAbs)
      : undefined;
    return {
      memo,
      medalDiff:        medalDiffVal,
      avgRotation:      avgRotation !== '' ? Number(avgRotation) : undefined,
      queueCount:       queueCount  !== '' ? Number(queueCount)  : undefined,
      eventTemplateIds: allSelectedIds.length > 0 ? allSelectedIds : undefined,
    };
  }, [memo, medalSign, medalAbs, avgRotation, queueCount, allSelectedIds]);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSave(buildData());
      setHasSaved(true);
    }, 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [memo, medalSign, medalAbs, avgRotation, queueCount, allSelectedIds]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      onSave(buildData());
    }
    onClose();
  }

  function setRowMedia(idx: number, mediaId: string) {
    setRows(prev => prev.map((r, i) => i === idx ? { mediaId, eventIds: [] } : r));
  }

  function addEventToRow(idx: number, eventId: string) {
    if (!eventId) return;
    setRows(prev => prev.map((r, i) =>
      i === idx && !r.eventIds.includes(eventId)
        ? { ...r, eventIds: [...r.eventIds, eventId] }
        : r
    ));
  }

  function removeEventFromRow(idx: number, eventId: string) {
    setRows(prev => prev.map((r, i) =>
      i === idx ? { ...r, eventIds: r.eventIds.filter(id => id !== eventId) } : r
    ));
  }

  function addRow() {
    setRows(prev => [...prev, { mediaId: '', eventIds: [] }]);
  }

  function removeRow(idx: number) {
    setRows(prev => prev.length === 1 ? [{ mediaId: '', eventIds: [] }] : prev.filter((_, i) => i !== idx));
  }

  const selectCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none bg-white focus:border-blue-500';
  const inputCls  = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500';

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
            <MapIcon size={22} />
            島図
          </button>

          {/* イベント選択 */}
          {allMediaSources.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600">イベント</label>
              <div className="mt-2 flex flex-col gap-3">
                {rows.map((row, idx) => {
                  const mediaEvents = allEventTemplates.filter(e => e.mediaSourceId === row.mediaId);
                  const unselected  = mediaEvents.filter(e => !row.eventIds.includes(e.id));
                  return (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <div className="flex gap-2 items-center">
                        {/* 媒体ドロップダウン */}
                        <select
                          className={`flex-1 ${selectCls}`}
                          value={row.mediaId}
                          onChange={e => setRowMedia(idx, e.target.value)}
                        >
                          <option value="">媒体を選択</option>
                          {allMediaSources.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                        {/* 行削除ボタン（複数行のとき表示） */}
                        {rows.length > 1 && (
                          <button
                            type="button"
                            className="p-1.5 text-gray-400 active:text-red-500 shrink-0"
                            onClick={() => removeRow(idx)}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      {/* イベントドロップダウン（媒体選択後に表示） */}
                      {!!row.mediaId && (
                        <select
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none bg-white focus:border-blue-500 text-gray-600"
                          value=""
                          onChange={e => addEventToRow(idx, e.target.value)}
                        >
                          <option value="">
                            {unselected.length === 0 ? 'イベントがありません' : 'イベントを選択'}
                          </option>
                          {unselected.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.name}</option>
                          ))}
                        </select>
                      )}

                      {/* 選択済みイベントチップ */}
                      {row.eventIds.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {row.eventIds.map(eid => {
                            const ev = allEventTemplates.find(e => e.id === eid);
                            return (
                              <span
                                key={eid}
                                className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium rounded-full px-3 py-1.5"
                              >
                                {ev?.name ?? eid}
                                <button
                                  type="button"
                                  className="opacity-80 active:opacity-100"
                                  onClick={() => removeEventFromRow(idx, eid)}
                                >
                                  <X size={13} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 媒体を追加ボタン */}
                <button
                  type="button"
                  className="flex items-center gap-1 text-blue-600 text-sm font-medium active:text-blue-800 self-start"
                  onClick={addRow}
                >
                  <Plus size={15} />
                  媒体を追加
                </button>
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
