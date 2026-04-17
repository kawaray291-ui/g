import { Hall, Island, Machine, MachineNote, VisitRecord, CalendarEntry, MachineType, ChainTag, DailyMachineData, DailySnapshot, MediaSource, EventTemplate } from './types';

// ─── ID生成 ─────────────────────────────────────────────────
let seq = Date.now();
export function genId(): string {
  return (++seq).toString(36) + Math.random().toString(36).slice(2, 5);
}

// ─── LocalStorage ヘルパー ───────────────────────────────────
function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full などは無視
  }
}

// ─── ホール ──────────────────────────────────────────────────
export const hallStore = {
  getAll: (): Hall[] => read('halls', []),

  add(data: Omit<Hall, 'id' | 'createdAt'>): Hall {
    const hall: Hall = { ...data, id: genId(), createdAt: new Date().toISOString() };
    write('halls', [...this.getAll(), hall]);
    return hall;
  },

  update(id: string, patch: Partial<Omit<Hall, 'id' | 'createdAt'>>): void {
    write('halls', this.getAll().map(h => (h.id === id ? { ...h, ...patch } : h)));
  },

  delete(id: string): void {
    write('halls', this.getAll().filter(h => h.id !== id));
    // 関連データも削除
    const islands = islandStore.getByHall(id);
    islands.forEach(island => islandStore.delete(island.id));
  },
};

// ─── 島 ──────────────────────────────────────────────────────
export const islandStore = {
  getAll: (): Island[] => read('islands', []),
  getByHall: (hallId: string): Island[] => read<Island[]>('islands', []).filter(i => i.hallId === hallId),

  add(
    hallId: string,
    name: string,
    machineType: MachineType,
    doubleSided: boolean,
    machineCount: number,
    startNumber: number,
    x = 50,
    y = 50
  ): Island {
    const island: Island = {
      id: genId(), hallId, name, machineType, doubleSided, machineCount, startNumber, x, y,
    };
    write('islands', [...this.getAll(), island]);

    // 台を自動生成（初期位置はグリッド状に配置）
    const CELL_W = 86; // 80px + 6px gap
    const CELL_H = 70; // 64px + 6px gap
    const LABEL_H = 32;
    const sides = doubleSided ? 2 : 1;
    const machines: Machine[] = [];
    for (let side = 0; side < sides; side++) {
      for (let pos = 0; pos < machineCount; pos++) {
        const num = startNumber + side * machineCount + pos;
        machines.push({
          id: genId(),
          islandId: island.id,
          side: side as 0 | 1,
          pos,
          number: String(num),
          modelName: '',
          shortMemo: '',
          x: x + pos * CELL_W,
          y: y + LABEL_H + side * CELL_H,
        });
      }
    }
    write('machines', [...machineStore.getAll(), ...machines]);
    return island;
  },

  update(id: string, patch: Partial<Omit<Island, 'id' | 'hallId'>>): void {
    write('islands', this.getAll().map(i => (i.id === id ? { ...i, ...patch } : i)));
  },

  delete(id: string): void {
    write('islands', this.getAll().filter(i => i.id !== id));
    const machines = machineStore.getByIsland(id);
    machines.forEach(m => machineStore.delete(m.id));
  },
};

// ─── 台 ──────────────────────────────────────────────────────
export const machineStore = {
  getAll: (): Machine[] => read('machines', []),
  getByIsland: (islandId: string): Machine[] =>
    read<Machine[]>('machines', []).filter(m => m.islandId === islandId),
  getById: (id: string): Machine | undefined => read<Machine[]>('machines', []).find(m => m.id === id),

  update(id: string, patch: Partial<Omit<Machine, 'id' | 'islandId'>>): void {
    write('machines', this.getAll().map(m => (m.id === id ? { ...m, ...patch } : m)));
  },

  /** 台を1台だけ手動追加（自由配置用） */
  addSingle(
    islandId: string,
    number: string,
    modelName: string,
    shortMemo: string,
    x: number,
    y: number,
  ): Machine {
    const existing = this.getByIsland(islandId);
    const machine: Machine = {
      id: genId(),
      islandId,
      side: 0,
      pos: existing.length,
      number,
      modelName,
      shortMemo,
      x,
      y,
    };
    write('machines', [...this.getAll(), machine]);
    return machine;
  },

  delete(id: string): void {
    write('machines', this.getAll().filter(m => m.id !== id));
    // メモ・来店記録も削除
    noteStore.delete(id);
    write('visitRecords', visitStore.getAll().filter(v => v.machineId !== id));
  },
};

// ─── 台メモ ──────────────────────────────────────────────────
export const noteStore = {
  getAll: (): MachineNote[] => read('machineNotes', []),
  getByMachine: (machineId: string): MachineNote | undefined =>
    read<MachineNote[]>('machineNotes', []).find(n => n.machineId === machineId),

  upsert(machineId: string, patch: Partial<Omit<MachineNote, 'machineId' | 'updatedAt'>>): void {
    const all = this.getAll();
    const existing = all.find(n => n.machineId === machineId);
    const updated: MachineNote = {
      machineId,
      memo: '',
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    if (existing) {
      write('machineNotes', all.map(n => (n.machineId === machineId ? updated : n)));
    } else {
      write('machineNotes', [...all, updated]);
    }
  },

  delete(machineId: string): void {
    write('machineNotes', this.getAll().filter(n => n.machineId !== machineId));
  },
};

// ─── 来店記録 ─────────────────────────────────────────────────
export const visitStore = {
  getAll: (): VisitRecord[] => read('visitRecords', []),
  getByMachine: (machineId: string): VisitRecord[] =>
    read<VisitRecord[]>('visitRecords', [])
      .filter(v => v.machineId === machineId)
      .sort((a, b) => b.date.localeCompare(a.date)),

  add(
    machineId: string,
    date: string,
    result?: number,
    bigBonusCount?: number,
    notes?: string
  ): VisitRecord {
    const record: VisitRecord = {
      id: genId(),
      machineId,
      date,
      result,
      bigBonusCount,
      notes,
      createdAt: new Date().toISOString(),
    };
    write('visitRecords', [...this.getAll(), record]);
    return record;
  },

  update(id: string, patch: Partial<Omit<VisitRecord, 'id' | 'machineId' | 'createdAt'>>): void {
    write('visitRecords', this.getAll().map(v => (v.id === id ? { ...v, ...patch } : v)));
  },

  delete(id: string): void {
    write('visitRecords', this.getAll().filter(v => v.id !== id));
  },
};

// ─── カレンダー記録 ───────────────────────────────────────────
export const calendarStore = {
  getAll: (): CalendarEntry[] => read('calendarEntries', []),

  getByHall: (hallId: string): CalendarEntry[] =>
    read<CalendarEntry[]>('calendarEntries', []).filter(e => e.hallId === hallId),

  getByDate: (hallId: string, date: string): CalendarEntry | undefined =>
    read<CalendarEntry[]>('calendarEntries', []).find(
      e => e.hallId === hallId && e.date === date
    ),

  upsert(
    hallId: string,
    date: string,
    patch: Partial<Pick<CalendarEntry, 'memo' | 'medalDiff' | 'avgRotation' | 'queueCount' | 'eventTemplateIds'>>
  ): CalendarEntry {
    const all = this.getAll();
    const existing = all.find(e => e.hallId === hallId && e.date === date);
    const entry: CalendarEntry = {
      id: existing?.id ?? genId(),
      hallId,
      date,
      memo: '',
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    if (existing) {
      write('calendarEntries', all.map(e => (e.id === entry.id ? entry : e)));
    } else {
      write('calendarEntries', [...all, entry]);
    }
    return entry;
  },

  delete(hallId: string, date: string): void {
    write('calendarEntries', this.getAll().filter(
      e => !(e.hallId === hallId && e.date === date)
    ));
  },
};

// ─── 系列タグ（全ホール共通） ─────────────────────────────────
export const chainTagStore = {
  getAll(): ChainTag[] {
    const raw = read<unknown[]>('chainTags', []);
    if (!raw.length) return [];
    // 旧フォーマット（string[]）からの自動マイグレーション
    if (typeof raw[0] === 'string') {
      const migrated: ChainTag[] = (raw as string[]).map((name, i) => ({
        id: String(Date.now() + i),
        name,
        color: '#6b7280',
      }));
      write('chainTags', migrated);
      return migrated;
    }
    return raw as ChainTag[];
  },
  save: (tags: ChainTag[]): void => write('chainTags', tags),
};

// ─── 日付別台データ ────────────────────────────────────────────
export const dailyMachineStore = {
  getAll: (): DailyMachineData[] => read('dailyMachineData', []),

  getByHallDate: (hallId: string, date: string): DailyMachineData[] =>
    read<DailyMachineData[]>('dailyMachineData', [])
      .filter(d => d.hallId === hallId && d.date === date),

  upsert(
    hallId: string,
    machineId: string,
    date: string,
    patch: Partial<Pick<DailyMachineData, 'settingRating' | 'confirmedSetting' | 'medalDiff' | 'rotationRate' | 'memo' | 'machineStatus'>>
  ): DailyMachineData {
    const all = this.getAll();
    const existing = all.find(
      d => d.hallId === hallId && d.machineId === machineId && d.date === date
    );
    const entry: DailyMachineData = {
      id: existing?.id ?? genId(),
      hallId,
      machineId,
      date,
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    write(
      'dailyMachineData',
      existing
        ? all.map(d => (d.id === entry.id ? entry : d))
        : [...all, entry]
    );
    return entry;
  },

  delete(hallId: string, machineId: string, date: string): void {
    write(
      'dailyMachineData',
      this.getAll().filter(
        d => !(d.hallId === hallId && d.machineId === machineId && d.date === date)
      )
    );
  },

  deleteByHallDate(hallId: string, date: string): void {
    write(
      'dailyMachineData',
      this.getAll().filter(d => !(d.hallId === hallId && d.date === date))
    );
  },
};

// ─── 日付別島図スナップショット ───────────────────────────────
export const dailySnapshotStore = {
  getByHallDate(hallId: string, date: string): DailySnapshot | undefined {
    return read<DailySnapshot[]>('dailySnapshots', [])
      .find(s => s.hallId === hallId && s.date === date);
  },

  /** 雛型からディープコピーしてスナップショットを生成・保存する */
  createFromTemplate(hallId: string, date: string): DailySnapshot {
    const islands = islandStore.getByHall(hallId);
    const machines = machineStore.getAll().filter(m => islands.some(i => i.id === m.islandId));
    const snapshot: DailySnapshot = {
      hallId,
      date,
      islands: JSON.parse(JSON.stringify(islands)) as Island[],
      machines: JSON.parse(JSON.stringify(machines)) as Machine[],
      createdAt: new Date().toISOString(),
    };
    const all = read<DailySnapshot[]>('dailySnapshots', []);
    write('dailySnapshots', [...all, snapshot]);
    return snapshot;
  },

  /** スナップショットを取得、なければ雛型からコピーして生成 */
  getOrCreate(hallId: string, date: string): DailySnapshot {
    return this.getByHallDate(hallId, date) ?? this.createFromTemplate(hallId, date);
  },

  delete(hallId: string, date: string): void {
    write(
      'dailySnapshots',
      read<DailySnapshot[]>('dailySnapshots', [])
        .filter(s => !(s.hallId === hallId && s.date === date))
    );
  },

  /** スナップショットが存在する日付の Set を返す */
  getDatesWithSnapshot(hallId: string): Set<string> {
    return new Set(
      read<DailySnapshot[]>('dailySnapshots', [])
        .filter(s => s.hallId === hallId)
        .map(s => s.date)
    );
  },
};

// ─── 媒体 ─────────────────────────────────────────────────────
export const mediaSourceStore = {
  getAll: (): MediaSource[] => read('mediaSources', []),

  add(name: string): MediaSource {
    const item: MediaSource = { id: genId(), name, createdAt: new Date().toISOString() };
    write('mediaSources', [...this.getAll(), item]);
    return item;
  },

  delete(id: string): void {
    write('mediaSources', this.getAll().filter(m => m.id !== id));
    // 配下のイベントも削除
    write('eventTemplates', eventTemplateStore.getAll().filter(e => e.mediaSourceId !== id));
  },
};

// ─── イベントテンプレート ──────────────────────────────────────
export const eventTemplateStore = {
  getAll: (): EventTemplate[] => read('eventTemplates', []),
  getByMedia: (mediaSourceId: string): EventTemplate[] =>
    read<EventTemplate[]>('eventTemplates', []).filter(e => e.mediaSourceId === mediaSourceId),

  add(mediaSourceId: string, name: string): EventTemplate {
    const item: EventTemplate = { id: genId(), mediaSourceId, name, createdAt: new Date().toISOString() };
    write('eventTemplates', [...this.getAll(), item]);
    return item;
  },

  delete(id: string): void {
    write('eventTemplates', this.getAll().filter(e => e.id !== id));
  },
};
