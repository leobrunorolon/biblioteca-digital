import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/auth.store";
import { useThemeStore } from "../store/theme.store";
import { useReaderStore } from "../store/reader.store";
import { useTheme } from "../hooks/useTheme";
import { AuthNavigator } from "./AuthNavigator";
import { MainNavigator } from "./MainNavigator";
import { AdminNavigator } from "./AdminNavigator";
import type { RootStackParamList } from "../types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isLoading, isAuthenticated, initialize } = useAuthStore();
  const { initialize: initTheme } = useThemeStore();
  const { initialize: initReader } = useReaderStore();
  const { theme } = useTheme();
  const { colors } = theme;

  useEffect(() => {
    Promise.all([initialize(), initTheme(), initReader()]);
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <NavigationContainer
      theme={{
        dark: theme.isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.backgroundSecond,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.primary,
        },
        fonts: {
          regular: { fontFamily: "System", fontWeight: "400" },
          medium: { fontFamily: "System", fontWeight: "500" },
          bold: { fontFamily: "System", fontWeight: "700" },
          heavy: { fontFamily: "System", fontWeight: "800" },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : isAdmin ? (
          <>
            <Stack.Screen name="Admin" component={AdminNavigator} />
            <Stack.Screen name="Main" component={MainNavigator} />
          </>
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
