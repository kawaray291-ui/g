import { useRef, useState, useCallback } from 'react';
import { Island, Machine, DailyMachineData } from '../types';
import DailyMachineCell from './DailyMachineCell';

const CANVAS_W = 3000;
const CANVAS_H = 2000;
const CELL_W = 86;
const CELL_H = 70;
const LABEL_H = 32;

const ISLAND_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#d97706', '#059669',
  '#0891b2', '#dc2626', '#16a34a', '#9333ea', '#ea580c',
];

interface Props {
  islands: Island[];
  machines: Machine[];
  dailyData: DailyMachineData[];
  onMachineTap: (machineId: string) => void;
}

function getMachinePos(machine: Machine, island: Island): { x: number; y: number } {
  if (machine.x !== undefined && machine.y !== undefined) return { x: machine.x, y: machine.y };
  return {
    x: island.x + machine.pos * CELL_W,
    y: island.y + LABEL_H + machine.side * CELL_H,
  };
}

export default function DailyFloorMapCanvas({ islands, machines, dailyData, onMachineTap }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const panRef = useRef<{
    startPtrX: number; startPtrY: number; startPanX: number; startPanY: number;
  } | null>(null);

  const islandColorMap = new Map(
    islands.map((isl, i) => [isl.id, ISLAND_COLORS[i % ISLAND_COLORS.length]])
  );
  const dailyMap = new Map(dailyData.map(d => [d.machineId, d]));

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-dfl]')) return;
    panRef.current = {
      startPtrX: e.clientX, startPtrY: e.clientY,
      startPanX: pan.x, startPanY: pan.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [pan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!panRef.current) return;
    const dx = e.clientX - panRef.current.startPtrX;
    const dy = e.clientY - panRef.current.startPtrY;
    setPan({ x: panRef.current.startPanX + dx, y: panRef.current.startPanY + dy });
  }, []);

  const handlePointerUp = useCallback(() => { panRef.current = null; }, []);

  return (
    <div
      ref={viewportRef}
      className="flex-1 overflow-hidden bg-slate-200 relative"
      style={{ touchAction: 'none', userSelect: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        style={{
          width: CANVAS_W, height: CANVAS_H,
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          position: 'relative',
        }}
      >
        {/* グリッド背景 */}
        <svg className="absolute inset-0 opacity-20" width={CANVAS_W} height={CANVAS_H}>
          <defs>
            <pattern id="dfl-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dfl-grid)" />
        </svg>

        {/* 島ラベル */}
        {islands.map(island => {
          const color = islandColorMap.get(island.id) ?? '#6b7280';
          return (
            <div
              key={island.id}
              style={{ position: 'absolute', left: island.x, top: island.y, background: color }}
              className="flex items-center px-2 rounded-lg shadow h-8 min-w-[80px] max-w-[220px]"
            >
              <span className="text-white text-xs font-bold truncate">{island.name}</span>
            </div>
          );
        })}

        {/* 台セル */}
        {machines.map(machine => {
          const island = islands.find(i => i.id === machine.islandId);
          if (!island) return null;
          const pos = getMachinePos(machine, island);
          const color = islandColorMap.get(machine.islandId) ?? '#6b7280';
          return (
            <div
              key={machine.id}
              data-dfl={`machine-${machine.id}`}
              style={{ position: 'absolute', left: pos.x, top: pos.y }}
            >
              <DailyMachineCell
                machine={machine}
                daily={dailyMap.get(machine.id)}
                islandColor={color}
                onClick={() => onMachineTap(machine.id)}
              />
            </div>
          );
        })}
      </div>

      {islands.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-gray-400">雛型島図に島が登録されていません</p>
        </div>
      )}
    </div>
  );
}
