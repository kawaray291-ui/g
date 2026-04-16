import { useRef, useState, useCallback } from 'react';
import { Island, Machine, MachineNote } from '../types';
import MachineCell from './MachineCell';

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
  notes: MachineNote[];
  isEditMode: boolean;
  onMachineMove: (machineId: string, x: number, y: number) => void;
  onMachineTap: (machineId: string) => void;
  onIslandMove: (islandId: string, x: number, y: number) => void;
  onIslandEdit: (island: Island) => void;
  onIslandDelete: (island: Island) => void;
}

/** 機械のデフォルト座標（x/y未設定時は島の位置から計算） */
function getMachineDefaultPos(machine: Machine, island: Island): { x: number; y: number } {
  return {
    x: island.x + machine.pos * CELL_W,
    y: island.y + LABEL_H + machine.side * CELL_H,
  };
}

export default function FloorMapCanvas({
  islands, machines, notes,
  isEditMode,
  onMachineMove, onMachineTap,
  onIslandMove, onIslandEdit, onIslandDelete,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [localMachinePos, setLocalMachinePos] = useState<Record<string, { x: number; y: number }>>({});
  const [localIslandPos, setLocalIslandPos] = useState<Record<string, { x: number; y: number }>>({});

  // ドラッグ状態（ref でレンダリングをトリガーしない）
  const panRef = useRef<{
    startPtrX: number; startPtrY: number; startPanX: number; startPanY: number;
  } | null>(null);

  const machineDragRef = useRef<{
    machineId: string;
    startPtrX: number; startPtrY: number;
    startX: number; startY: number;
    moved: boolean;
  } | null>(null);

  const islandDragRef = useRef<{
    islandId: string;
    startPtrX: number; startPtrY: number;
    startX: number; startY: number;
    moved: boolean;
  } | null>(null);

  // 島カラーマップ（順序で色割り当て）
  const islandColorMap = new Map(
    islands.map((isl, i) => [isl.id, ISLAND_COLORS[i % ISLAND_COLORS.length]])
  );

  // キャンバス上での実際の島座標（ドラッグ中はローカル値を使用）
  const getIslandPos = (island: Island) =>
    localIslandPos[island.id] ?? { x: island.x, y: island.y };

  // キャンバス上での実際の台座標
  const getMachinePos = (machine: Machine): { x: number; y: number } => {
    if (localMachinePos[machine.id]) return localMachinePos[machine.id];
    if (machine.x !== undefined && machine.y !== undefined) return { x: machine.x, y: machine.y };
    const island = islands.find(i => i.id === machine.islandId);
    if (!island) return { x: 0, y: 0 };
    return getMachineDefaultPos(machine, island);
  };

  // ─── ポインターイベント ──────────────────────────────────────

  const handleViewportPointerDown = useCallback((e: React.PointerEvent) => {
    // interactive 要素をタップ→パンしない
    if ((e.target as HTMLElement).closest('[data-fl]')) return;
    panRef.current = {
      startPtrX: e.clientX, startPtrY: e.clientY,
      startPanX: pan.x, startPanY: pan.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [pan]);

  const handleViewportPointerMove = useCallback((e: React.PointerEvent) => {
    if (panRef.current) {
      const dx = e.clientX - panRef.current.startPtrX;
      const dy = e.clientY - panRef.current.startPtrY;
      setPan({ x: panRef.current.startPanX + dx, y: panRef.current.startPanY + dy });
    }
    if (machineDragRef.current) {
      const dx = e.clientX - machineDragRef.current.startPtrX;
      const dy = e.clientY - machineDragRef.current.startPtrY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) machineDragRef.current.moved = true;
      const id = machineDragRef.current.machineId;
      setLocalMachinePos(prev => ({
        ...prev,
        [id]: {
          x: Math.max(0, machineDragRef.current!.startX + dx),
          y: Math.max(0, machineDragRef.current!.startY + dy),
        },
      }));
    }
    if (islandDragRef.current) {
      const dx = e.clientX - islandDragRef.current.startPtrX;
      const dy = e.clientY - islandDragRef.current.startPtrY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) islandDragRef.current.moved = true;
      const id = islandDragRef.current.islandId;
      setLocalIslandPos(prev => ({
        ...prev,
        [id]: {
          x: Math.max(0, islandDragRef.current!.startX + dx),
          y: Math.max(0, islandDragRef.current!.startY + dy),
        },
      }));
    }
  }, []);

  const handleViewportPointerUp = useCallback((_e: React.PointerEvent) => {
    panRef.current = null;
    if (machineDragRef.current) {
      const { machineId, moved } = machineDragRef.current;
      if (moved && localMachinePos[machineId]) {
        onMachineMove(machineId, localMachinePos[machineId].x, localMachinePos[machineId].y);
      }
      machineDragRef.current = null;
    }
    if (islandDragRef.current) {
      const { islandId, moved } = islandDragRef.current;
      if (moved && localIslandPos[islandId]) {
        onIslandMove(islandId, localIslandPos[islandId].x, localIslandPos[islandId].y);
      }
      islandDragRef.current = null;
    }
  }, [localMachinePos, localIslandPos, onMachineMove, onIslandMove]);

  // 台ドラッグ開始
  const startMachineDrag = useCallback((e: React.PointerEvent, machine: Machine) => {
    if (!isEditMode) return;
    e.stopPropagation();
    const pos = localMachinePos[machine.id]
      ?? (machine.x !== undefined && machine.y !== undefined
        ? { x: machine.x, y: machine.y }
        : (() => {
            const isl = islands.find(i => i.id === machine.islandId);
            return isl ? getMachineDefaultPos(machine, isl) : { x: 0, y: 0 };
          })());
    machineDragRef.current = {
      machineId: machine.id,
      startPtrX: e.clientX, startPtrY: e.clientY,
      startX: pos.x, startY: pos.y,
      moved: false,
    };
    viewportRef.current?.setPointerCapture(e.pointerId);
  }, [isEditMode, localMachinePos, islands]);

  // 島ラベルドラッグ開始
  const startIslandDrag = useCallback((e: React.PointerEvent, island: Island) => {
    e.stopPropagation();
    const pos = localIslandPos[island.id] ?? { x: island.x, y: island.y };
    islandDragRef.current = {
      islandId: island.id,
      startPtrX: e.clientX, startPtrY: e.clientY,
      startX: pos.x, startY: pos.y,
      moved: false,
    };
    viewportRef.current?.setPointerCapture(e.pointerId);
  }, [localIslandPos]);

  const noteMap = new Map(notes.map(n => [n.machineId, n]));

  return (
    <div
      ref={viewportRef}
      className="flex-1 overflow-hidden bg-slate-200 relative"
      style={{ touchAction: 'none', userSelect: 'none' }}
      onPointerDown={handleViewportPointerDown}
      onPointerMove={handleViewportPointerMove}
      onPointerUp={handleViewportPointerUp}
    >
      {/* キャンバス */}
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
            <pattern id="fl-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fl-grid)" />
        </svg>

        {/* 島ラベル */}
        {islands.map(island => {
          const pos = getIslandPos(island);
          const color = islandColorMap.get(island.id) ?? '#6b7280';
          return (
            <div
              key={island.id}
              data-fl={`island-${island.id}`}
              style={{ position: 'absolute', left: pos.x, top: pos.y, background: color }}
              className={[
                'flex items-center gap-1 px-2 rounded-lg shadow h-8 min-w-[80px] max-w-[220px]',
                isEditMode ? 'cursor-grab active:cursor-grabbing' : '',
              ].join(' ')}
              onPointerDown={isEditMode ? e => startIslandDrag(e, island) : undefined}
            >
              <span className="text-white text-xs font-bold truncate flex-1">{island.name}</span>
              {isEditMode && (
                <>
                  <button
                    className="text-white/80 text-xs px-1 active:text-white shrink-0"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); onIslandEdit(island); }}
                  >
                    編
                  </button>
                  <button
                    className="text-white/80 text-xs px-1 active:text-red-300 shrink-0"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); onIslandDelete(island); }}
                  >
                    削
                  </button>
                </>
              )}
            </div>
          );
        })}

        {/* 台セル */}
        {machines.map(machine => {
          const pos = getMachinePos(machine);
          const color = islandColorMap.get(machine.islandId) ?? '#6b7280';
          const note = noteMap.get(machine.id);
          return (
            <div
              key={machine.id}
              data-fl={`machine-${machine.id}`}
              style={{ position: 'absolute', left: pos.x, top: pos.y }}
            >
              <MachineCell
                machine={machine}
                note={note}
                islandColor={color}
                isEditMode={isEditMode}
                onPointerDown={e => startMachineDrag(e, machine)}
                onClick={isEditMode ? () => {} : () => onMachineTap(machine.id)}
              />
            </div>
          );
        })}
      </div>

      {/* 空ヒント */}
      {islands.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-gray-400">右下の ＋ から島を追加してください</p>
        </div>
      )}
    </div>
  );
}
