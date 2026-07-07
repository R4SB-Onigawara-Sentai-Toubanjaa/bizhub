import { useState, useEffect, useMemo } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
// import BlePeripheral from 'react-native-ble-peripheral'; // 今回のテスト成功後に有効化します

export const useBLE = () => {
  // BleManagerはアプリ全体で1つのインスタンスを保持する
  const bleManager = useMemo(() => new BleManager(), []);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // iOS/Androidの権限リクエスト
  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        const allGranted = Object.values(granted).every(
          (status) => status === PermissionsAndroid.RESULTS.GRANTED
        );
        if (!allGranted) {
          throw new Error('Bluetoothの権限が拒否されました');
        }
      }
      // iOSの場合は、Info.plist（app.jsonのplugins）の記述に基づいて自動的に許可ダイアログが出ます
      return true;
    } catch (err: any) {
      setError(err.message);
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

    // アンマウント時にマネージャーを破棄
    return () => {
      bleManager.destroy();
    };
  }, [bleManager]);

  return {
    bleManager,
    isInitialized,
    error,
  };
};