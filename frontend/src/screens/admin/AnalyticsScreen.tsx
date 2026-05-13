import React from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "../../hooks/useTheme";
import { supabase } from "../../services/supabase";
import { TIER_LABEL, TIER_COLOR, TIER_EMOJI } from "../../types";

export function AnalyticsScreen() {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: async () => {
      const [topBooks, tierDist, recentActivity, avgProgress] = await Promise.all([
        // Libros más leídos
        supabase
          .from("reading_progress")
          .select("book_id, books(title, author, cover_url)")
          .gt("progress_percent", 0)
          .limit(5),

        // Distribución de tiers
        supabase.rpc("tier_distribution"),

        // Actividad reciente (últimos 7 días)
        supabase
          .from("activity_log")
          .select("action, created_at")
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order("created_at", { ascending: false })
          .limit(20),

        // Progreso promedio
        supabase
          .from("reading_progress")
          .select("progress_percent")
          .gt("progress_percent", 0),
      ]);

      const progressValues = (avgProgress.data ?? []).map((r: any) => parseFloat(r.progress_percent));
      const avg = progressValues.length > 0
        ? Math.round(progressValues.reduce((a: number, b: number) => a + b, 0) / progressValues.length)
        : 0;

      return {
        topBooks:       deduplicateByBookId(topBooks.data ?? []),
        tierDist:       tierDist.data ?? [],
        recentActivity: recentActivity.data ?? [],
        avgProgress:    avg,
        totalReaders:   progressValues.length,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }}>
      <Text style={{ fontSize: typography.fontSizes.xxl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.xl }}>
        Analytics
      </Text>

      {/* Métricas rápidas */}
      <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl }}>
        <MetricCard emoji="📖" label="Lectores activos" value={data?.totalReaders ?? 0} color="#3B82F6" colors={colors} typography={typography} borderRadius={borderRadius} shadows={shadows} spacing={spacing} />
        <MetricCard emoji="📊" label="Progreso promedio" value={`${data?.avgProgress ?? 0}%`} color="#10B981" colors={colors} typography={typography} borderRadius={borderRadius} shadows={shadows} spacing={spacing} />
      </View>

      {/* Distribución de niveles */}
      {(data?.tierDist ?? []).length > 0 && (
        <Section title="Distribución de niveles" colors={colors} typography={typography} spacing={spacing}>
          {(data?.tierDist ?? []).map((item: any) => {
            const tierKey = item.tier === "sin_nivel" ? null : item.tier;
            const color   = tierKey ? TIER_COLOR[tierKey as keyof typeof TIER_COLOR] : colors.textTertiary;
            const label   = tierKey ? TIER_LABEL[tierKey as keyof typeof TIER_LABEL] : "Sin nivel";
            const emoji   = tierKey ? TIER_EMOJI[tierKey as keyof typeof TIER_EMOJI] : "🔒";
            return (
              <View key={item.tier} style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textPrimary }}>
                    {emoji} {label}
                  </Text>
                  <Text style={{ fontSize: typography.fontSizes.sm, fontWeight: "700", color }}>
                    {item.user_count} ({item.pct}%)
                  </Text>
                </View>
                <View style={{ height: 8, backgroundColor: colors.surface, borderRadius: 4, overflow: "hidden" }}>
                  <View style={{ width: `${item.pct}%`, height: "100%", backgroundColor: color, borderRadius: 4 }} />
                </View>
              </View>
            );
          })}
        </Section>
      )}

      {/* Libros más leídos */}
      {(data?.topBooks ?? []).length > 0 && (
        <Section title="Libros en progreso" colors={colors} typography={typography} spacing={spacing}>
          {(data?.topBooks ?? []).slice(0, 5).map((item: any, idx: number) => (
            <View key={item.book_id ?? idx} style={{
              flexDirection: "row", alignItems: "center",
              paddingVertical: spacing.sm,
              borderBottomWidth: idx < 4 ? 1 : 0,
              borderBottomColor: colors.border,
            }}>
              <Text style={{ fontSize: 20, marginRight: spacing.sm, color: colors.textTertiary, width: 28 }}>
                {idx + 1}.
              </Text>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontSize: typography.fontSizes.sm, fontWeight: "600", color: colors.textPrimary }}>
                  {item.books?.title ?? "Sin título"}
                </Text>
                <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textSecondary }}>
                  {item.books?.author}
                </Text>
              </View>
            </View>
          ))}
        </Section>
      )}

      {/* Actividad reciente */}
      {(data?.recentActivity ?? []).length > 0 && (
        <Section title="Actividad últimos 7 días" colors={colors} typography={typography} spacing={spacing}>
          {(data?.recentActivity ?? []).slice(0, 8).map((item: any, idx: number) => (
            <View key={`activity-${idx}-${item.created_at}`} style={{ flexDirection: "row", alignItems: "center", paddingVertical: spacing.xs }}>
              <Text style={{ fontSize: 16, marginRight: spacing.sm }}>{getActionEmoji(item.action)}</Text>
              <Text style={{ flex: 1, fontSize: typography.fontSizes.xs, color: colors.textSecondary }}>
                {getActionLabel(item.action)}
              </Text>
              <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textTertiary }}>
                {formatRelative(item.created_at)}
              </Text>
            </View>
          ))}
        </Section>
      )}
    </ScrollView>
  );
}

function deduplicateByBookId(items: any[]): any[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.book_id || seen.has(item.book_id)) return false;
    seen.add(item.book_id);
    return true;
  });
}

function Section({ title, children, colors, typography, spacing }: any) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: typography.fontSizes.sm, fontWeight: "700", color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.md }}>
        {title}
      </Text>
      <View style={{ backgroundColor: colors.backgroundCard, borderRadius: 16, padding: spacing.md }}>
        {children}
      </View>
    </View>
  );
}

function MetricCard({ emoji, label, value, color, colors, typography, borderRadius, shadows, spacing }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundCard, borderRadius: borderRadius.xl, padding: spacing.lg, alignItems: "center", ...shadows.sm, borderTopWidth: 3, borderTopColor: color }}>
      <Text style={{ fontSize: 28, marginBottom: 4 }}>{emoji}</Text>
      <Text style={{ fontSize: typography.fontSizes.xl, fontWeight: "800", color }}>{value}</Text>
      <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textSecondary, textAlign: "center", marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function getActionEmoji(action: string): string {
  const map: Record<string, string> = { open_book: "📖", open_audio: "🎧", complete: "✅", download: "⬇️" };
  return map[action] ?? "📌";
}

function getActionLabel(action: string): string {
  const map: Record<string, string> = { open_book: "Libro abierto", open_audio: "Audio reproducido", complete: "Libro completado", download: "Descarga" };
  return map[action] ?? action;
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}
