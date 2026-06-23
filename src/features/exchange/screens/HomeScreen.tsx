import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../auth/AuthContext';
import { generateQrToken } from '../api/qrToken';

export const HomeScreen = () => {
  const { session } = useAuth();
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchToken = async () => {
    if (!session?.user.id) return;
    setLoading(true);
    try {
      const token = await generateQrToken(session.user.id);
      setQrToken(token);
    } catch (error: any) {
      Alert.alert('エラー', 'QRコードの生成に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 画面マウント時に自動でトークンを発行
  useEffect(() => {
    fetchToken();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>あなたの名刺QRコード</Text>
      
      {loading ? (
        <ActivityIndicator size="large" />
      ) : qrToken ? (
        <View style={styles.qrContainer}>
          {/* 取得したトークン（UUID）をQRコード化 */}
          <QRCode value={qrToken} size={200} />
          <Text style={styles.tokenText}>有効期限: 発行から5分間</Text>
        </View>
      ) : (
        <Text>QRコードが表示できません</Text>
      )}

      <View style={styles.buttonContainer}>
        <Button title="QRコードを再発行" onPress={fetchToken} disabled={loading} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  qrContainer: { alignItems: 'center', marginVertical: 30 },
  tokenText: { marginTop: 15, color: '#666' },
  buttonContainer: { marginTop: 20 }
});