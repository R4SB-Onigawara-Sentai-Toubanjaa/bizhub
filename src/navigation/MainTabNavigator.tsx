import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "./types";
import {
  CardShareTabIcon,
  CreditCardTabIcon,
  QrScanTabIcon,
} from "../components/TabBarIcons";

// ドメイン別コンポーネントのインポート
import { HomeScreen } from "../features/exchange/screens/HomeScreen";
import { CameraScreen } from "../features/exchange/screens/CameraScreen";
import { ContactListScreen } from "../features/contacts/screens/ContactListScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#3985FF",
        tabBarInactiveTintColor: "#848486",
        tabBarStyle: {
          height: 64,
          paddingTop: 6,
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          marginTop: 3,
        },
        tabBarIcon: ({ color, focused }) => {
          const iconSize = focused ? 36 : 34;

          if (route.name === "HomeTab") {
            return <CreditCardTabIcon color={color} size={iconSize} />;
          }

          if (route.name === "ContactListTab") {
            return <CardShareTabIcon color={color} size={iconSize} />;
          }

          return <QrScanTabIcon color={color} size={iconSize} />;
        },
      })}
    >
      {/* 左 */}
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: "ホーム" }}
      />
      {/* 中央 */}
      <Tab.Screen
        name="ContactListTab"
        component={ContactListScreen}
        options={{ tabBarLabel: "受取名刺" }}
      />
      {/* 右 */}
      <Tab.Screen
        name="CameraTab"
        component={CameraScreen}
        options={{ tabBarLabel: "カメラ" }}
      />
    </Tab.Navigator>
  );
};
