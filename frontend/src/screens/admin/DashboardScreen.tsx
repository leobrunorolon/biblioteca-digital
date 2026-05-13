import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "../../hooks/useTheme";
import { useAuthStore } from "../../store/auth.store";
import { useThemeStore } from "../../store/theme.store";
import { supabase } from "../../services/supabase";
import type { AdminStackParamList } from "../../types";
import type { ThemeMode } from "../../types";

type Nav = NativeStackNavigationProp<AdminStackParamList>;

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { theme }  = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;
  const { user, signOut } = useAuthStore();
  const { mode, setMode } = useThemeStore();

  const themeOptions: { label: string; value: ThemeMode; emoji: string }[] = [
    { label: "Claro",   value: "light",  emoji: "☀️" },
    { label: "Oscuro",  value: "dark",   emoji: "🌙" },
    { label: "Sistema", value: "system", emoji: "📱" },
  ];

  function handleSignOut() {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: signOut },
    ]);
  }

  // Stats directo desde Supabase sin Edge Functions
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [books, users, completed, sections] = await Promise.all([
        supabase.from("books").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("reading_progress").select("*", { count: "exact", head: true }).eq("completed", true),
        supabase.from("sections").select("*", { count: "exact", head: true }).eq("is_active", true),
      ]);
      return {
        totalBooks:     books.count    ?? 0,
        totalUsers:     users.count    ?? 0,
        completedBooks: completed.count ?? 0,
        totalSections:  sections.count  ?? 0,
      };
    },
    staleTime: 2 * 60 * 1000,
  });

  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const actions = [
    { emoji: "📤", label: "Subir libro",    screen: "UploadBook"      as const, color: "#3B82F6" },
    { emoji: "📋", label: "Ver libros",     screen: "ManageBooks"     as const, color: "#10B981" },
    { emoji: "👥", label: "Usuarios",       screen: "ManageUsers"     as const, color: "#8B5CF6" },
    { emoji: "📂", label: "Secciones",      screen: "ManageSections"  as const, color: "#F59E0B" },
    { emoji: "📢", label: "Anuncios",       screen: "Announcements"   as const, color: "#C9A84C" },
    { emoji: "📊", label: "Analytics",      screen: "Analytics"       as const, color: "#EF4444" },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header con usuario y cerrar sesión */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginBottom: spacing.xl,
        ...shadows.sm,
      }}>
        {/* Avatar */}
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: colors.primaryLight,
          alignItems: "center", justifyContent: "center",
          marginRight: spacing.md,
        }}>
          <Text style={{ fontSize: 20 }}>
            {user?.fullName?.charAt(0).toUpperCase() ?? "A"}
          </Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.bold, color: colors.textPrimary }}>
            {user?.fullName ?? "Admin"}
          </Text>
          <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textSecondary }}>
            {user?.email}
          </Text>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.error + "15",
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.lg,
            gap: spacing.xs,
            borderWidth: 1,
            borderColor: colors.error + "30",
          }}
        >
          <Text style={{ fontSize: 16 }}>🚪</Text>
          <Text style={{ fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.semibold, color: colors.error }}>
            Salir
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: typography.fontSizes.xxl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.xl }}>
        Panel Admin
      </Text>

      {/* Selector de tema */}
      <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl }}>
        {themeOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setMode(opt.value)}
            style={{
              flex: 1, alignItems: "center", padding: spacing.sm,
              borderRadius: borderRadius.lg,
              backgroundColor: mode === opt.value ? colors.primaryLight : colors.surface,
              borderWidth: 1.5,
              borderColor: mode === opt.value ? colors.primary : "transparent",
            }}
          >
            <Text style={{ fontSize: 20, marginBottom: 2 }}>{opt.emoji}</Text>
            <Text style={{ fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.medium, color: mode === opt.value ? colors.primary : colors.textSecondary }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.xl }} />
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.xl }}>
          {[
            { emoji: "📚", label: "Libros",    value: stats?.totalBooks     ?? 0, color: "#3B82F6" },
            { emoji: "👤", label: "Usuarios",  value: stats?.totalUsers     ?? 0, color: "#8B5CF6" },
            { emoji: "📂", label: "Secciones", value: stats?.totalSections  ?? 0, color: "#10B981" },
            { emoji: "✅", label: "Completados",value: stats?.completedBooks ?? 0, color: "#F59E0B" },
          ].map((s) => (
            <View key={s.label} style={{
              width: "47%",
              backgroundColor: colors.backgroundCard,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              alignItems: "center",
              ...shadows.sm,
              borderLeftWidth: 4,
              borderLeftColor: s.color,
            }}>
              <Text style={{ fontSize: 28, marginBottom: 4 }}>{s.emoji}</Text>
              <Text style={{ fontSize: typography.fontSizes.xxl, fontWeight: typography.fontWeights.bold, color: s.color }}>
                {s.value}
              </Text>
              <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textSecondary }}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Acciones rápidas */}
      <Text style={{ fontSize: typography.fontSizes.md, fontWeight: typography.fontWeights.semibold, color: colors.textPrimary, marginBottom: spacing.md }}>
        Acciones rápidas
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.screen}
            onPress={() => navigation.navigate(action.screen as any)}
            activeOpacity={0.8}
            style={{
              width: "47%",
              backgroundColor: colors.backgroundCard,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              alignItems: "center",
              ...shadows.sm,
            }}
          >
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: action.color + "20",
              alignItems: "center", justifyContent: "center",
              marginBottom: spacing.sm,
            }}>
              <Text style={{ fontSize: 28 }}>{action.emoji}</Text>
            </View>
            <Text style={{ fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.semibold, color: colors.textPrimary }}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
