import React, { useState } from "react";
import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "../../store/auth.store";
import { useTheme } from "../../hooks/useTheme";
import { useSectionsByTier } from "../../hooks/useSections";
import { SectionCard } from "../../components/books/SectionCard";
import { getIconEmoji } from "../../utils/icons";
import { TIER_LABEL, TIER_EMOJI, TIER_COLOR, TIER_LEVEL } from "../../types";
import type { MainStackParamList, AccessTier } from "../../types";

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function SectionsScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;

  const { grouped, isLoading, refetch } = useSectionsByTier();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const userTierLevel = user?.tier ? TIER_LEVEL[user.tier] : 0;

  // Construir las secciones de la lista agrupadas por tier
  const listSections = (["aprendiz", "companero", "maestro"] as AccessTier[])
    .map((tier) => ({
      tier,
      data: grouped[tier] ?? [],
    }))
    .filter((s) => s.data.length > 0);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Sin nivel asignado
  if (!user?.tier && user?.role !== "admin") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: spacing.xl }}>
        <Text style={{ fontSize: 64, marginBottom: spacing.lg }}>🔒</Text>
        <Text style={{ fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary, textAlign: "center" }}>
          Sin acceso asignado
        </Text>
        <Text style={{ fontSize: typography.fontSizes.base, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm }}>
          Contactá al administrador para que te asigne un nivel de acceso
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SectionList
        sections={listSections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{ fontSize: typography.fontSizes.xxl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary }}>
              Secciones
            </Text>

            {/* Badge del nivel del usuario */}
            {user?.tier && (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.sm }}>
                <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary }}>
                  Tu nivel:{" "}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: TIER_COLOR[user.tier] + "20",
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 3,
                    borderRadius: borderRadius.full,
                  }}
                >
                  <Text style={{ fontSize: 14, marginRight: 4 }}>{TIER_EMOJI[user.tier]}</Text>
                  <Text style={{ fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.bold, color: TIER_COLOR[user.tier] }}>
                    {TIER_LABEL[user.tier]}
                  </Text>
                </View>
              </View>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => {
          const tier = section.tier as AccessTier;
          const tierLevel = TIER_LEVEL[tier];
          const isUnlocked = user?.role === "admin" || userTierLevel >= tierLevel;

          return (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: spacing.sm,
                marginTop: spacing.md,
              }}
            >
              <Text style={{ fontSize: 18, marginRight: spacing.xs }}>
                {isUnlocked ? TIER_EMOJI[tier] : "🔒"}
              </Text>
              <Text
                style={{
                  fontSize: typography.fontSizes.sm,
                  fontWeight: typography.fontWeights.bold,
                  color: isUnlocked ? TIER_COLOR[tier] : colors.textTertiary,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {TIER_LABEL[tier]}
              </Text>
              {!isUnlocked && (
                <View
                  style={{
                    marginLeft: spacing.sm,
                    backgroundColor: colors.surface,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 2,
                    borderRadius: borderRadius.full,
                  }}
                >
                  <Text style={{ fontSize: 10, color: colors.textTertiary }}>
                    Requiere nivel superior
                  </Text>
                </View>
              )}
            </View>
          );
        }}
        renderItem={({ item, section }) => {
          const tier = section.tier as AccessTier;
          const tierLevel = TIER_LEVEL[tier];
          const isUnlocked = user?.role === "admin" || userTierLevel >= tierLevel;

          return (
            <View style={{ opacity: isUnlocked ? 1 : 0.4 }}>
              <SectionCard
                section={item}
                onPress={() => {
                  if (!isUnlocked) return;
                  navigation.navigate("SectionBooks", {
                    sectionId: item.id,
                    sectionName: item.name,
                  });
                }}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: spacing.xxl }}>
            <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📚</Text>
            <Text style={{ fontSize: typography.fontSizes.lg, color: colors.textPrimary, fontWeight: typography.fontWeights.semibold }}>
              No hay secciones disponibles
            </Text>
          </View>
        }
      />
    </View>
  );
}
