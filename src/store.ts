import { Hall, Island, Machine, MachineNote, VisitRecord, MachineType } from './types';

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

  add(name: string, address?: string, notes?: string): Hall {
    const hall: Hall = { id: genId(), name, address, notes, createdAt: new Date().toISOString() };
    const all = this.getAll();
    write('halls', [...all, hall]);
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

    // 台を自動生成
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

  update(id: string, patch: Partial<Omit<Machine, 'id' | 'islandId' | 'side' | 'pos'>>): void {
    write('machines', this.getAll().map(m => (m.id === id ? { ...m, ...patch } : m)));
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
