import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { CHAINS } from '../constants';

// ─── 行シェル ──────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center min-h-[44px] px-4 py-2 border-b border-gray-100 gap-3 last:border-b-0">
      <span className="text-sm text-gray-400 w-24 shrink-0 leading-tight">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ─── テキスト（インライン編集） ────────────────────────────────

export function TextRow({ label, value, placeholder = '未設定', onSave }: {
  label: string;
  value: string;
  placeholder?: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function open() { setDraft(value); setEditing(true); }
  function save() { onSave(draft); setEditing(false); }

  return (
    <Row label={label}>
      {editing ? (
        <input
          className="w-full text-sm text-gray-900 outline-none border-b border-blue-400 bg-transparent py-0.5"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          autoFocus
        />
      ) : (
        <button className="text-left w-full" onClick={open}>
          {value
            ? <span className="text-sm text-gray-900">{value}</span>
            : <span className="text-sm text-gray-300">{placeholder}</span>}
        </button>
      )}
    </Row>
  );
}

// ─── 数値（インライン編集） ────────────────────────────────────

export function NumberRow({ label, value, placeholder = '未設定', onSave }: {
  label: string;
  value: number | undefined;
  placeholder?: string;
  onSave: (v: number | undefined) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function open() { setDraft(value !== undefined ? String(value) : ''); setEditing(true); }
  function save() { onSave(draft !== '' ? Number(draft) : undefined); setEditing(false); }

  return (
    <Row label={label}>
      {editing ? (
        <input
          type="number"
          inputMode="numeric"
          className="w-full text-sm text-gray-900 outline-none border-b border-blue-400 bg-transparent py-0.5"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          autoFocus
        />
      ) : (
        <button className="text-left w-full" onClick={open}>
          {value !== undefined
            ? <span className="text-sm text-gray-900">{value.toLocaleString()}</span>
            : <span className="text-sm text-gray-300">{placeholder}</span>}
        </button>
      )}
    </Row>
  );
}

// ─── トグル（ブール値） ───────────────────────────────────────

export function ToggleRow({ label, value, onChange }: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row label={label}>
      <button
        className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300'}`}
        onClick={() => onChange(!value)}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </Row>
  );
}

// ─── リンク（URL） ────────────────────────────────────────────

export function LinkRow({ label, url, onSave }: {
  label: string;
  url: string;
  onSave: (url: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function open() { setDraft(url); setEditing(true); }
  function save() { onSave(draft.trim()); setEditing(false); }

  return (
    <Row label={label}>
      {editing ? (
        <input
          type="url"
          inputMode="url"
          className="w-full text-sm text-gray-900 outline-none border-b border-blue-400 bg-transparent py-0.5"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          autoFocus
          placeholder="https://..."
        />
      ) : (
        <div className="flex items-center gap-2">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 underline truncate flex items-center gap-1 active:opacity-70"
              onClick={e => e.stopPropagation()}
            >
              {label}<ExternalLink size={11} className="shrink-0" />
            </a>
          ) : (
            <span className="text-sm text-gray-300">未設定</span>
          )}
          <button className="text-xs text-gray-400 ml-auto shrink-0 px-1" onClick={open}>
            {url ? '変更' : '設定'}
          </button>
        </div>
      )}
    </Row>
  );
}

// ─── セレクト ─────────────────────────────────────────────────

export function SelectRow({ label, value, options, onChange }: {
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (v: string | undefined) => void;
}) {
  return (
    <Row label={label}>
      <select
        className="text-sm text-gray-900 bg-transparent outline-none w-full"
        value={value ?? ''}
        onChange={e => onChange(e.target.value || undefined)}
      >
        <option value="">未設定</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Row>
  );
}

// ─── 周年（月＋日） ───────────────────────────────────────────

export function AnniversaryRow({ month, day, onSave }: {
  month?: number;
  day?: number;
  onSave: (month: number | undefined, day: number | undefined) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftM, setDraftM] = useState('');
  const [draftD, setDraftD] = useState('');

  function open() {
    setDraftM(month?.toString() ?? '');
    setDraftD(day?.toString() ?? '');
    setEditing(true);
  }
  function save() {
    onSave(
      draftM !== '' ? parseInt(draftM) : undefined,
      draftD !== '' ? parseInt(draftD) : undefined,
    );
    setEditing(false);
  }

  const display = month && day ? `${month}月${day}日` : month ? `${month}月` : '';

  return (
    <Row label="周年">
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            className="w-12 text-sm text-center border-b border-blue-400 outline-none bg-transparent"
            value={draftM}
            onChange={e => setDraftM(e.target.value)}
            placeholder="月"
            min={1}
            max={12}
            autoFocus
          />
          <span className="text-sm text-gray-500">月</span>
          <input
            type="number"
            inputMode="numeric"
            className="w-12 text-sm text-center border-b border-blue-400 outline-none bg-transparent"
            value={draftD}
            onChange={e => setDraftD(e.target.value)}
            placeholder="日"
            min={1}
            max={31}
          />
          <span className="text-sm text-gray-500">日</span>
          <button className="ml-2 text-xs text-blue-600 font-medium" onClick={save}>保存</button>
          <button className="text-xs text-gray-400 ml-1" onClick={() => setEditing(false)}>✕</button>
        </div>
      ) : (
        <button className="text-left w-full" onClick={open}>
          {display
            ? <span className="text-sm text-gray-900">{display}</span>
            : <span className="text-sm text-gray-300">未設定</span>}
        </button>
      )}
    </Row>
  );
}

// ─── セクション見出し ─────────────────────────────────────────

export function PropSection({ title }: { title: string }) {
  return (
    <div className="px-4 pt-4 pb-1">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</span>
    </div>
  );
}

// ─── 系列セレクト（定義済み＋その他テキスト入力） ────────────

export function ChainRow({ value, onSave }: {
  value: string;
  onSave: (v: string) => void;
}) {
  const isPreset = (v: string) => (CHAINS as readonly string[]).includes(v);

  const initSel   = !value ? '' : isPreset(value) ? value : 'other';
  const initCustom = !isPreset(value) ? value : '';

  const [sel, setSel]       = useState(initSel);
  const [custom, setCustom] = useState(initCustom);

  function onSelChange(v: string) {
    setSel(v);
    if (v === '')       onSave('');
    else if (v !== 'other') onSave(v);
    // 'other' は custom テキストが確定するまで保存しない
  }

  function saveCustom() {
    if (sel === 'other') onSave(custom.trim());
  }

  return (
    <Row label="系列">
      <div className="flex flex-col gap-1.5">
        <select
          className="text-sm text-gray-900 bg-transparent outline-none w-full"
          value={sel}
          onChange={e => onSelChange(e.target.value)}
        >
          <option value="">未設定</option>
          {CHAINS.map(c => <option key={c} value={c}>{c}</option>)}
          <option value="other">その他</option>
        </select>
        {sel === 'other' && (
          <input
            className="text-sm text-gray-900 outline-none border-b border-blue-400 bg-transparent py-0.5"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onBlur={saveCustom}
            onKeyDown={e => { if (e.key === 'Enter') saveCustom(); }}
            placeholder="系列名を入力"
            autoFocus
          />
        )}
      </div>
    </Row>
  );
}
