/** 設定推測・確定設定の色定義 (1〜6 + 特殊=7) */
export const SETTING_COLORS: Record<number, { bg: string; fg: string; label: string }> = {
  1: { bg: '#f3f4f6', fg: '#6b7280', label: '1' },
  2: { bg: '#22c55e', fg: '#ffffff', label: '2' },
  3: { bg: '#f97316', fg: '#ffffff', label: '3' },
  4: { bg: '#ef4444', fg: '#ffffff', label: '4' },
  5: { bg: '#a855f7', fg: '#ffffff', label: '5' },
  6: { bg: '#fcd34d', fg: '#92400e', label: '6' },
  7: { bg: '#ec4899', fg: '#ffffff', label: '特殊' },
};

export const CHAIN_PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#6b7280', '#1e293b',
] as const;

export const CHAINS = [
  'ダイナム', 'マルハン', 'ガイア', 'ニラク', 'エスパス', 'ゆいまーる', '楽園',
] as const;

export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
] as const;
