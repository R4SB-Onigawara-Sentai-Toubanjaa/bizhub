import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';

// ドメイン別コンポーネントのインポート
import { HomeScreen } from '../features/exchange/screens/HomeScreen';
import { CameraScreen } from '../features/exchange/screens/CameraScreen';
import { ContactListScreen } from '../features/contacts/screens/ContactListScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      {/* 左 */}
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ tabBarLabel: 'ホーム' }} 
      />
      {/* 中央 */}
      <Tab.Screen 
        name="ContactListTab" 
        component={ContactListScreen} 
        options={{ tabBarLabel: '受取名刺' }} 
      />
      {/* 右 */}
      <Tab.Screen 
        name="CameraTab" 
        component={CameraScreen} 
        options={{ tabBarLabel: 'カメラ' }} 
      />
    </Tab.Navigator>
  );
};