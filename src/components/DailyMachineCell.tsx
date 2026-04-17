import { Machine, DailyMachineData } from '../types';
import { SETTING_COLORS } from '../constants';

interface Props {
  machine: Machine;
  daily?: DailyMachineData;
  islandColor: string;
  onClick: () => void;
}

export default function DailyMachineCell({ machine, daily, islandColor, onClick }: Props) {
  const confirmed = daily?.confirmedSetting ? SETTING_COLORS[daily.confirmedSetting] : null;
  const predictionColor = daily?.settingRating ? SETTING_COLORS[daily.settingRating] : null;
  // 推測設定あり（確定なし）→推測色の帯、それ以外→島カラー帯
  const topBorderColor = predictionColor && !confirmed ? predictionColor.bg : islandColor;

  return (
    <div
      className="w-20 rounded-lg shadow border border-gray-200 overflow-hidden select-none cursor-pointer active:brightness-95"
      style={{
        borderTop: `6px solid ${topBorderColor}`,
        backgroundColor: confirmed?.bg ?? 'white',
      }}
      onClick={onClick}
    >
      <div className="px-1.5 py-1 flex flex-col gap-0.5 relative min-h-[56px]">
        {/* 新台・移動台インジケータ */}
        {daily?.machineStatus && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        )}

        {/* 台番号 */}
        <p
          className="text-sm font-bold leading-tight truncate pr-3"
          style={{ color: confirmed?.fg ?? '#111827' }}
        >
          {machine.number}
        </p>

        {/* 機種名 */}
        {machine.modelName && (
          <p
            className="text-xs leading-none truncate"
            style={{ color: confirmed ? confirmed.fg + 'cc' : '#6b7280' }}
          >
            {machine.modelName}
          </p>
        )}

        {/* 差枚数 */}
        {daily?.medalDiff !== undefined && (
          <p
            className="text-xs font-medium leading-none"
            style={{ color: confirmed ? confirmed.fg : daily.medalDiff >= 0 ? '#2563eb' : '#ef4444' }}
          >
            {daily.medalDiff >= 0 ? '+' : ''}{daily.medalDiff.toLocaleString()}
          </p>
        )}

        {/* 回転数 */}
        {daily?.rotationRate !== undefined && (
          <p
            className="text-xs leading-none"
            style={{ color: confirmed ? confirmed.fg + 'cc' : '#0d9488' }}
          >
            {daily.rotationRate}回
          </p>
        )}

        {/* メモ */}
        {daily?.memo && (
          <p
            className="text-xs leading-none truncate italic"
            style={{ color: confirmed ? confirmed.fg + '99' : '#9ca3af' }}
          >
            {daily.memo}
          </p>
        )}
      </div>
    </div>
  );
}
