import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DashboardScreen }      from "../screens/admin/DashboardScreen";
import { UploadBookScreen }     from "../screens/admin/UploadBookScreen";
import { ManageUsersScreen }    from "../screens/admin/ManageUsersScreen";
import { ManageSectionsScreen } from "../screens/admin/ManageSectionsScreen";
import { ManageBooksScreen }    from "../screens/admin/ManageBooksScreen";
import { BookPreviewScreen }    from "../screens/admin/BookPreviewScreen";
import { AnalyticsScreen }      from "../screens/admin/AnalyticsScreen";
import { ReaderScreen }         from "../screens/main/ReaderScreen";
import { AudioPlayerScreen }    from "../screens/main/AudioPlayerScreen";
import { useTheme }             from "../hooks/useTheme";
import type { AdminStackParamList } from "../types";

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: colors.backgroundSecond },
        headerTintColor:  colors.textPrimary,
        headerTitleStyle: { fontWeight: "600" },
        contentStyle:     { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Dashboard"      component={DashboardScreen}      options={{ title: "Admin" }} />
      <Stack.Screen name="UploadBook"     component={UploadBookScreen}     options={{ title: "Subir libro" }} />
      <Stack.Screen name="ManageUsers"    component={ManageUsersScreen}    options={{ title: "Usuarios" }} />
      <Stack.Screen name="ManageSections" component={ManageSectionsScreen} options={{ title: "Secciones" }} />
      <Stack.Screen name="ManageBooks"    component={ManageBooksScreen}    options={({ route }) => ({ title: (route.params as any)?.sectionName ?? "Libros" })} />
      <Stack.Screen name="BookPreview"    component={BookPreviewScreen}    options={{ title: "Detalle del libro" }} />
      <Stack.Screen name="Analytics"      component={AnalyticsScreen}      options={{ title: "Analytics" }} />
      <Stack.Screen name="Reader"         component={ReaderScreen}         options={{ headerShown: false }} />
      <Stack.Screen name="AudioPlayer"    component={AudioPlayerScreen}    options={{ headerShown: false, presentation: "modal" }} />
    </Stack.Navigator>
  );
}
