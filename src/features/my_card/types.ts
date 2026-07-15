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
  /** 項目名（任意）。空文字なら非表示扱い。free選択時は空文字。 */
  label: string;
  /** 入力値 */
  value: string;
}

/** 編集タブの種別（スロット10個に拡張） */
export type MyCardTabKey =
  | 'company'
  | 'name'
  | 'furigana'
  | 'image'
  | 'slot1'
  | 'slot2'
  | 'slot3'
  | 'slot4'
  | 'slot5'
  | 'slot6'
  | 'slot7'
  | 'slot8'
  | 'slot9'
  | 'slot10';

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
  name: string;
  company: string;
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

export const COMPANY_MAX_LENGTH = 25;
export const NAME_MAX_LENGTH = 12;

/**
 * 候補ボタンの定義。
 * label: ボタン表示名 / value: スロットのlabelにセットされる実際の項目名。
 * free の場合 value は空文字（項目名なしで値だけ入力）。
 */
export interface FieldCandidate {
  label: string;  // ボタン上の表示
  value: string;  // スロットの label にセットされる値（free は ''）
  isFree: boolean;
  maxLength: number;
}

export const FIELD_CANDIDATES: FieldCandidate[] = [
  { label: '役職名', value: '役職名', isFree: false, maxLength: 20 },
  { label: '〒', value: '郵便番号', isFree: false, maxLength: 8 },
  { label: '住所', value: '住所', isFree: false, maxLength: 40 },
  { label: 'mail', value: 'mail', isFree: false, maxLength: 35 },
  { label: 'TEL', value: 'TEL', isFree: false, maxLength: 20 },
  { label: 'FAX', value: 'FAX', isFree: false, maxLength: 20 },
  { label: '会社URL', value: '会社URL', isFree: false, maxLength: 30 },
  { label: 'SNS', value: 'SNSアカウント', isFree: false, maxLength: 30 },
  { label: '営業時間', value: '営業時間', isFree: false, maxLength: 30 },
  { label: 'free', value: '', isFree: true, maxLength: 50 },
];

/** フリガナ専用の予約スロット番号（ユーザーが使う1〜10とは別枠） */
export const FURIGANA_SLOT = 0;

/** 初期状態：フリガナ専用スロット（slot 0）のみ。要素スロットはユーザーが＋ボタンで追加する。 */
export function createInitialCustomFields(): CustomFieldSlot[] {
  return [
    { slot: FURIGANA_SLOT, label: 'フリガナ', value: '' },
  ];
}