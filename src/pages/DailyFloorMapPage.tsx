import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { hallStore, dailyMachineStore, dailySnapshotStore } from '../store';
import { Machine, DailyMachineData, DailySnapshot } from '../types';
import DailyFloorMapCanvas from '../components/DailyFloorMapCanvas';
import DailyMachineModal from '../components/DailyMachineModal';

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

function offsetDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, '0'),
    String(dt.getDate()).padStart(2, '0'),
  ].join('-');
}

export default function DailyFloorMapPage() {
  const { hallId, date } = useParams<{ hallId: string; date: string }>();
  const navigate = useNavigate();

  const hall = hallStore.getAll().find(h => h.id === hallId);

  const [snapshot, setSnapshot] = useState<DailySnapshot>(
    () => dailySnapshotStore.getOrCreate(hallId!, date!)
  );
  const [dailyData, setDailyData] = useState<DailyMachineData[]>(
    () => dailyMachineStore.getByHallDate(hallId!, date!)
  );
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  // date パラメータが変わったときにスナップショット・日次データを差し替える
  useEffect(() => {
    setSnapshot(dailySnapshotStore.getOrCreate(hallId!, date!));
    setDailyData(dailyMachineStore.getByHallDate(hallId!, date!));
    setSelectedMachine(null);
  }, [hallId, date]);

  function refreshDaily() {
    setDailyData(dailyMachineStore.getByHallDate(hallId!, date!));
  }

  function handleMachineTap(machineId: string) {
    const machine = snapshot.machines.find(m => m.id === machineId);
    if (machine) setSelectedMachine(machine);
  }

  function goToDate(newDate: string) {
    navigate(`/halls/${hallId}/map/daily/${newDate}`, { replace: true });
  }

  function handleDeleteData() {
    if (!window.confirm(`${formatDate(date!)}の入力情報をすべて削除しますか？`)) return;
    dailyMachineStore.deleteByHallDate(hallId!, date!);
    refreshDaily();
  }

  function handleDeleteSnapshot() {
    if (!window.confirm(`${formatDate(date!)}のデイリー島図をすべて削除しますか？\n島図・入力情報が両方削除されます。`)) return;
    dailyMachineStore.deleteByHallDate(hallId!, date!);
    dailySnapshotStore.delete(hallId!, date!);
    navigate(-1);
  }

  if (!hall) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">ホールが見つかりません</p>
      </div>
    );
  }

  const selectedDaily = selectedMachine
    ? dailyData.find(d => d.machineId === selectedMachine.id)
    : undefined;

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-indigo-800 text-white px-4 py-3 flex items-center gap-3 shadow">
        <button onClick={() => navigate(-1)} className="active:opacity-70">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-sm font-bold flex-1 truncate">{hall.name}</h1>
        <span className="text-xs text-indigo-300 bg-indigo-700 px-2 py-1 rounded-full shrink-0">
          デイリー島図
        </span>
      </header>

      {/* 日付ナビゲーション */}
      <div className="bg-indigo-700 text-white flex items-center">
        <button
          className="flex items-center gap-0.5 px-4 py-2 text-sm font-medium text-indigo-200 active:bg-indigo-600 shrink-0"
          onClick={() => goToDate(offsetDate(date!, -1))}
        >
          <ChevronLeft size={16} />前日
        </button>
        <p className="flex-1 text-center text-sm font-semibold py-2">
          {formatDate(date!)}
        </p>
        <button
          className="flex items-center gap-0.5 px-4 py-2 text-sm font-medium text-indigo-200 active:bg-indigo-600 shrink-0"
          onClick={() => goToDate(offsetDate(date!, +1))}
        >
          翌日<ChevronRight size={16} />
        </button>
      </div>

      {/* 削除アクション */}
      <div className="bg-white border-b border-gray-100 px-3 py-2 flex gap-2">
        <button
          className="text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 active:bg-red-50"
          onClick={handleDeleteData}
        >
          入力情報を削除
        </button>
        <button
          className="text-xs text-red-600 border border-red-300 bg-red-50 rounded-lg px-3 py-1.5 active:bg-red-100"
          onClick={handleDeleteSnapshot}
        >
          島図ごと削除
        </button>
      </div>

      {/* 凡例 */}
      <div className="bg-indigo-50 px-4 py-1.5 flex items-center gap-3 border-b border-indigo-100 text-xs text-gray-500 flex-wrap">
        {([1, 2, 3, 4, 5] as const).map(r => (
          <span key={r} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${
              r === 1 ? 'bg-red-400' : r === 2 ? 'bg-orange-400' : r === 3 ? 'bg-yellow-400' : r === 4 ? 'bg-lime-400' : 'bg-green-500'
            }`} />
            設定{r}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-300" />
          データあり
        </span>
      </div>

      <DailyFloorMapCanvas
        islands={snapshot.islands}
        machines={snapshot.machines}
        dailyData={dailyData}
        onMachineTap={handleMachineTap}
      />

      {/* 台別モーダル */}
      {selectedMachine && (
        <DailyMachineModal
          machine={selectedMachine}
          daily={selectedDaily}
          date={date!}
          onSave={patch => {
            dailyMachineStore.upsert(hallId!, selectedMachine.id, date!, patch);
            refreshDaily();
            setSelectedMachine(null);
          }}
          onDelete={() => {
            dailyMachineStore.delete(hallId!, selectedMachine.id, date!);
            refreshDaily();
            setSelectedMachine(null);
          }}
          onClose={() => setSelectedMachine(null)}
        />
      )}
    </div>
  );
}
