import { Machine, DailyMachineData } from '../types';

interface Props {
  machine: Machine;
  daily?: DailyMachineData;
  islandColor: string;
  onClick: () => void;
}

const RATING_DOT: Record<number, string> = {
  1: 'bg-red-400',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-lime-400',
  5: 'bg-green-500',
};

export default function DailyMachineCell({ machine, daily, islandColor, onClick }: Props) {
  const dotColor = daily?.settingRating ? RATING_DOT[daily.settingRating] : '';
  const hasDailyData = daily && (
    daily.settingRating !== undefined ||
    daily.medalDiff !== undefined ||
    daily.rotationRate !== undefined ||
    daily.memo
  );

  return (
    <div
      className="w-20 bg-white rounded-lg shadow border border-gray-200 overflow-hidden select-none cursor-pointer active:brightness-95"
      style={{ borderTop: `3px solid ${islandColor}` }}
      onClick={onClick}
    >
      <div className="px-1.5 py-1 flex flex-col gap-0.5 relative min-h-[56px]">
        {/* 設定評価ドット */}
        {dotColor && (
          <span
            className={`absolute top-1 right-1 w-2 h-2 rounded-full ${dotColor}`}
            title={`設定評価: ${daily?.settingRating}`}
          />
        )}
        {/* データ入力済みインジケータ（評価なし） */}
        {hasDailyData && !dotColor && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-300" />
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

        {/* 差枚数 */}
        {daily?.medalDiff !== undefined && (
          <p className={`text-xs font-medium leading-none ${daily.medalDiff >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
            {daily.medalDiff >= 0 ? '+' : ''}{daily.medalDiff.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
