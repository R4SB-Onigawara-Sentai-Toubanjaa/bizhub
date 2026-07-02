import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../auth/AuthContext';
import { AccountMenu } from '../../auth/components/AccountMenu';
import { generateQrToken } from '../api/qrToken';
import { RootStackParamList } from '../../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { session, signOut } = useAuth();
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [expirationTime, setExpirationTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // useEffectの依存配列に含めるためuseCallbackでラップ
  const fetchToken = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    try {
      const { token, expiresAt } = await generateQrToken(session.user.id);
      setQrToken(token);
      setExpirationTime(new Date(expiresAt).getTime());
    } catch (error: any) {
      Alert.alert('エラー', 'QRコードの生成に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  // 初回マウント時
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // タイマーおよび自動再生成処理
  useEffect(() => {
    if (!expirationTime) return;

    let intervalId: ReturnType<typeof setInterval>;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000));
      setTimeLeft(remaining);
      
      // 0秒になった瞬間の処理
      if (remaining <= 0) {
        clearInterval(intervalId); // 通信中の二重リクエストを防止
        fetchToken();              // 自動再発行を実行
      }
    };

    updateTimer(); // 即時実行
    intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [expirationTime, fetchToken]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert('エラー', 'サインアウトに失敗しました: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー：左上の人物アイコン（押すとアカウントメニューを表示） */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setIsMenuVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="person-circle-outline" size={32} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <AccountMenu
        visible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        onViewCard={() => navigation.navigate('MyCardView')}
        onSignOut={handleSignOut}
      />

      <Text style={styles.title}>あなたの名刺QRコード</Text>

      {loading ? (
        <View style={styles.qrContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : qrToken ? (
        <View style={styles.qrContainer}>
          <QRCode value={qrToken} size={200} />
          <Text style={styles.tokenText}>
            有効期限: <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </Text>
        </View>
      ) : (
        <View style={styles.qrContainer}>
          <Text style={styles.expiredText}>QRコードを取得できません</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button title="♻︎" onPress={fetchToken} disabled={loading} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { position: 'absolute', top: 50, left: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  qrContainer: { alignItems: 'center', marginVertical: 30, height: 250, justifyContent: 'center' },
  tokenText: { marginTop: 15, color: '#666', fontSize: 16 },
  timerText: { fontWeight: 'bold', color: '#e53e3e' },
  expiredText: { color: '#e53e3e', fontWeight: 'bold', fontSize: 16 },
  buttonContainer: { marginTop: 20 }
});