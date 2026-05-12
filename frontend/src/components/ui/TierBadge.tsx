import React from "react";
import { View, Text } from "react-native";
import { TIER_LABEL, TIER_EMOJI, TIER_COLOR, TIER_LEVEL } from "../../types";
import type { AccessTier } from "../../types";
import { useTheme } from "../../hooks/useTheme";

interface TierBadgeProps {
  tier: AccessTier | null;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
}

const TIER_DESCRIPTION: Record<AccessTier, string> = {
  aprendiz:  "Acceso a contenido introductorio",
  companero: "Acceso a Aprendiz + Compañero",
  maestro:   "Acceso completo a toda la biblioteca",
};

export function TierBadge({ tier, size = "md", showDescription = false }: TierBadgeProps) {
  const { theme } = useTheme();
  const { colors, borderRadius, typography, spacing } = theme;

  if (!tier) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          paddingHorizontal: size === "sm" ? 8 : 12,
          paddingVertical: size === "sm" ? 3 : 6,
          borderRadius: borderRadius.full,
          alignSelf: "flex-start",
        }}
      >
        <Text style={{ fontSize: size === "sm" ? 12 : 16, marginRight: 4 }}>🔒</Text>
        <Text style={{ fontSize: size === "sm" ? 11 : 13, color: colors.textTertiary, fontWeight: "600" }}>
          Sin nivel
        </Text>
      </View>
    );
  }

  const color = TIER_COLOR[tier];
  const fontSize = size === "sm" ? 11 : size === "md" ? 13 : 15;
  const emojiSize = size === "sm" ? 12 : size === "md" ? 16 : 20;
  const px = size === "sm" ? 8 : size === "md" ? 12 : 16;
  const py = size === "sm" ? 3 : size === "md" ? 6 : 8;

  return (
    <View style={{ alignSelf: "flex-start" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: color + "20",
          paddingHorizontal: px,
          paddingVertical: py,
          borderRadius: borderRadius.full,
          borderWidth: 1,
          borderColor: color + "40",
        }}
      >
        <Text style={{ fontSize: emojiSize, marginRight: 4 }}>{TIER_EMOJI[tier]}</Text>
        <Text style={{ fontSize, color, fontWeight: "700" }}>
          {TIER_LABEL[tier]}
        </Text>
      </View>

      {showDescription && (
        <Text
          style={{
            fontSize: typography.fontSizes.xs,
            color: colors.textSecondary,
            marginTop: spacing.xs,
          }}
        >
          {TIER_DESCRIPTION[tier]}
        </Text>
      )}
    </View>
  );
}

// Muestra los 3 niveles con cuáles están desbloqueados
export function TierProgressBar({ currentTier }: { currentTier: AccessTier | null }) {
  const { theme } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;

  const tiers: AccessTier[] = ["aprendiz", "companero", "maestro"];
  const currentLevel = currentTier ? TIER_LEVEL[currentTier] : 0;

  return (
    <View style={{ flexDirection: "row", gap: spacing.xs }}>
      {tiers.map((tier) => {
        const level = TIER_LEVEL[tier];
        const isUnlocked = currentLevel >= level;
        const isCurrent = currentTier === tier;
        const color = TIER_COLOR[tier];

        return (
          <View key={tier} style={{ flex: 1, alignItems: "center" }}>
            <View
              style={{
                width: "100%",
                height: 6,
                borderRadius: 3,
                backgroundColor: isUnlocked ? color : colors.surface,
                marginBottom: spacing.xs,
              }}
            />
            <Text style={{ fontSize: 16 }}>{TIER_EMOJI[tier]}</Text>
            <Text
              style={{
                fontSize: 10,
                fontWeight: isCurrent ? "700" : "400",
                color: isUnlocked ? color : colors.textTertiary,
                marginTop: 2,
              }}
            >
              {TIER_LABEL[tier]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
