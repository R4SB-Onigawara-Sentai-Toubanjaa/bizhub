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
import { useBLE } from '../hooks/useBLE';
import { processExchange } from '../api/exchangeCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { session, signOut } = useAuth();
  
  // 変更点1: 新しいフックの返り値を受け取る
  const { isInitialized, isExchanging, startExchange, stopExchange, error: bleError } = useBLE();
  
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [expirationTime, setExpirationTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

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

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  useEffect(() => {
    if (!expirationTime) return;

    let intervalId: ReturnType<typeof setInterval>;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000));
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(intervalId);
        fetchToken();
      }
    };

    updateTimer();
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

  const handleBluetoothPress = async () => {
    if (bleError) {
      Alert.alert('BLEエラー', bleError);
      return;
    }
    if (!isInitialized) {
      Alert.alert('準備中', 'Bluetoothの初期化が完了していません。');
      return;
    }
    if (!qrToken) {
      Alert.alert('エラー', '送信するQRコード（トークン）が存在しません。');
      return;
    }

    if (isExchanging) {
      await stopExchange();
      return;
    }

    try {
      // 1. BLE通信の実行
      const peerToken = await startExchange(qrToken);
      
      // 2. 通信完了後、確認ダイアログを表示
      Alert.alert(
        '交換相手の確認',
        '相手の端末から名刺データを受信しました。\n連絡先に追加しますか？',
        [
          { 
            text: 'キャンセル', 
            style: 'cancel'
          },
          { 
            text: '追加する', 
            onPress: async () => {
              if (!session?.user.id) return;
              try {
                setLoading(true);
                // 3. 既存の交換処理APIを実行
                await processExchange(session.user.id, peerToken);
                Alert.alert('追加完了', '連絡先に登録しました。');
              } catch (e: any) {
                Alert.alert('追加失敗', e.message);
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error: any) {
      if (!error.message.includes('キャンセル')) {
        Alert.alert('通信エラー', error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
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

      <View style={styles.headerRight}>
        {/* 変更点3: ボタンの表示と色を状態に応じて変更 */}
        <Button 
          title={isExchanging ? "待機中(タップで停止)" : "Bluetooth交換"} 
          color={isExchanging ? "#e53e3e" : "#2563EB"}
          onPress={handleBluetoothPress} 
        />
      </View>

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
  headerRight: { position: 'absolute', top: 50, right: 10 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  qrContainer: { alignItems: 'center', marginVertical: 30, height: 250, justifyContent: 'center' },
  tokenText: { marginTop: 15, color: '#666', fontSize: 16 },
  timerText: { fontWeight: 'bold', color: '#e53e3e' },
  expiredText: { color: '#e53e3e', fontWeight: 'bold', fontSize: 16 },
  buttonContainer: { marginTop: 20 }
});