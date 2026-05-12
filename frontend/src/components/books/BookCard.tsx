import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import type { BookWithProgress } from "../../types";

interface BookCardProps {
  book: BookWithProgress;
  onPress: () => void;
  variant?: "grid" | "list" | "horizontal";
}

export function BookCard({ book, onPress, variant = "grid" }: BookCardProps) {
  const { theme } = useTheme();
  const { colors, borderRadius, typography, spacing, shadows } = theme;

  if (variant === "list") {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          backgroundColor: colors.backgroundCard,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
          ...shadows.sm,
        }}
      >
        <CoverImage uri={book.coverUrl} width={60} height={90} radius={borderRadius.md} />

        <View style={{ flex: 1, marginLeft: spacing.md, justifyContent: "space-between" }}>
          <View>
            <Text
              numberOfLines={2}
              style={{
                fontSize: typography.fontSizes.base,
                fontWeight: typography.fontWeights.semibold,
                color: colors.textPrimary,
              }}
            >
              {book.title}
            </Text>
            <Text
              style={{
                fontSize: typography.fontSizes.sm,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              {book.author}
            </Text>
          </View>

          {book.progress && book.progress.progressPercent > 0 && (
            <ProgressBar percent={book.progress.progressPercent} colors={colors} />
          )}

          <FormatBadge format={book.format} colors={colors} />
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === "horizontal") {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{ width: 120, marginRight: spacing.md }}
      >
        <CoverImage uri={book.coverUrl} width={120} height={170} radius={borderRadius.lg} />

        {book.progress && book.progress.progressPercent > 0 && (
          <View style={{ marginTop: spacing.xs }}>
            <ProgressBar percent={book.progress.progressPercent} colors={colors} />
          </View>
        )}

        <Text
          numberOfLines={2}
          style={{
            fontSize: typography.fontSizes.sm,
            fontWeight: typography.fontWeights.medium,
            color: colors.textPrimary,
            marginTop: spacing.xs,
          }}
        >
          {book.title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize: typography.fontSizes.xs,
            color: colors.textSecondary,
          }}
        >
          {book.author}
        </Text>
      </TouchableOpacity>
    );
  }

  // Grid (default)
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flex: 1,
        margin: spacing.xs,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        overflow: "hidden",
        ...shadows.sm,
      }}
    >
      <CoverImage uri={book.coverUrl} width="100%" height={180} radius={0} />

      <View style={{ padding: spacing.sm }}>
        <Text
          numberOfLines={2}
          style={{
            fontSize: typography.fontSizes.sm,
            fontWeight: typography.fontWeights.semibold,
            color: colors.textPrimary,
          }}
        >
          {book.title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize: typography.fontSizes.xs,
            color: colors.textSecondary,
            marginTop: 2,
          }}
        >
          {book.author}
        </Text>

        {book.progress && book.progress.progressPercent > 0 && (
          <View style={{ marginTop: spacing.xs }}>
            <ProgressBar percent={book.progress.progressPercent} colors={colors} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Sub-componentes ────────────────────────────────────────

function CoverImage({
  uri,
  width,
  height,
  radius,
}: {
  uri?: string;
  width: number | string;
  height: number;
  radius: number;
}) {
  return (
    <Image
      source={uri ? { uri } : require("../../../assets/icon.png")}
      style={{
        width: width as any,
        height,
        borderRadius: radius,
        backgroundColor: "#E5E7EB",
      }}
      resizeMode="cover"
    />
  );
}

function ProgressBar({ percent, colors }: { percent: number; colors: any }) {
  return (
    <View
      style={{
        height: 3,
        backgroundColor: colors.surface,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${Math.min(percent, 100)}%`,
          height: "100%",
          backgroundColor: colors.primary,
          borderRadius: 2,
        }}
      />
    </View>
  );
}

const FORMAT_LABELS: Record<string, string> = {
  pdf:  "PDF",
  epub: "EPUB",
  txt:  "TXT",
  mp3:  "Audio",
  m4b:  "Audio",
};

const FORMAT_COLORS: Record<string, string> = {
  pdf:  "#EF4444",
  epub: "#3B82F6",
  txt:  "#6B7280",
  mp3:  "#F59E0B",
  m4b:  "#F59E0B",
};

function FormatBadge({ format, colors }: { format: string; colors: any }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: FORMAT_COLORS[format] + "20",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "600",
          color: FORMAT_COLORS[format],
        }}
      >
        {FORMAT_LABELS[format] ?? format.toUpperCase()}
      </Text>
    </View>
  );
}
