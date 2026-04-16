import { Machine, MachineNote } from '../types';

interface Props {
  machine: Machine;
  note?: MachineNote;
  islandColor: string;
  isEditMode: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onClick: () => void;
}

const RATING_DOT: Record<number, string> = {
  1: 'bg-red-400',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-lime-400',
  5: 'bg-green-500',
};

export default function MachineCell({
  machine, note, islandColor, isEditMode, onPointerDown, onClick,
}: Props) {
  const dotColor = note?.settingRating ? RATING_DOT[note.settingRating] : '';

  return (
    <div
      className={[
        'w-20 bg-white rounded-lg shadow border border-gray-200 overflow-hidden select-none',
        isEditMode
          ? 'cursor-grab active:cursor-grabbing active:shadow-lg active:ring-2 active:ring-blue-400'
          : 'cursor-pointer active:brightness-95',
      ].join(' ')}
      style={{ borderTop: `3px solid ${islandColor}` }}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      <div className="px-1.5 py-1 flex flex-col gap-0.5 relative min-h-[56px]">
        {/* 設定評価ドット */}
        {dotColor && (
          <span
            className={`absolute top-1 right-1 w-2 h-2 rounded-full ${dotColor}`}
            title={`設定評価: ${note?.settingRating}`}
          />
        )}

        {/* 台番号 */}
        <p className="text-sm font-bold text-gray-900 leading-tight truncate pr-3">
          {machine.number}
        </p>

        {/* 機種名 */}
        {machine.modelName && (
          <p className="text-xs text-gray-500 leading-none truncate">
            {machine.modelName}
          </p>
        )}

        {/* 一言メモ */}
        {machine.shortMemo && (
          <p className="text-xs text-gray-400 leading-none truncate italic">
            {machine.shortMemo}
          </p>
        )}
      </div>
    </div>
  );
}
