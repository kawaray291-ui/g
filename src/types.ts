export type MachineType = 'pachinko' | 'slot';
export type ParkingType = 'free' | 'paid' | 'none';

// レートごとの台数
export interface HallRates {
  // スロット（円/枚）
  slot20?: number;   // 20円
  slot5?: number;    //  5円
  slot2?: number;    //  2円
  slot1?: number;    //  1円
  // パチンコ（円/玉）
  pachinko4?: number;   // 4円
  pachinko2?: number;   // 2円
  pachinko1?: number;   // 1円
  pachinko05?: number;  // 0.5円
}

export interface HallLink {
  label: string;
  url: string;
}

export interface Hall {
  id: string;
  name: string;
  chain?: string;           // 系列名
  prefecture?: string;      // 都道府県
  address?: string;
  totalMachines?: number;   // 総台数
  slotCount?: number;       // スロット台数
  pachinkoCount?: number;   // パチンコ台数
  rates?: HallRates;        // レートごとの台数
  parking?: ParkingType;    // 駐車場
  anniversaryMonth?: number; // 周年月（1-12）
  anniversaryDay?: number;   // 周年日（1-31）
  links?: HallLink[];       // 各種サイトリンク
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

export interface CalendarEntry {
  id: string;
  hallId: string;
  date: string;           // YYYY-MM-DD
  memo: string;
  medalDiff?: number;     // 差枚数（±）
  avgRotation?: number;   // 平均回転率
  queueCount?: number;    // 並び人数
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
