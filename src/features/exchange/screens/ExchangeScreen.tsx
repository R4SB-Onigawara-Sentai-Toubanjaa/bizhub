import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ExchangeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ここにQRコードとカメラが表示されます</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});