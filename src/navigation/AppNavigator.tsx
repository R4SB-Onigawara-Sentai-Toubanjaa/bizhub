import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../features/auth/AuthContext';
import { RootStackParamList } from './types';

import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { HomeScreen } from '../features/exchange/screens/HomeScreen';
import { CameraScreen } from '../features/exchange/screens/CameraScreen';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { session, isLoading } = useAuth();

  if (isLoading) return null; // 初期化中の画面（スプラッシュ等）

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            {/* <Stack.Screen name="MyCardView" component={MyCardViewScreen} /> */}
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};