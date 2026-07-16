import { useState, useEffect, useMemo, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
// 変更されたネイティブ関数をインポート
import { startExchange as startLocalExchange, stopExchange as stopLocalExchange } from '../../../../modules/expo-ble-advertiser/src/index';

const BIZHUB_SERVICE_UUID = 'b1248ab5-374d-4530-8a4b-2f34800263f3';

export const useBLE = () => {
  const bleManager = useMemo(() => new BleManager(), []);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false); // 発信・受信状態を統合
  const [error, setError] = useState<string | null>(null);

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 31) { // Android 15はここを通ります
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);
          
          // 拒否された権限を抽出
          const deniedPermissions = Object.entries(granted)
            .filter(([_, status]) => status !== PermissionsAndroid.RESULTS.GRANTED)
            .map(([permission]) => permission);

          if (deniedPermissions.length > 0) {
            Alert.alert(
              '権限エラー',
              `以下の権限が許可されませんでした:\n${deniedPermissions.join('\n')}\n\n端末の「設定 > アプリ」から権限を手動で許可してください。`
            );
            return false;
          }
        } else {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);
          if (granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('権限エラー', '位置情報が許可されませんでした');
            return false;
          }
        }
      }
      return true;
    } catch (err: any) {
      Alert.alert('システムエラー', '権限の要求中にエラーが発生しました: ' + err.message);
      return false;
    }
  };

  useEffect(() => {
    const initBLE = async () => {
      const hasPermission = await requestPermissions();
      if (hasPermission) {
        setIsInitialized(true);
      }
    };

    initBLE();

    return () => {
      bleManager.destroy();
      // アンマウント時に確実に処理を停止
      stopLocalExchange().catch(() => {});
    };
  }, [bleManager]);

  const startExchange = useCallback(async (token: string): Promise<string> => {
    try {
      setError(null);
      setIsExchanging(true);
      const peerToken = await startLocalExchange(BIZHUB_SERVICE_UUID, token);
      setIsExchanging(false);
      return peerToken;
    } catch (err: any) {
      setIsExchanging(false);
      // 意図的なキャンセルの場合は、エラーとしてStateに残さない
      if (!err.message?.includes('キャンセル')) {
        setError('交換処理に失敗しました: ' + err.message);
      }
      throw err;
    }
  }, []);

  const stopExchange = useCallback(async () => {
    try {
      await stopLocalExchange();
      setIsExchanging(false);
    } catch (err: any) {
      setError('交換処理の停止に失敗しました: ' + err.message);
      throw err;
    }
  }, []);

  return {
    bleManager,
    isInitialized,
    isExchanging,
    startExchange,
    stopExchange,
    error,
  };
};