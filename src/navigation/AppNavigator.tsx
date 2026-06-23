import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../features/auth/AuthContext';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { HomeScreen } from '../features/exchange/screens/HomeScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null; // スプラッシュスクリーン等に置き換え可能
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          // 認証済みスタック
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          // 未認証スタック
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};