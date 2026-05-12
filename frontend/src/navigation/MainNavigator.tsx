import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeScreen } from "../screens/main/HomeScreen";
import { SectionsScreen } from "../screens/main/SectionsScreen";
import { SearchScreen } from "../screens/main/SearchScreen";
import { ProfileScreen } from "../screens/main/ProfileScreen";
import { FavoritesScreen } from "../screens/main/FavoritesScreen";
import { BookDetailsScreen } from "../screens/main/BookDetailsScreen";
import { SectionBooksScreen } from "../screens/main/SectionBooksScreen";
import { AudioPlayerScreen } from "../screens/main/AudioPlayerScreen";
import { ReaderScreen } from "../screens/main/ReaderScreen";
import { useTheme } from "../hooks/useTheme";
import type { MainStackParamList, MainTabParamList } from "../types";

const Stack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home:      { active: "🏠", inactive: "🏠" },
  Sections:  { active: "📚", inactive: "📚" },
  Search:    { active: "🔍", inactive: "🔍" },
  Favorites: { active: "❤️", inactive: "🤍" },
  Profile:   { active: "👤", inactive: "👤" },
};

function MainTabs() {
  const { theme } = useTheme();
  const { colors, typography } = theme;
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          height: 56 + (insets.bottom > 0 ? insets.bottom : 8),
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: typography.fontSizes.xs,
          fontWeight: typography.fontWeights.medium,
        },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22 }}>
            {focused
              ? TAB_ICONS[route.name]?.active
              : TAB_ICONS[route.name]?.inactive}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Inicio" }} />
      <Tab.Screen name="Sections" component={SectionsScreen} options={{ title: "Secciones" }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: "Buscar" }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: "Favoritos" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Perfil" }} />
    </Tab.Navigator>
  );
}

export function MainNavigator() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.backgroundSecond },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="SectionBooks"
        component={SectionBooksScreen}
        options={({ route }) => ({ title: (route.params as any).sectionName })}
      />
      <Stack.Screen
        name="BookDetails"
        component={BookDetailsScreen}
        options={{ title: "", headerTransparent: true }}
      />
      <Stack.Screen
        name="Reader"
        component={ReaderScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AudioPlayer"
        component={AudioPlayerScreen}
        options={{ title: "Audiolibro", headerShown: false, presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}

// Placeholder para el lector (requiere react-native-pdf / epubjs)
function ReaderPlaceholder() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>📖</Text>
      <Text style={{ fontSize: 18, color: theme.colors.textPrimary, fontWeight: "600" }}>Lector</Text>
      <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginTop: 8, textAlign: "center", paddingHorizontal: 32 }}>
        Instalar react-native-pdf o epubjs para habilitar la lectura
      </Text>
    </View>
  );
}
