import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../../auth/AuthContext';
import { processExchange } from '../api/exchangeCard';

export const CameraScreen = () => {
  const { session } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  // 権限状態のロード中
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // カメラ権限が拒否、または未設定の場合
  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>名刺をスキャンするためカメラへのアクセス権限が必要です</Text>
        <Button title="カメラを許可する" onPress={requestPermission} />
      </View>
    );
  }

  // QRコード読み取り時の処理
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    // 処理中またはスキャン済みの場合は重複実行をブロック
    if (scanned || processing || !session?.user.id) return;

    setScanned(true);
    setProcessing(true);

    try {
      await processExchange(session.user.id, data);
      Alert.alert('交換完了', '名刺の取得に成功しました', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    } catch (error: any) {
      Alert.alert('エラー', error.message, [
        { text: '再試行', onPress: () => setScanned(false) },
      ]);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'], // QRコードのみを対象とする
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />
      
      {/* データベースへの保存処理中のオーバーレイ表示 */}
      {processing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.overlayText}>名刺データを取得中...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { marginBottom: 20, textAlign: 'center', fontSize: 16 },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: { color: '#fff', marginTop: 15, fontSize: 16, fontWeight: 'bold' },
});