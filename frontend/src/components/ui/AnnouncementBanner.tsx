import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../store/auth.store";
import { useTheme } from "../../hooks/useTheme";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Announcement {
  id: string;
  title: string;
  body: string;
  tier: string | null;
  created_at: string;
}

const SEEN_KEY = "@biblioteca/seen_announcements";

export function AnnouncementBanner() {
  const { user }  = useAuthStore();
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;

  const [selected, setSelected] = useState<Announcement | null>(null);
  const [seenIds, setSeenIds]   = useState<string[]>([]);

  // Cargar IDs ya vistos
  React.useEffect(() => {
    AsyncStorage.getItem(SEEN_KEY).then((val) => {
      if (val) setSeenIds(JSON.parse(val));
    });
  }, []);

  const { data: announcements } = useQuery({
    queryKey: ["announcements", user?.id],
    queryFn: async (): Promise<Announcement[]> => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Solo mostrar los no vistos
  const unseen = (announcements ?? []).filter(a => !seenIds.includes(a.id));

  async function markSeen(id: string) {
    const newSeen = [...seenIds, id];
    setSeenIds(newSeen);
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(newSeen));
    setSelected(null);
  }

  async function markAllSeen() {
    const allIds = (announcements ?? []).map(a => a.id);
    const newSeen = [...new Set([...seenIds, ...allIds])];
    setSeenIds(newSeen);
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(newSeen));
  }

  if (unseen.length === 0) return null;

  return (
    <>
      {/* Banner compacto */}
      <TouchableOpacity
        onPress={() => setSelected(unseen[0])}
        activeOpacity={0.9}
        style={{
          marginHorizontal: spacing.xl,
          marginBottom: spacing.md,
          backgroundColor: "#C9A84C20",
          borderRadius: borderRadius.xl,
          padding: spacing.md,
          borderLeftWidth: 4,
          borderLeftColor: "#C9A84C",
          flexDirection: "row",
          alignItems: "center",
          ...shadows.sm,
        }}
      >
        <Text style={{ fontSize: 20, marginRight: spacing.sm }}>📢</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: typography.fontSizes.sm, fontWeight: "700", color: "#C9A84C" }}>
            {unseen[0].title}
          </Text>
          <Text numberOfLines={1} style={{ fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 2 }}>
            {unseen[0].body}
          </Text>
        </View>
        {unseen.length > 1 && (
          <View style={{ backgroundColor: "#C9A84C", borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "white", fontSize: 11, fontWeight: "700" }}>{unseen.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Modal de detalle */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: spacing.xl }}>
          <View style={{ backgroundColor: colors.backgroundCard, borderRadius: borderRadius.xxl, padding: spacing.xl, ...shadows.lg }}>
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.lg }}>
              <Text style={{ fontSize: 28, marginRight: spacing.sm }}>📢</Text>
              <Text style={{ flex: 1, fontSize: typography.fontSizes.lg, fontWeight: "800", color: "#C9A84C" }}>
                {selected?.title}
              </Text>
            </View>

            {/* Cuerpo */}
            <ScrollView style={{ maxHeight: 300 }}>
              <Text style={{ fontSize: typography.fontSizes.base, color: colors.textPrimary, lineHeight: 24 }}>
                {selected?.body}
              </Text>
            </ScrollView>

            {/* Fecha */}
            <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textTertiary, marginTop: spacing.md }}>
              {selected ? new Date(selected.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : ""}
            </Text>

            {/* Acciones */}
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl }}>
              <TouchableOpacity
                onPress={() => selected && markSeen(selected.id)}
                style={{ flex: 1, backgroundColor: "#C9A84C", padding: spacing.md, borderRadius: borderRadius.xl, alignItems: "center" }}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>Entendido</Text>
              </TouchableOpacity>
              {unseen.length > 1 && (
                <TouchableOpacity
                  onPress={markAllSeen}
                  style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.md, borderRadius: borderRadius.xl, alignItems: "center" }}
                >
                  <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>Ver todos ({unseen.length})</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
