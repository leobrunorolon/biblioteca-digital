import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { getIconEmoji } from "../../utils/icons";
import type { Section } from "../../types";

interface SectionCardProps {
  section: Section;
  bookCount?: number;
  onPress: () => void;
}

export function SectionCard({ section, bookCount, onPress }: SectionCardProps) {
  const { theme } = useTheme();
  const { colors, borderRadius, typography, spacing, shadows } = theme;

  const bgColor   = section.color ? section.color + "20" : colors.primaryLight;
  const textColor = section.color ?? colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderLeftWidth: 4,
        borderLeftColor: section.color ?? colors.primary,
        ...shadows.sm,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* Ícono */}
        <View
          style={{
            width: 44, height: 44,
            borderRadius: borderRadius.lg,
            backgroundColor: bgColor,
            alignItems: "center",
            justifyContent: "center",
            marginRight: spacing.md,
          }}
        >
          <Text style={{ fontSize: 22 }}>{getIconEmoji(section.icon)}</Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: typography.fontSizes.md,
              fontWeight: typography.fontWeights.semibold,
              color: colors.textPrimary,
            }}
          >
            {section.name}
          </Text>
          {section.description && (
            <Text
              numberOfLines={1}
              style={{
                fontSize: typography.fontSizes.sm,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              {section.description}
            </Text>
          )}
        </View>

        {/* Contador de libros */}
        {bookCount !== undefined && (
          <View
            style={{
              backgroundColor: bgColor,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: borderRadius.full,
            }}
          >
            <Text
              style={{
                fontSize: typography.fontSizes.xs,
                fontWeight: typography.fontWeights.bold,
                color: textColor,
              }}
            >
              {bookCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
