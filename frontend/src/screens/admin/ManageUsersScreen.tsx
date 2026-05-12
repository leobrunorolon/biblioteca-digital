import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../hooks/useTheme";
import { authService } from "../../services/auth.service";
import type { User, AccessTier } from "../../types";
import { TIER_LABEL, TIER_EMOJI, TIER_COLOR } from "../../types";

// Opciones de tier incluyendo "sin acceso"
const TIER_OPTIONS: Array<{ value: AccessTier | null; label: string; emoji: string; color: string; description: string }> = [
  {
    value:       null,
    label:       "Sin acceso",
    emoji:       "🔒",
    color:       "#6B7280",
    description: "El usuario no puede ver ningún contenido",
  },
  {
    value:       "aprendiz",
    label:       "Aprendiz",
    emoji:       "🌱",
    color:       TIER_COLOR.aprendiz,
    description: "Accede a secciones de nivel Aprendiz",
  },
  {
    value:       "companero",
    label:       "Compañero",
    emoji:       "🤝",
    color:       TIER_COLOR.companero,
    description: "Accede a Aprendiz + Compañero",
  },
  {
    value:       "maestro",
    label:       "Maestro",
    emoji:       "🏆",
    color:       TIER_COLOR.maestro,
    description: "Accede a todo el contenido",
  },
];

export function ManageUsersScreen() {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;
  const queryClient = useQueryClient();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => authService.listUsers(),
  });

  const setTier = useMutation({
    mutationFn: ({ userId, tier }: { userId: string; tier: AccessTier | null }) =>
      authService.setUserTier(userId, tier),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setModalVisible(false);
      Alert.alert(
        "✅ Nivel actualizado",
        updatedUser.tier
          ? `${updatedUser.fullName ?? updatedUser.email} ahora es ${TIER_LABEL[updatedUser.tier]}`
          : `${updatedUser.fullName ?? updatedUser.email} ya no tiene acceso`
      );
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message ?? "No se pudo actualizar el nivel");
    },
  });

  function openTierModal(user: User) {
    setSelectedUser(user);
    setModalVisible(true);
  }

  function handleSetTier(tier: AccessTier | null) {
    if (!selectedUser) return;
    if (tier === selectedUser.tier) {
      setModalVisible(false);
      return;
    }
    setTier.mutate({ userId: selectedUser.id, tier });
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={users ?? []}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: spacing.xl }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: typography.fontSizes.xxl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary }}>
              Usuarios
            </Text>
            <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
              {users?.length ?? 0} usuarios registrados
            </Text>

            {/* Leyenda de niveles */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.md }}>
              {TIER_OPTIONS.filter(t => t.value !== null).map((opt) => (
                <View
                  key={opt.value}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: opt.color + "20",
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 4,
                    borderRadius: borderRadius.full,
                  }}
                >
                  <Text style={{ fontSize: 12, marginRight: 4 }}>{opt.emoji}</Text>
                  <Text style={{ fontSize: typography.fontSizes.xs, color: opt.color, fontWeight: typography.fontWeights.semibold }}>
                    {opt.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        }
        renderItem={({ item: user }) => (
          <UserRow
            user={user}
            onPress={() => openTierModal(user)}
            colors={colors}
            spacing={spacing}
            typography={typography}
            borderRadius={borderRadius}
            shadows={shadows}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />

      {/* Modal para asignar tier */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View
            style={{
              backgroundColor: colors.backgroundCard,
              borderTopLeftRadius: borderRadius.xxl,
              borderTopRightRadius: borderRadius.xxl,
              padding: spacing.xl,
              paddingBottom: spacing.xxl,
            }}
          >
            {/* Handle */}
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: spacing.lg }} />

            <Text style={{ fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.xs }}>
              Asignar nivel
            </Text>
            <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginBottom: spacing.xl }}>
              {selectedUser?.fullName ?? selectedUser?.email}
            </Text>

            {TIER_OPTIONS.map((opt) => {
              const isSelected = selectedUser?.tier === opt.value;
              return (
                <TouchableOpacity
                  key={String(opt.value)}
                  onPress={() => handleSetTier(opt.value)}
                  disabled={setTier.isPending}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: spacing.md,
                    borderRadius: borderRadius.xl,
                    marginBottom: spacing.sm,
                    backgroundColor: isSelected ? opt.color + "20" : colors.surface,
                    borderWidth: 2,
                    borderColor: isSelected ? opt.color : "transparent",
                  }}
                >
                  <Text style={{ fontSize: 28, marginRight: spacing.md }}>{opt.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.semibold, color: isSelected ? opt.color : colors.textPrimary }}>
                      {opt.label}
                    </Text>
                    <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 2 }}>
                      {opt.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <Text style={{ fontSize: 18, color: opt.color }}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: spacing.sm, alignItems: "center", padding: spacing.md }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.base }}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Fila de usuario ────────────────────────────────────────

function UserRow({ user, onPress, colors, spacing, typography, borderRadius, shadows }: any) {
  const tierOpt = TIER_OPTIONS.find((t) => t.value === user.tier);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        ...shadows.sm,
      }}
    >
      {/* Avatar inicial */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: tierOpt ? tierOpt.color + "30" : colors.surface,
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing.md,
        }}
      >
        <Text style={{ fontSize: 18 }}>
          {tierOpt ? tierOpt.emoji : "👤"}
        </Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: typography.fontSizes.base,
            fontWeight: typography.fontWeights.semibold,
            color: colors.textPrimary,
          }}
          numberOfLines={1}
        >
          {user.fullName ?? "Sin nombre"}
        </Text>
        <Text
          style={{ fontSize: typography.fontSizes.xs, color: colors.textSecondary }}
          numberOfLines={1}
        >
          {user.email}
        </Text>
      </View>

      {/* Badge de nivel */}
      <View
        style={{
          backgroundColor: tierOpt ? tierOpt.color + "20" : colors.surface,
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: borderRadius.full,
          marginLeft: spacing.sm,
        }}
      >
        <Text
          style={{
            fontSize: typography.fontSizes.xs,
            fontWeight: typography.fontWeights.bold,
            color: tierOpt ? tierOpt.color : colors.textTertiary,
          }}
        >
          {tierOpt?.label ?? "Sin nivel"}
        </Text>
      </View>

      <Text style={{ color: colors.textTertiary, marginLeft: spacing.xs }}>›</Text>
    </TouchableOpacity>
  );
}
