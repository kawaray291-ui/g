import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Hall, HallRates, ParkingType, ChainTag } from '../types';
import { PREFECTURES } from '../constants';
import { chainTagStore } from '../store';

// ─── フォーム型 ───────────────────────────────────────────────
export interface HallFormState {
  name: string;
  chain: string;
  prefecture: string;
  address: string;
  notes: string;
  totalMachines: string;
  slotCount: string;
  pachinkoCount: string;
  parking: '' | ParkingType;
  anniversaryMonth: string;
  anniversaryDay: string;
  links: { label: string; url: string }[];
  // レート（台数）
  pachinko4: string;
  pachinko2: string;
  pachinko1: string;
  pachinko05: string;
  slot20: string;
  slot5: string;
  slot2: string;
  slot1: string;
}

export const EMPTY_HALL_FORM: HallFormState = {
  name: '', chain: '', prefecture: '', address: '', notes: '',
  totalMachines: '', slotCount: '', pachinkoCount: '',
  parking: '', anniversaryMonth: '', anniversaryDay: '',
  links: [],
  pachinko4: '', pachinko2: '', pachinko1: '', pachinko05: '',
  slot20: '', slot5: '', slot2: '', slot1: '',
};

/** Hall → フォーム初期値 */
export function hallToForm(hall: Hall): HallFormState {
  const r = hall.rates ?? {};
  return {
    name: hall.name,
    chain: hall.chain ?? '',
    prefecture: hall.prefecture ?? '',
    address: hall.address ?? '',
    notes: hall.notes ?? '',
    totalMachines: hall.totalMachines?.toString() ?? '',
    slotCount: hall.slotCount?.toString() ?? '',
    pachinkoCount: hall.pachinkoCount?.toString() ?? '',
    parking: hall.parking ?? '',
    anniversaryMonth: hall.anniversaryMonth?.toString() ?? '',
    anniversaryDay: hall.anniversaryDay?.toString() ?? '',
    links: hall.links ? hall.links.map(l => ({ ...l })) : [],
    pachinko4:  r.pachinko4?.toString()  ?? '',
    pachinko2:  r.pachinko2?.toString()  ?? '',
    pachinko1:  r.pachinko1?.toString()  ?? '',
    pachinko05: r.pachinko05?.toString() ?? '',
    slot20: r.slot20?.toString() ?? '',
    slot5:  r.slot5?.toString()  ?? '',
    slot2:  r.slot2?.toString()  ?? '',
    slot1:  r.slot1?.toString()  ?? '',
  };
}

/** フォーム → Hall保存用データ */
export function formToHallData(f: HallFormState): Omit<Hall, 'id' | 'createdAt'> {
  const rates: HallRates = {};
  if (f.pachinko4)  rates.pachinko4  = Number(f.pachinko4);
  if (f.pachinko2)  rates.pachinko2  = Number(f.pachinko2);
  if (f.pachinko1)  rates.pachinko1  = Number(f.pachinko1);
  if (f.pachinko05) rates.pachinko05 = Number(f.pachinko05);
  if (f.slot20) rates.slot20 = Number(f.slot20);
  if (f.slot5)  rates.slot5  = Number(f.slot5);
  if (f.slot2)  rates.slot2  = Number(f.slot2);
  if (f.slot1)  rates.slot1  = Number(f.slot1);
  return {
    name: f.name.trim(),
    chain: f.chain.trim() || undefined,
    prefecture: f.prefecture || undefined,
    address: f.address.trim() || undefined,
    notes: f.notes.trim() || undefined,
    totalMachines: f.totalMachines  ? Number(f.totalMachines)  : undefined,
    slotCount:     f.slotCount      ? Number(f.slotCount)      : undefined,
    pachinkoCount: f.pachinkoCount  ? Number(f.pachinkoCount)  : undefined,
    parking: f.parking || undefined,
    anniversaryMonth: f.anniversaryMonth ? Number(f.anniversaryMonth) : undefined,
    anniversaryDay:   f.anniversaryDay   ? Number(f.anniversaryDay)   : undefined,
    links: f.links.filter(l => l.url.trim()),
    rates: Object.keys(rates).length > 0 ? rates : undefined,
  };
}

// ─── 共通スタイル ─────────────────────────────────────────────
const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500';
const numInputCls = 'w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-blue-500 text-center';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide pt-1 pb-0.5 border-t border-gray-100 mt-1">
      {children}
    </p>
  );
}

// ─── モーダル本体 ─────────────────────────────────────────────
interface Props {
  mode: 'add' | 'edit';
  initialForm: HallFormState;
  onSave: (data: Omit<Hall, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export default function HallFormModal({ mode, initialForm, onSave, onClose }: Props) {
  const [form, setForm] = useState<HallFormState>(initialForm);
  const [chainTags] = useState<ChainTag[]>(() => chainTagStore.getAll());
  const set = (patch: Partial<HallFormState>) => setForm(f => ({ ...f, ...patch }));

  function addLink() {
    set({ links: [...form.links, { label: '', url: '' }] });
  }
  function updateLink(i: number, field: 'label' | 'url', value: string) {
    setForm(f => ({
      ...f,
      links: f.links.map((l, j) => j === i ? { ...l, [field]: value } : l),
    }));
  }
  function removeLink(i: number) {
    setForm(f => ({ ...f, links: f.links.filter((_, j) => j !== i) }));
  }

  function handleSave() {
    if (!form.name.trim()) return;
    onSave(formToHallData(form));
  }

  const parkingOptions: { value: '' | ParkingType; label: string }[] = [
    { value: '',     label: '未設定' },
    { value: 'free', label: 'あり（無料）' },
    { value: 'paid', label: 'あり（有料）' },
    { value: 'none', label: 'なし' },
  ];

  const pachinkoRates: { key: keyof HallFormState; label: string }[] = [
    { key: 'pachinko4',  label: '4円' },
    { key: 'pachinko2',  label: '2円' },
    { key: 'pachinko1',  label: '1円' },
    { key: 'pachinko05', label: '0.5円' },
  ];
  const slotRates: { key: keyof HallFormState; label: string }[] = [
    { key: 'slot20', label: '20円' },
    { key: 'slot5',  label: '5円' },
    { key: 'slot2',  label: '2円' },
    { key: 'slot1',  label: '1円' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-2xl flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {mode === 'add' ? 'ホールを追加' : 'ホールを編集'}
          </h2>
          <button className="text-gray-400 active:text-gray-600 p-1" onClick={onClose}>✕</button>
        </div>

        {/* スクロールエリア */}
        <div className="overflow-y-auto flex-1 px-5 py-3 flex flex-col gap-3">

          {/* ── 基本情報 ── */}
          <SectionTitle>基本情報</SectionTitle>

          <div>
            <label className="text-sm font-medium text-gray-600">ホール名 *</label>
            <input className={`mt-1 ${inputCls}`} placeholder="例：マルハン渋谷店"
              value={form.name} onChange={e => set({ name: e.target.value })} autoFocus />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600">系列名</label>
              <div className="mt-1 relative border border-gray-300 rounded-lg px-3 py-2 min-h-[42px] flex items-center bg-white">
                {(() => {
                  const tag = chainTags.find(t => t.name === form.chain);
                  return tag ? (
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border pointer-events-none"
                      style={{ backgroundColor: tag.color + '28', borderColor: tag.color + '55', color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 pointer-events-none">なし</span>
                  );
                })()}
                <select
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={form.chain}
                  onChange={e => set({ chain: e.target.value })}
                >
                  <option value="">なし</option>
                  {chainTags.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600">都道府県</label>
              <select className={`mt-1 ${inputCls} bg-white`}
                value={form.prefecture} onChange={e => set({ prefecture: e.target.value })}>
                <option value="">選択</option>
                {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">住所</label>
            <input className={`mt-1 ${inputCls}`} placeholder="例：東京都渋谷区..."
              value={form.address} onChange={e => set({ address: e.target.value })} />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">周年月日</label>
            <div className="flex gap-2 mt-1 items-center">
              <input type="number" inputMode="numeric" className={`${numInputCls} w-16`}
                placeholder="月" min={1} max={12}
                value={form.anniversaryMonth} onChange={e => set({ anniversaryMonth: e.target.value })} />
              <span className="text-gray-500 text-sm">月</span>
              <input type="number" inputMode="numeric" className={`${numInputCls} w-16`}
                placeholder="日" min={1} max={31}
                value={form.anniversaryDay} onChange={e => set({ anniversaryDay: e.target.value })} />
              <span className="text-gray-500 text-sm">日</span>
            </div>
          </div>

          {/* ── 台数 ── */}
          <SectionTitle>台数</SectionTitle>

          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'totalMachines'  as const, label: '総台数' },
              { key: 'pachinkoCount' as const, label: 'パチンコ' },
              { key: 'slotCount'     as const, label: 'スロット' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-gray-500">{label}</label>
                <input type="number" inputMode="numeric" className={`mt-1 ${numInputCls}`}
                  placeholder="0" value={form[key]}
                  onChange={e => set({ [key]: e.target.value } as Partial<HallFormState>)} />
              </div>
            ))}
          </div>

          {/* ── レート ── */}
          <SectionTitle>レートごとの台数</SectionTitle>

          <div>
            <p className="text-xs text-gray-500 mb-1">パチンコ（円/玉）</p>
            <div className="grid grid-cols-4 gap-2">
              {pachinkoRates.map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500">{label}</label>
                  <input type="number" inputMode="numeric" className={`mt-1 ${numInputCls}`}
                    placeholder="0" value={form[key] as string}
                    onChange={e => set({ [key]: e.target.value } as Partial<HallFormState>)} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">スロット（円/枚）</p>
            <div className="grid grid-cols-4 gap-2">
              {slotRates.map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500">{label}</label>
                  <input type="number" inputMode="numeric" className={`mt-1 ${numInputCls}`}
                    placeholder="0" value={form[key] as string}
                    onChange={e => set({ [key]: e.target.value } as Partial<HallFormState>)} />
                </div>
              ))}
            </div>
          </div>

          {/* ── 駐車場 ── */}
          <SectionTitle>駐車場</SectionTitle>

          <div className="flex gap-2">
            {parkingOptions.map(opt => (
              <button key={opt.value}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  form.parking === opt.value
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'border-gray-300 text-gray-600'
                }`}
                onClick={() => set({ parking: opt.value })}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* ── リンク ── */}
          <SectionTitle>各種サイトリンク</SectionTitle>

          {form.links.map((link, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex flex-col gap-1 flex-1">
                <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                  placeholder="ラベル（例：公式サイト）"
                  value={link.label} onChange={e => updateLink(i, 'label', e.target.value)} />
                <input type="url"
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                  placeholder="https://..."
                  value={link.url} onChange={e => updateLink(i, 'url', e.target.value)} />
              </div>
              <button className="p-1.5 text-red-400 active:text-red-600 mt-1"
                onClick={() => removeLink(i)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button className="text-sm text-blue-600 font-medium text-left active:text-blue-800"
            onClick={addLink}>
            ＋ リンクを追加
          </button>

          {/* ── メモ ── */}
          <SectionTitle>メモ</SectionTitle>

          <textarea className={`${inputCls} resize-none`} rows={3} placeholder="自由メモ"
            value={form.notes} onChange={e => set({ notes: e.target.value })} />
        </div>

        {/* 保存ボタン */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium"
            onClick={onClose}>
            キャンセル
          </button>
          <button
            className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-medium disabled:opacity-40"
            onClick={handleSave}
            disabled={!form.name.trim()}>
            {mode === 'add' ? '追加' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
