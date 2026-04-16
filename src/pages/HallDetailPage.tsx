import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Map } from 'lucide-react';
import { hallStore, calendarStore } from '../store';
import { Hall, CalendarEntry, ParkingType } from '../types';
import {
  TextRow, NumberRow, ToggleRow, LinkRow, SelectRow,
  AnniversaryRow, PropSection,
} from '../components/HallPropertyRow';
import CalendarView from '../components/CalendarView';
import CalendarEntryModal from '../components/CalendarEntryModal';
import { PREFECTURES } from '../constants';

const PARKING_OPTIONS = [
  { value: 'free', label: '無料' },
  { value: 'paid', label: '有料' },
  { value: 'none', label: 'なし' },
];

const PREDEFINED_LINKS = ['MAP', 'p-world', 'ホールナビ', 'みんパチ', 'アナスロ', 'クロロ'] as const;

export default function HallDetailPage() {
  const { hallId } = useParams<{ hallId: string }>();
  const navigate = useNavigate();

  const [hall, setHall] = useState<Hall | undefined>(
    () => hallStore.getAll().find(h => h.id === hallId)
  );
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>(
    () => calendarStore.getByHall(hallId!)
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

  // ─── ホール更新 ────────────────────────────────────────────

  function update(patch: Partial<Omit<Hall, 'id' | 'createdAt'>>) {
    hallStore.update(hall!.id, patch);
    setHall(prev => ({ ...prev!, ...patch }));
  }

  // ─── リンク ───────────────────────────────────────────────

  function getLink(label: string): string {
    return hall!.links?.find(l => l.label === label)?.url ?? '';
  }

  function saveLink(label: string, url: string) {
    const existing = hall!.links ?? [];
    const filtered = existing.filter(l => l.label !== label);
    update({ links: url ? [...filtered, { label, url }] : filtered });
  }

  // カスタムリンク（定義済み以外）
  const customLinks = (hall!.links ?? []).filter(
    l => !PREDEFINED_LINKS.includes(l.label as typeof PREDEFINED_LINKS[number])
  );

  // ─── メモ（自動保存） ─────────────────────────────────────

  function handleMemoChange(text: string) {
    setMemo(text);
    if (memoTimer.current) clearTimeout(memoTimer.current);
    memoTimer.current = setTimeout(() => {
      hallStore.update(hall!.id, { notes: text });
    }, 800);
  }

  // ─── カレンダー ───────────────────────────────────────────

  function refreshCalendar() {
    setCalendarEntries(calendarStore.getByHall(hallId!));
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
          <Map size={14} />
          島図
        </button>
      </header>

      {/* スクロールコンテンツ */}
      <div className="flex-1 overflow-y-auto pb-10">

        {/* ─── プロパティ ─── */}
        <div className="bg-white mt-3 mx-3 rounded-xl shadow overflow-hidden">
          <PropSection title="基本情報" />
          <TextRow
            label="系列"
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
          <TextRow
            label="閉店情報"
            value={hall.closingInfo ?? ''}
            onSave={v => update({ closingInfo: v || undefined })}
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
          <ToggleRow
            label="貯メダル"
            value={hall.savedMedals ?? false}
            onChange={v => update({ savedMedals: v })}
          />
          <ToggleRow
            label="貯玉"
            value={hall.savedBalls ?? false}
            onChange={v => update({ savedBalls: v })}
          />
          <SelectRow
            label="駐車場"
            value={hall.parking}
            options={PARKING_OPTIONS}
            onChange={v => update({ parking: v as ParkingType | undefined })}
          />

          <PropSection title="リンク" />
          {PREDEFINED_LINKS.map(label => (
            <LinkRow
              key={label}
              label={label}
              url={getLink(label)}
              onSave={url => saveLink(label, url)}
            />
          ))}
          {customLinks.map(link => (
            <LinkRow
              key={link.label}
              label={link.label}
              url={link.url}
              onSave={url => saveLink(link.label, url)}
            />
          ))}
        </div>

        {/* ─── カレンダー ─── */}
        <div className="mt-4 mx-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">カレンダー</p>
          {/* CalendarView は flex-1 h-full 前提のため高さ固定コンテナに収める */}
          <div className="bg-white rounded-xl shadow overflow-hidden" style={{ height: 520 }}>
            <CalendarView
              entries={calendarEntries}
              onDayClick={date => setCalendarDate(date)}
            />
          </div>
        </div>

        {/* ─── 自由メモ ─── */}
        <div className="mt-4 mx-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">メモ</p>
          <div className="bg-white rounded-xl shadow p-4">
            <textarea
              className="w-full text-sm text-gray-800 outline-none resize-none placeholder-gray-300 leading-relaxed"
              rows={6}
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
            setCalendarDate(null);
          }}
          onDelete={() => {
            calendarStore.delete(hallId!, calendarDate);
            refreshCalendar();
            setCalendarDate(null);
          }}
          onGoToMap={() => {
            navigate(`/halls/${hallId}/map`);
            setCalendarDate(null);
          }}
          onClose={() => setCalendarDate(null)}
        />
      )}
    </div>
  );
}
