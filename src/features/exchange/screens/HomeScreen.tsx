import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { signOut } from '../../auth/api/auth';

export const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text>名刺ホーム画面</Text>
      <Text>※ここに交換用QRコードを表示予定</Text>
      <Button title="サインアウト" onPress={signOut} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});