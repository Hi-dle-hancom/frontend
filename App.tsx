import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

// Navigation - 상대 경로로 수정
import ComponentsNavigator from "./src/navigation/ComponentsNavigator";
import StateManagementNavigator from "./src/navigation/StateManagementNavigator";

// Theme - 상대 경로로 수정
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

// Types - 상대 경로로 수정
import { RootTabParamList } from "./src/types";

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * 앱의 내부 메인 컴포넌트
 * ThemeProvider 내부에서 테마 컨텍스트를 사용합니다.
 */
const MainApp: React.FC = () => {
  const { isDarkMode, colors } = useTheme();

  return (
    <SafeAreaProvider>
      <StatusBar
        backgroundColor={colors.primary}
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />
      <NavigationContainer
        theme={{
          dark: isDarkMode,
          colors: {
            primary: colors.primary,
            background: colors.background,
            card: colors.card,
            text: colors.text,
            border: colors.border,
            notification: colors.notification,
          },
        }}
      >
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName = "";

              // Tab Navigator Icon
              if (route.name === "Components") {
                iconName = focused ? "cube" : "cube-outline";
              } else if (route.name === "StateManagement") {
                iconName = focused ? "git-network" : "git-network-outline";
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: colors.text,
            tabBarInactiveTintColor: colors.border,
            tabBarStyle: {
              backgroundColor: colors.card,
            },
            headerShown: false, // Hide tab navigator header
          })}
        >
          <Tab.Screen name="Components" component={ComponentsNavigator} />
          <Tab.Screen
            name="StateManagement"
            component={StateManagementNavigator}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

/**
 * 앱의 메인 진입점
 * ThemeProvider로 앱 전체를 감싸 테마 컨텍스트를 제공합니다.
 */
export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
