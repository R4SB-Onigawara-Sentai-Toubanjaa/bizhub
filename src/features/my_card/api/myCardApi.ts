/**
 * src/features/my_card/api/myCardApi.ts
 *
 * 自身の名刺データに対する Supabase 呼び出し処理。
 * - business_cards テーブルは「1ユーザー1行」固定のため、新規作成時も
 *   実体としては UPSERT（user_id ユニーク制約に依拠）として扱う。
 * - 既存名刺の更新は UPDATE（レコードを作り直さない／hizhub_db.md 準拠）。
 *
 * NOTE: supabase クライアントは src/lib/supabase.ts に既存のものがある前提で
 * 参照しています（本タスクのスコープ外のため新規作成はしていません）。
 */
import { supabase } from '../../../utils/supabase';
import {
  CustomFieldSlot,
  MyCardFormState,
  MyCardUpdatePayload,
  createInitialCustomFields,
} from '../types';
import { Platform } from 'react-native';

const TABLE_NAME = 'business_cards';
const STORAGE_BUCKET = 'card-logos';

/**
 * 自身の名刺データを取得する。
 * まだ名刺を作成していない場合は null を返す（呼び出し側で初期状態を生成する）。
 */
export async function fetchMyCard(userId: string): Promise<MyCardFormState | null> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, user_id, name, company, logo_url, custom_fields, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`名刺データの取得に失敗しました: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const customFields = normalizeCustomFields(data.custom_fields);

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name ?? '',
    company: data.company ?? '',
    logoUrl: data.logo_url ?? null,
    customFields,
    updatedAt: data.updated_at ?? null,
  };
}

/**
 * 自身の名刺データを保存する。
 * 行が存在しない場合は新規作成、存在する場合は UPDATE される（onConflict: user_id）。
 */
export async function saveMyCard(
  userId: string,
  payload: MyCardUpdatePayload
): Promise<MyCardFormState> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .upsert(
      {
        user_id: userId,
        name: payload.name,
        company: payload.company,
        logo_url: payload.logoUrl,
        custom_fields: payload.customFields,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select('id, user_id, name, company, logo_url, custom_fields, updated_at')
    .single();

  if (error) {
    throw new Error(`名刺データの保存に失敗しました: ${error.message}`);
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name ?? '',
    company: data.company ?? '',
    logoUrl: data.logo_url ?? null,
    customFields: normalizeCustomFields(data.custom_fields),
    updatedAt: data.updated_at ?? null,
  };
}

/**
 * ロゴ画像を Supabase Storage にアップロードし、公開URLを返す。
 * アプリ側（呼び出し元）で expo-image-manipulator 等によるリサイズ・圧縮済みの
 * ファイルを渡すことを前提とする。
 */
export async function uploadLogoImage(
  userId: string,
  fileUri: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  // 1. 認証トークンの取得 (既存のまま)
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    throw new Error(`認証セッションの取得に失敗しました: ${sessionError?.message ?? '未ログイン'}`);
  }
  const token = sessionData.session.access_token;

  // 2. アップロード用パスとファイル名の決定 (既存のまま)
  const extension = contentType === 'image/png' ? 'png' : 'jpg';
  const fileName = `logo_${Date.now()}.${extension}`;
  const path = `${userId}/${fileName}`;

  // 3. 【修正】React Native のネイティブ層が確実に認識できる FormData 構造
  // Android等で file:// スキーマの解釈エラーを防ぐため、パスを正規化します
  const normalizedUri = Platform.OS === 'android' ? fileUri : fileUri.replace('file://', '');

  const formData = new FormData();
  
  // React Native の FormDataPart として完全に互換性のあるオブジェクト定義
  formData.append('file', {
    uri: fileUri, // expo-image-manipulator等の出力パスをそのまま適用
    name: fileName,
    type: contentType,
  } as any);

  // 4. Supabase プロジェクト URL の解析 (既存のまま)
  const supabaseUrl = (supabase as any).supabaseUrl;
  if (!supabaseUrl) {
    throw new Error('Supabase URL の特定に失敗しました。');
  }
  
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${path}`;

  try {
    // 5. REST API 経由でのダイレクトアップロード (既存のまま)
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ストレージサーバーがエラーを返しました: ${errorText}`);
    }

    // 6. 公開URLを取得して返す (既存のまま)
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return urlData.publicUrl;

  } catch (error) {
    throw new Error(
      `ロゴ画像のアップロードに失敗しました: ${
        error instanceof Error ? error.message : 'ネットワークエラー'
      }`
    );
  }
}

/**
 * custom_fields(jsonb) を常に10スロットの配列として正規化する。
 * DBに不正な形式や欠落があっても、UI側は安全に10スロットとして扱える。
 */
function normalizeCustomFields(raw: unknown): CustomFieldSlot[] {
  if (!Array.isArray(raw)) {
    // 名刺未作成ユーザー：フリガナスロットのみの初期状態
    return createInitialCustomFields();
  }
 
  const slots: CustomFieldSlot[] = [];
 
  raw.forEach((item) => {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as any).slot === 'number'
    ) {
      slots.push({
        slot: (item as any).slot as number,
        label: typeof (item as any).label === 'string' ? (item as any).label : '',
        value: typeof (item as any).value === 'string' ? (item as any).value : '',
      });
    }
  });
 
  if (slots.length === 0) {
    // raw が空配列だった場合も初期値へフォールバック
    return createInitialCustomFields();
  }
 
  // slot 番号順に並べて返す（slot 0 = フリガナが先頭になる）
  return slots.sort((a, b) => a.slot - b.slot);
}
