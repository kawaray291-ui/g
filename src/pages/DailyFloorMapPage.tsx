import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { hallStore, islandStore, machineStore, dailyMachineStore } from '../store';
import { Machine, DailyMachineData } from '../types';
import DailyFloorMapCanvas from '../components/DailyFloorMapCanvas';
import DailyMachineModal from '../components/DailyMachineModal';

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

export default function DailyFloorMapPage() {
  const { hallId, date } = useParams<{ hallId: string; date: string }>();
  const navigate = useNavigate();

  const hall = hallStore.getAll().find(h => h.id === hallId);
  const islands = islandStore.getByHall(hallId!);
  const allMachines = machineStore.getAll().filter(m => islands.some(i => i.id === m.islandId));

  const [dailyData, setDailyData] = useState<DailyMachineData[]>(
    () => dailyMachineStore.getByHallDate(hallId!, date!)
  );
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  function refreshDaily() {
    setDailyData(dailyMachineStore.getByHallDate(hallId!, date!));
  }

  function handleMachineTap(machineId: string) {
    const machine = allMachines.find(m => m.id === machineId);
    if (machine) setSelectedMachine(machine);
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
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate">{hall.name}</h1>
          <p className="text-xs text-indigo-300">{formatDate(date!)}</p>
        </div>
        <span className="text-xs text-indigo-300 bg-indigo-700 px-2 py-1 rounded-full">
          デイリー島図
        </span>
      </header>

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
        islands={islands}
        machines={allMachines}
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
