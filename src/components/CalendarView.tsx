import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarEntry } from '../types';

interface Props {
  entries: CalendarEntry[];
  snapshotDates?: Set<string>;
  onDayClick: (date: string) => void;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/** YYYY-MM-DD 文字列を生成 */
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** その月のカレンダーグリッド用日付配列（日曜始まり、最大6週）を返す */
function buildGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const days: Date[] = [];

  // 先月末の埋め
  for (let i = first.getDay() - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  // 当月
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  // 来月頭の埋め（6行×7列=42マス揃える）
  const rest = 42 - days.length;
  for (let d = 1; d <= rest; d++) {
    days.push(new Date(year, month + 1, d));
  }
  return days;
}

/** エントリに応じた背景色 */
function dayBg(entry?: CalendarEntry, isCurrent = true): string {
  if (!isCurrent) return '';
  if (!entry) return '';
  if (entry.medalDiff !== undefined) {
    return entry.medalDiff >= 0 ? 'bg-green-50' : 'bg-red-50';
  }
  return 'bg-blue-50';
}

/** 差枚数の表示文字列 */
function fmtDiff(n: number): string {
  return (n >= 0 ? '+' : '') + n.toLocaleString();
}

export default function CalendarView({ entries, snapshotDates, onDayClick }: Props) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const todayStr = toDateStr(today);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }
  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  const grid = useMemo(() => buildGrid(year, month), [year, month]);

  const entryMap = useMemo(
    () => new Map(entries.map(e => [e.date, e])),
    [entries],
  );

  return (
    <div className="flex flex-col h-full">
      {/* 月ナビ */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <button
          className="p-2 text-gray-500 active:text-blue-600 rounded-full active:bg-blue-50"
          onClick={prevMonth}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-800">
            {year}年{month + 1}月
          </span>
          {(year !== today.getFullYear() || month !== today.getMonth()) && (
            <button
              className="text-xs text-blue-600 border border-blue-300 px-2 py-0.5 rounded-full active:bg-blue-50"
              onClick={goToday}
            >
              今月
            </button>
          )}
        </div>

        <button
          className="p-2 text-gray-500 active:text-blue-600 rounded-full active:bg-blue-50"
          onClick={nextMonth}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {WEEKDAYS.map((wd, i) => (
          <div
            key={wd}
            className={`text-center text-xs font-medium py-1.5 ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 flex-1 overflow-y-auto">
        {grid.map((d, idx) => {
          const dateStr      = toDateStr(d);
          const isCurrent    = d.getMonth() === month;
          const isToday      = dateStr === todayStr;
          const entry        = entryMap.get(dateStr);
          const dow          = d.getDay(); // 0=日, 6=土
          const bg           = dayBg(entry, isCurrent);
          const hasSnapshot  = isCurrent && snapshotDates?.has(dateStr);

          return (
            <button
              key={idx}
              className={`
                min-h-[72px] p-1 border-b border-r border-gray-100 text-left flex flex-col
                active:brightness-95
                ${bg}
                ${isToday ? 'ring-2 ring-inset ring-blue-400' : ''}
              `}
              onClick={() => onDayClick(dateStr)}
            >
              {/* 日番号行（スナップショットドット付き） */}
              <span className="flex items-center justify-between w-full">
                <span className={`text-xs font-semibold leading-none ${
                !isCurrent
                  ? 'text-gray-300'
                  : isToday
                  ? 'text-blue-600'
                  : dow === 0
                  ? 'text-red-400'
                  : dow === 6
                  ? 'text-blue-400'
                  : 'text-gray-700'
                }`}>
                  {d.getDate()}
                </span>
                {hasSnapshot && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                )}
              </span>

              {/* データ表示 */}
              {entry && isCurrent && (
                <div className="mt-0.5 flex flex-col gap-0.5 overflow-hidden w-full">
                  {entry.queueCount !== undefined && (
                    <span className="text-xs text-indigo-600 font-medium leading-none">
                      👥{entry.queueCount}人
                    </span>
                  )}
                  {entry.medalDiff !== undefined && (
                    <span className={`text-xs font-bold leading-none ${
                      entry.medalDiff >= 0 ? 'text-green-700' : 'text-red-600'
                    }`}>
                      {fmtDiff(entry.medalDiff)}
                    </span>
                  )}
                  {entry.avgRotation !== undefined && (
                    <span className="text-xs text-gray-500 leading-none">
                      {entry.avgRotation}回転
                    </span>
                  )}
                  {entry.memo && (
                    <span className="text-xs text-gray-500 leading-snug line-clamp-2 break-all">
                      {entry.memo}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
