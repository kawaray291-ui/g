export type MachineType = 'pachinko' | 'slot';

export interface Hall {
  id: string;
  name: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface Island {
  id: string;
  hallId: string;
  name: string;
  machineType: MachineType;
  doubleSided: boolean;
  machineCount: number; // 片面あたりの台数
  startNumber: number;  // 台番号開始番号
  x: number;            // マップ上のX座標(px)
  y: number;            // マップ上のY座標(px)
}

export interface Machine {
  id: string;
  islandId: string;
  side: 0 | 1;   // 0=表, 1=裏（両面島の裏側）
  pos: number;    // 島内の位置（0始まり）
  number: string; // 台番号
  modelName: string; // 機種名
}

// 設定の入りやすさ: 1(入りにくい)〜5(入りやすい)
export type SettingRating = 1 | 2 | 3 | 4 | 5;

export interface MachineNote {
  machineId: string;
  settingRating?: SettingRating;
  memo: string;
  updatedAt: string;
}

export interface VisitRecord {
  id: string;
  machineId: string;
  date: string;         // YYYY-MM-DD
  result?: number;      // 収支（正=プラス, 負=マイナス）
  bigBonusCount?: number; // 大当たり/BIG回数
  notes?: string;
  createdAt: string;
}
