import React, { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

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
  header: { position: 'absolute', top: 50, left: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  qrContainer: { alignItems: 'center', marginVertical: 30 },
  tokenText: { marginTop: 15, color: '#666' },
  buttonContainer: { marginTop: 20 }
});