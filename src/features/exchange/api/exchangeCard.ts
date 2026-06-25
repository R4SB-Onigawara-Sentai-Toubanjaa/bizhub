import { supabase } from '../../../utils/supabase';

/**
 * QRコードのトークンを検証し、名刺交換を処理する
 * @param ownerId スキャンしたユーザー（自分）のID
 * @param scannedToken スキャンしたQRコードの文字列（UUID）
 */
export const processExchange = async (ownerId: string, scannedToken: string) => {
  // 1. トークンの存在と有効期限の確認
  const { data: tokenData, error: tokenError } = await supabase
    .from('qr_tokens')
    .select('user_id, expires_at')
    .eq('token', scannedToken)
    .single();

  if (tokenError || !tokenData) {
    throw new Error('無効なQRコードです。');
  }

  const now = new Date();
  const expiresAt = new Date(tokenData.expires_at);
  if (now > expiresAt) {
    throw new Error('QRコードの有効期限が切れています。');
  }

  const partnerUserId = tokenData.user_id;

  // 2. 自己交換のブロック（冪等性の担保）
  if (ownerId === partnerUserId) {
    throw new Error('自分自身の名刺は追加できません。');
  }

  // 3. 相手の最新の名刺データを取得
  const { data: cardData, error: cardError } = await supabase
    .from('business_cards')
    .select('*')
    .eq('user_id', partnerUserId)
    .single();

  if (cardError || !cardData) {
    throw new Error('相手の名刺データが存在しません。');
  }

  // 4. contactsテーブルへスナップショットとして保存
  const { error: insertError } = await supabase
    .from('contacts')
    .insert({
      owner_id: ownerId,
      partner_user_id: partnerUserId,
      business_card_id: cardData.id,
      exchange_token: scannedToken,
      snapshot_name: cardData.name,
      snapshot_company: cardData.company,
      card_snapshot: cardData,
    });

  // 5. 二重登録の検知（PostgreSQLのユニーク制約違反エラーコード: 23505）
  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error('この名刺は既に取得済みです。');
    }
    throw new Error('名刺の保存に失敗しました: ' + insertError.message);
  }

  return true;
};