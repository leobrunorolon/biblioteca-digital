import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useThemeStore } from "./src/store/theme.store";
import { useReaderStore } from "./src/store/reader.store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      gcTime:    10 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppContent() {
  const isDark      = useThemeStore((s) => s.isDark);
  const initTheme   = useThemeStore((s) => s.initialize);
  const initReader  = useReaderStore((s) => s.initialize);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([initTheme(), initReader()]).finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111827" }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
