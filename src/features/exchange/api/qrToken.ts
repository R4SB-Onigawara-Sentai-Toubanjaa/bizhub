import { supabase } from '../../../utils/supabase';

/**
 * QRコード用のトークンを生成し、取得する
 * @param userId 現在のログインユーザーID
 * @returns 生成されたトークン（UUID文字列）
 */
export const generateQrToken = async (userId: string) => {
  // 有効期限を現在時刻の5分後に設定
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);

  // 1. 既存のトークンを物理削除（存在しない場合は何も起きない）
  const { error: deleteError } = await supabase
    .from('qr_tokens')
    .delete()
    .eq('user_id', userId);

  if (deleteError) throw deleteError;

  // 2. 新規挿入（ここでDB側の DEFAULT gen_random_uuid() が実行される）
  const { data, error } = await supabase
    .from('qr_tokens')
    .insert({
      user_id: userId,
      expires_at: expiresAt.toISOString(),
    })
    .select('token')
    .single();

  if (error) throw error;
  return data.token;
};