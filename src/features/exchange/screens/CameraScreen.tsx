import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const CameraScreen = () => {
  return (
    <View style={styles.container}>
      <Text>カメラ画面（QR読み取り）</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});