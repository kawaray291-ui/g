import { useRef, useState, useCallback } from 'react';
import { Island, Machine, MachineNote } from '../types';
import { useNavigate } from 'react-router-dom';

const CANVAS_W = 3000;
const CANVAS_H = 2000;
const CELL_W = 52;
const CELL_H = 44;
const HEADER_H = 32;

interface Props {
  hallId: string;
  islands: Island[];
  machines: Machine[];
  notes: MachineNote[];
  onIslandMove: (islandId: string, x: number, y: number) => void;
  onIslandEdit: (island: Island) => void;
  onIslandDelete: (island: Island) => void;
}

function ratingColor(rating?: number): string {
  if (!rating) return 'bg-gray-100 text-gray-700 border-gray-300';
  if (rating >= 4) return 'bg-green-100 text-green-800 border-green-400';
  if (rating === 3) return 'bg-yellow-50 text-yellow-800 border-yellow-300';
  return 'bg-red-50 text-red-700 border-red-300';
}

export default function FloorMapCanvas({
  hallId,
  islands,
  machines,
  notes,
  onIslandMove,
  onIslandEdit,
  onIslandDelete,
}: Props) {
  const navigate = useNavigate();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 20, y: 20 });

  // パン操作
  const panRef = useRef<{ startPtrX: number; startPtrY: number; startPanX: number; startPanY: number } | null>(null);
  // 島ドラッグ
  const islandDragRef = useRef<{
    islandId: string;
    startPtrX: number;
    startPtrY: number;
    startIslandX: number;
    startIslandY: number;
    moved: boolean;
  } | null>(null);
  const [localIslandPos, setLocalIslandPos] = useState<Record<string, { x: number; y: number }>>({});

  // 島の位置をlocal stateで持ち（ドラッグ中の即時反映）、
  // ドラッグ終了時にonIslandMoveで永続化する
  const getIslandPos = (island: Island) =>
    localIslandPos[island.id] ?? { x: island.x, y: island.y };

  const handleViewportPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-island]')) return;
    panRef.current = {
      startPtrX: e.clientX,
      startPtrY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [pan]);

  const handleViewportPointerMove = useCallback((e: React.PointerEvent) => {
    if (panRef.current) {
      const dx = e.clientX - panRef.current.startPtrX;
      const dy = e.clientY - panRef.current.startPtrY;
      setPan({ x: panRef.current.startPanX + dx, y: panRef.current.startPanY + dy });
    }
    if (islandDragRef.current) {
      const dx = e.clientX - islandDragRef.current.startPtrX;
      const dy = e.clientY - islandDragRef.current.startPtrY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) islandDragRef.current.moved = true;
      setLocalIslandPos(prev => ({
        ...prev,
        [islandDragRef.current!.islandId]: {
          x: Math.max(0, islandDragRef.current!.startIslandX + dx),
          y: Math.max(0, islandDragRef.current!.startIslandY + dy),
        },
      }));
    }
  }, []);

  const handleViewportPointerUp = useCallback((_e: React.PointerEvent) => {
    panRef.current = null;
    if (islandDragRef.current) {
      const { islandId, moved } = islandDragRef.current;
      if (moved && localIslandPos[islandId]) {
        onIslandMove(islandId, localIslandPos[islandId].x, localIslandPos[islandId].y);
      }
      islandDragRef.current = null;
    }
  }, [localIslandPos, onIslandMove]);

  const startIslandDrag = useCallback((e: React.PointerEvent, island: Island) => {
    e.stopPropagation();
    const pos = getIslandPos(island);
    islandDragRef.current = {
      islandId: island.id,
      startPtrX: e.clientX,
      startPtrY: e.clientY,
      startIslandX: pos.x,
      startIslandY: pos.y,
      moved: false,
    };
    (viewportRef.current as HTMLElement)?.setPointerCapture(e.pointerId);
  }, [localIslandPos]);

  const noteMap = new Map(notes.map(n => [n.machineId, n]));

  return (
    <div
      ref={viewportRef}
      className="flex-1 overflow-hidden bg-slate-200 relative no-select"
      style={{ touchAction: 'none' }}
      onPointerDown={handleViewportPointerDown}
      onPointerMove={handleViewportPointerMove}
      onPointerUp={handleViewportPointerUp}
    >
      {/* キャンバス */}
      <div
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          position: 'relative',
        }}
      >
        {/* グリッド背景 */}
        <svg
          className="absolute inset-0 opacity-20"
          width={CANVAS_W}
          height={CANVAS_H}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* 島 */}
        {islands.map(island => {
          const pos = getIslandPos(island);
          const islandMachines = machines.filter(m => m.islandId === island.id);
          const sides = island.doubleSided ? 2 : 1;
          const islandWidth = island.machineCount * CELL_W;

          return (
            <div
              key={island.id}
              data-island={island.id}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: islandWidth,
              }}
              className="shadow-md rounded-lg overflow-visible"
            >
              {/* 島ヘッダー（ドラッグハンドル） */}
              <div
                className="flex items-center gap-1 px-2 rounded-t-lg cursor-grab active:cursor-grabbing"
                style={{
                  height: HEADER_H,
                  background: island.machineType === 'pachinko' ? '#1e40af' : '#7c3aed',
                }}
                onPointerDown={e => startIslandDrag(e, island)}
              >
                <span className="text-white text-xs font-bold truncate flex-1">{island.name}</span>
                <span className="text-white/70 text-xs">
                  {island.machineType === 'pachinko' ? 'P' : 'S'}
                </span>
                <button
                  className="text-white/80 text-xs px-1 active:text-white"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); onIslandEdit(island); }}
                >
                  編
                </button>
                <button
                  className="text-white/80 text-xs px-1 active:text-red-300"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); onIslandDelete(island); }}
                >
                  削
                </button>
              </div>

              {/* 台セル */}
              <div className="border border-t-0 border-gray-300 rounded-b-lg overflow-hidden bg-white">
                {Array.from({ length: sides }).map((_, side) => (
                  <div key={side} className={`flex ${side === 0 && sides === 2 ? 'border-b border-gray-300' : ''}`}>
                    {Array.from({ length: island.machineCount }).map((_, pos) => {
                      const machine = islandMachines.find(
                        m => m.side === side && m.pos === pos
                      );
                      if (!machine) return (
                        <div
                          key={pos}
                          style={{ width: CELL_W, height: CELL_H }}
                          className="border-r border-gray-200 last:border-r-0 flex items-center justify-center text-xs text-gray-300"
                        >
                          ?
                        </div>
                      );
                      const note = noteMap.get(machine.id);
                      const colorClass = ratingColor(note?.settingRating);
                      return (
                        <button
                          key={pos}
                          style={{ width: CELL_W, height: CELL_H }}
                          className={`border-r border-gray-200 last:border-r-0 flex flex-col items-center justify-center border ${colorClass} active:brightness-95`}
                          onPointerDown={e => e.stopPropagation()}
                          onClick={() => navigate(`/halls/${hallId}/machines/${machine.id}`)}
                        >
                          <span className="text-xs font-bold leading-tight">{machine.number}</span>
                          {note?.settingRating && (
                            <span className="text-xs leading-none">
                              {'★'.repeat(note.settingRating)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 操作ヒント */}
      {islands.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-400">
            <p className="text-sm">右下の ＋ から島を追加してください</p>
          </div>
        </div>
      )}
    </div>
  );
}
