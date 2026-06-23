import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ContactListScreen = () => {
  return (
    <View style={styles.container}>
      <Text>受取名刺一覧画面</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});