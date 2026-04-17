import { useRef, useState, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Island, Machine, DailyMachineData } from '../types';
import DailyMachineCell from './DailyMachineCell';

const CANVAS_W = 3000;
const CANVAS_H = 2000;
const CELL_W = 86;
const CELL_H = 70;
const LABEL_H = 32;
const MIN_SCALE = 0.2;
const MAX_SCALE = 4;

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

function clampScale(s: number) {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));
}

export default function DailyFloorMapCanvas({ islands, machines, dailyData, onMachineTap }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [scale, setScale] = useState(1);

  const panRef2 = useRef({ x: 20, y: 20 });
  const scaleRef = useRef(1);
  panRef2.current = pan;
  scaleRef.current = scale;

  const dragPanRef = useRef<{
    startPtrX: number; startPtrY: number; startPanX: number; startPanY: number;
  } | null>(null);

  const pointerMapRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{
    initDist: number;
    initScale: number;
    midX: number; midY: number;
    initPanX: number; initPanY: number;
  } | null>(null);

  // Wheel zoom (desktop)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const prevScale = scaleRef.current;
      const prevPan = panRef2.current;
      const newScale = clampScale(prevScale * factor);
      const canvasX = (cx - prevPan.x) / prevScale;
      const canvasY = (cy - prevPan.y) / prevScale;
      const newPan = { x: cx - canvasX * newScale, y: cy - canvasY * newScale };
      panRef2.current = newPan;
      scaleRef.current = newScale;
      setPan(newPan);
      setScale(newScale);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  function applyZoom(factor: number) {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const prevScale = scaleRef.current;
    const prevPan = panRef2.current;
    const newScale = clampScale(prevScale * factor);
    const canvasX = (cx - prevPan.x) / prevScale;
    const canvasY = (cy - prevPan.y) / prevScale;
    const newPan = { x: cx - canvasX * newScale, y: cy - canvasY * newScale };
    panRef2.current = newPan;
    scaleRef.current = newScale;
    setPan(newPan);
    setScale(newScale);
  }

  const islandColorMap = new Map(
    islands.map((isl, i) => [isl.id, ISLAND_COLORS[i % ISLAND_COLORS.length]])
  );
  const dailyMap = new Map(dailyData.map(d => [d.machineId, d]));

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerMapRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const ptrs = Array.from(pointerMapRef.current.values());

    if (ptrs.length >= 2) {
      dragPanRef.current = null;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const [p1, p2] = ptrs as [{ x: number; y: number }, { x: number; y: number }];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      pinchRef.current = {
        initDist: dist,
        initScale: scaleRef.current,
        midX: (p1.x + p2.x) / 2,
        midY: (p1.y + p2.y) / 2,
        initPanX: panRef2.current.x,
        initPanY: panRef2.current.y,
      };
      return;
    }

    if ((e.target as HTMLElement).closest('[data-dfl]')) return;
    dragPanRef.current = {
      startPtrX: e.clientX, startPtrY: e.clientY,
      startPanX: panRef2.current.x, startPanY: panRef2.current.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    pointerMapRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const ptrs = Array.from(pointerMapRef.current.values());

    if (ptrs.length >= 2 && pinchRef.current) {
      const [p1, p2] = ptrs as [{ x: number; y: number }, { x: number; y: number }];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const { initDist, initScale, midX, midY, initPanX, initPanY } = pinchRef.current;
      const newScale = clampScale(initScale * (dist / initDist));
      const canvasX = (midX - initPanX) / initScale;
      const canvasY = (midY - initPanY) / initScale;
      const newPan = { x: midX - canvasX * newScale, y: midY - canvasY * newScale };
      panRef2.current = newPan;
      scaleRef.current = newScale;
      setPan(newPan);
      setScale(newScale);
      return;
    }

    if (!dragPanRef.current) return;
    const dx = e.clientX - dragPanRef.current.startPtrX;
    const dy = e.clientY - dragPanRef.current.startPtrY;
    const newPan = { x: dragPanRef.current.startPanX + dx, y: dragPanRef.current.startPanY + dy };
    panRef2.current = newPan;
    setPan(newPan);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    pointerMapRef.current.delete(e.pointerId);
    if (pointerMapRef.current.size < 2) pinchRef.current = null;
    dragPanRef.current = null;
  }, []);

  return (
    <div
      ref={viewportRef}
      className="flex-1 overflow-hidden bg-slate-200 relative"
      style={{ touchAction: 'none', userSelect: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        style={{
          width: CANVAS_W, height: CANVAS_H,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
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

      {/* ズームコントロール */}
      <div className="absolute bottom-4 left-4 flex flex-col items-center gap-1 z-10">
        <button
          className="w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center active:bg-gray-100 text-gray-700"
          onClick={() => applyZoom(1.3)}
          aria-label="拡大"
        >
          <ZoomIn size={18} />
        </button>
        <span className="text-xs text-gray-600 bg-white/80 rounded-full px-1.5 py-0.5 shadow tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <button
          className="w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center active:bg-gray-100 text-gray-700"
          onClick={() => applyZoom(1 / 1.3)}
          aria-label="縮小"
        >
          <ZoomOut size={18} />
        </button>
      </div>

      {islands.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-gray-400">雛型島図に島が登録されていません</p>
        </div>
      )}
    </div>
  );
}
