import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Map } from 'lucide-react';
import { hallStore, calendarStore, dailySnapshotStore } from '../store';
import { Hall, CalendarEntry, ParkingType, ClosingStatus } from '../types';
import {
  TextRow, NumberRow, ToggleRow, SelectRow,
  AnniversaryRow, PropSection,
} from '../components/HallPropertyRow';
import ChainSelector from '../components/ChainSelector';
import HallLinkEditor from '../components/HallLinkEditor';
import CalendarView from '../components/CalendarView';
import CalendarEntryModal from '../components/CalendarEntryModal';
import { PREFECTURES } from '../constants';

const PARKING_OPTIONS = [
  { value: 'free', label: '無料' },
  { value: 'paid', label: '有料' },
  { value: 'none', label: 'なし' },
];

const CLOSING_OPTIONS = [
  { value: '休業', label: '休業' },
  { value: '閉店', label: '閉店' },
];

export default function HallDetailPage() {
  const { hallId } = useParams<{ hallId: string }>();
  const navigate = useNavigate();

  const [hall, setHall] = useState<Hall | undefined>(
    () => hallStore.getAll().find(h => h.id === hallId)
  );
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>(
    () => calendarStore.getByHall(hallId!)
  );
  const [snapshotDates, setSnapshotDates] = useState<Set<string>>(
    () => dailySnapshotStore.getDatesWithSnapshot(hallId!)
  );
  const [calendarDate, setCalendarDate] = useState<string | null>(null);
  const [memo, setMemo] = useState(() => hall?.notes ?? '');
  const memoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!hall) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">ホールが見つかりません</p>
      </div>
    );
  }

  function update(patch: Partial<Omit<Hall, 'id' | 'createdAt'>>) {
    hallStore.update(hall!.id, patch);
    setHall(prev => ({ ...prev!, ...patch }));
  }

  function handleMemoChange(text: string) {
    setMemo(text);
    if (memoTimer.current) clearTimeout(memoTimer.current);
    memoTimer.current = setTimeout(() => {
      hallStore.update(hall!.id, { notes: text });
    }, 800);
  }

  function refreshCalendar() {
    setCalendarEntries(calendarStore.getByHall(hallId!));
  }

  function refreshSnapshotDates() {
    setSnapshotDates(dailySnapshotStore.getDatesWithSnapshot(hallId!));
  }

  const prefectureOptions = PREFECTURES.map(p => ({ value: p, label: p }));

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate('/')} className="text-gray-500 active:opacity-70">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 truncate">{hall.name}</h1>
        <button
          className="flex items-center gap-1 text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1.5 rounded-full active:bg-blue-100"
          onClick={() => navigate(`/halls/${hallId}/map`)}
        >
          <Map size={14} />島図
        </button>
      </header>

      {/* スクロールコンテンツ */}
      <div className="flex-1 overflow-y-auto pb-10">

        {/* ─── プロパティ ─── */}
        <div className="bg-white mt-3 mx-3 rounded-xl shadow overflow-hidden">
          <PropSection title="基本情報" />

          {/* 系列タグ */}
          <ChainSelector
            value={hall.chain ?? ''}
            onSave={v => update({ chain: v || undefined })}
          />

          <SelectRow
            label="県"
            value={hall.prefecture}
            options={prefectureOptions}
            onChange={v => update({ prefecture: v })}
          />
          <AnniversaryRow
            month={hall.anniversaryMonth}
            day={hall.anniversaryDay}
            onSave={(m, d) => update({ anniversaryMonth: m, anniversaryDay: d })}
          />
          <TextRow
            label="特日"
            value={hall.specialDays ?? ''}
            placeholder="例：5の付く日"
            onSave={v => update({ specialDays: v || undefined })}
          />
          <TextRow
            label="住所"
            value={hall.address ?? ''}
            onSave={v => update({ address: v || undefined })}
          />
          <SelectRow
            label="閉店情報"
            value={hall.closingInfo}
            options={CLOSING_OPTIONS}
            onChange={v => update({ closingInfo: (v as ClosingStatus) || undefined })}
          />

          <PropSection title="台数" />
          <NumberRow
            label="スロット台数"
            value={hall.slotCount}
            onSave={v => update({ slotCount: v })}
          />
          <NumberRow
            label="パチンコ台数"
            value={hall.pachinkoCount}
            onSave={v => update({ pachinkoCount: v })}
          />

          <PropSection title="サービス・設備" />
          <ToggleRow
            label="20円なし"
            value={hall.hasNo20yen ?? false}
            onChange={v => update({ hasNo20yen: v })}
          />
          <NumberRow
            label="貯メダル（枚）"
            value={hall.savedMedals}
            placeholder="未設定"
            onSave={v => update({ savedMedals: v })}
          />
          <NumberRow
            label="貯玉（個）"
            value={hall.savedBalls}
            placeholder="未設定"
            onSave={v => update({ savedBalls: v })}
          />
          <SelectRow
            label="駐車場"
            value={hall.parking}
            options={PARKING_OPTIONS}
            onChange={v => update({ parking: v as ParkingType | undefined })}
          />

          {/* ③ 自由リンク */}
          <PropSection title="リンク" />
          <HallLinkEditor
            links={hall.links ?? []}
            onSave={links => update({ links })}
          />
        </div>

        {/* ─── カレンダー ─── */}
        <div className="mt-4 mx-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">カレンダー</p>
          <div className="bg-white rounded-xl shadow overflow-hidden" style={{ height: 520 }}>
            <CalendarView
              entries={calendarEntries}
              snapshotDates={snapshotDates}
              onDayClick={date => setCalendarDate(date)}
            />
          </div>
        </div>

        {/* ─── 自由メモ（① 2000px / スクロールなし） ─── */}
        <div className="mt-4 mx-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">メモ</p>
          <div className="bg-white rounded-xl shadow p-4">
            <textarea
              className="w-full text-sm text-gray-800 outline-none resize-none placeholder-gray-300 leading-relaxed"
              style={{ minHeight: '2000px', overflow: 'hidden' }}
              placeholder="ホールについての自由メモ（自動保存されます）"
              value={memo}
              onChange={e => handleMemoChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* カレンダー日付モーダル */}
      {calendarDate && (
        <CalendarEntryModal
          date={calendarDate}
          entry={calendarEntries.find(e => e.date === calendarDate)}
          onSave={data => {
            calendarStore.upsert(hallId!, calendarDate, data);
            refreshCalendar();
          }}
          onDelete={() => {
            calendarStore.delete(hallId!, calendarDate);
            refreshCalendar();
            setCalendarDate(null);
          }}
          onOpenDailyMap={() => {
            navigate(`/halls/${hallId}/map/daily/${calendarDate}`);
            setCalendarDate(null);
            refreshSnapshotDates();
          }}
          onClose={() => setCalendarDate(null)}
        />
      )}
    </div>
  );
}
