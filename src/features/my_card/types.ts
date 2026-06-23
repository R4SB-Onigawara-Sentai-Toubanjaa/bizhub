/**
 * src/features/my_card/types.ts
 *
 * 自身の名刺（my_card）機能で使用する型定義。
 * DB設計書（hizhub_db.md）の business_cards テーブルに対応。
 */

/** custom_fields(jsonb) 内の1スロット分のデータ構造 */
export interface CustomFieldSlot {
  /** スロット番号（1〜10）。位置は固定で詰めない。 */
  slot: number;
  /** 項目名（任意）。空文字なら非表示扱い。 */
  label: string;
  /** 入力値（label があれば実質必須、運用上は両方空なら非表示）。 */
  value: string;
}

/** 編集タブの種別 */
export type MyCardTabKey =
  | 'company'
  | 'name'
  | 'image'
  | 'slot1'
  | 'slot2'
  | 'slot3'
  | 'slot4';

/** タブ表示用の定義 */
export interface MyCardTabDefinition {
  key: MyCardTabKey;
  label: string;
  /** custom_fields のどのスロット番号に対応するか（社名・氏名・画像タブは null） */
  slotNumber: number | null;
}

/** business_cards テーブルに対応する編集中の名刺データ（フォーム状態） */
export interface MyCardFormState {
  id: string | null;
  userId: string;
  name: string; // 氏名（Not Null）
  company: string; // 会社名（Nullable だが本UIでは必須運用）
  logoUrl: string | null;
  customFields: CustomFieldSlot[]; // 常に10スロット分を保持
  updatedAt: string | null;
}

/** API更新時に送信するペイロード */
export interface MyCardUpdatePayload {
  name: string;
  company: string;
  logoUrl: string | null;
  customFields: CustomFieldSlot[];
}

/** 要素1〜5 のデフォルト項目名（DBスキーマを変更せず custom_fields で表現する運用） */
export const DEFAULT_SLOT_LABELS: Record<number, string> = {
  1: '役職',
  2: '氏名（ローマ字）',
  3: '電話番号',
  4: 'メールアドレス',
  5: '会社URL',
};

/** 初期状態：10スロットを生成（要素1〜5はデフォルト項目名、6〜10は空） */
export function createInitialCustomFields(): CustomFieldSlot[] {
  return Array.from({ length: 10 }, (_, i) => {
    const slot = i + 1;
    return {
      slot,
      label: DEFAULT_SLOT_LABELS[slot] ?? '',
      value: '',
    };
  });
}
