import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  Modal, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../hooks/useTheme";
import { useAuthStore } from "../../store/auth.store";
import { supabase } from "../../services/supabase";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { TIER_LABEL, TIER_COLOR, TIER_EMOJI } from "../../types";
import type { AccessTier } from "../../types";

const TIER_OPTIONS: Array<{ value: AccessTier | null; label: string; emoji: string }> = [
  { value: null,        label: "Todos",     emoji: "👥" },
  { value: "aprendiz",  label: "Aprendiz",  emoji: TIER_EMOJI.aprendiz },
  { value: "companero", label: "Compañero", emoji: TIER_EMOJI.companero },
  { value: "maestro",   label: "Maestro",   emoji: TIER_EMOJI.maestro },
];

export function AnnouncementsScreen() {
  const { theme }  = useTheme();
  const { user }   = useAuthStore();
  const { colors, spacing, typography, borderRadius, shadows } = theme;
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle]         = useState("");
  const [body, setBody]           = useState("");
  const [tier, setTier]           = useState<AccessTier | null>(null);

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("announcements").insert({
        title: title.trim(),
        body:  body.trim(),
        tier,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setShowModal(false);
      setTitle(""); setBody(""); setTier(null);
      Alert.alert("✅", "Anuncio publicado");
    },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: !isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  function handleCreate() {
    if (!title.trim()) { Alert.alert("Error", "El título es requerido"); return; }
    if (!body.trim())  { Alert.alert("Error", "El mensaje es requerido"); return; }
    createMutation.mutate();
  }

  if (isLoading) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={announcements ?? []}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
            <View>
              <Text style={{ fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary }}>
                Anuncios
              </Text>
              <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 2 }}>
                Aparecen en el inicio de la app
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              style={{ backgroundColor: "#C9A84C", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.xl }}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>+ Nuevo</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📢</Text>
            <Text style={{ fontSize: typography.fontSizes.lg, color: colors.textPrimary, fontWeight: "600" }}>Sin anuncios</Text>
            <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
              Creá el primer anuncio para la logia
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: colors.backgroundCard,
            borderRadius: borderRadius.xl,
            padding: spacing.md,
            marginBottom: spacing.sm,
            ...shadows.sm,
            borderLeftWidth: 4,
            borderLeftColor: item.is_active ? "#C9A84C" : colors.border,
            opacity: item.is_active ? 1 : 0.6,
          }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Text style={{ fontSize: 20, marginRight: spacing.sm }}>📢</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: typography.fontSizes.base, fontWeight: "700", color: colors.textPrimary }}>
                  {item.title}
                </Text>
                <Text numberOfLines={2} style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginTop: 2 }}>
                  {item.body}
                </Text>
                <View style={{ flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs }}>
                  <View style={{ backgroundColor: "#C9A84C20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, color: "#C9A84C", fontWeight: "700" }}>
                      {item.tier ? `${TIER_EMOJI[item.tier as AccessTier]} ${TIER_LABEL[item.tier as AccessTier]}` : "👥 Todos"}
                    </Text>
                  </View>
                  {!item.is_active && (
                    <View style={{ backgroundColor: colors.error + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 10, color: colors.error, fontWeight: "700" }}>Inactivo</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Acciones */}
            <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm }}>
              <TouchableOpacity
                onPress={() => toggleActive.mutate({ id: item.id, isActive: item.is_active })}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 4 }}
              >
                <Text style={{ fontSize: 14 }}>{item.is_active ? "🔴" : "🟢"}</Text>
                <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textSecondary, fontWeight: "600" }}>
                  {item.is_active ? "Desactivar" : "Activar"}
                </Text>
              </TouchableOpacity>
              <View style={{ width: 1, backgroundColor: colors.border }} />
              <TouchableOpacity
                onPress={() => Alert.alert("Eliminar", "¿Eliminar este anuncio?", [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Eliminar", style: "destructive", onPress: () => deleteMutation.mutate(item.id) },
                ])}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 4 }}
              >
                <Text style={{ fontSize: 14 }}>🗑️</Text>
                <Text style={{ fontSize: typography.fontSizes.xs, color: colors.error, fontWeight: "600" }}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modal crear anuncio */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <ScrollView
            style={{ backgroundColor: colors.backgroundCard, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
            contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: spacing.lg }} />
            <Text style={{ fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.xl }}>
              Nuevo anuncio
            </Text>

            <Input label="Título *" placeholder="Ej: Reunión mensual" value={title} onChangeText={setTitle} />
            <Input
              label="Mensaje *"
              placeholder="Escribí el contenido del anuncio..."
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={5}
              style={{ height: 120, textAlignVertical: "top" }}
            />

            {/* Destinatarios */}
            <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: "600" }}>
              Destinatarios
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.xl }}>
              {TIER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={String(opt.value)}
                  onPress={() => setTier(opt.value)}
                  style={{
                    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                    borderRadius: borderRadius.xl,
                    backgroundColor: tier === opt.value ? "#C9A84C20" : colors.surface,
                    borderWidth: 2,
                    borderColor: tier === opt.value ? "#C9A84C" : "transparent",
                    flexDirection: "row", alignItems: "center", gap: 4,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{opt.emoji}</Text>
                  <Text style={{ fontSize: typography.fontSizes.sm, color: tier === opt.value ? "#C9A84C" : colors.textSecondary, fontWeight: "600" }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title="Publicar anuncio" onPress={handleCreate} loading={createMutation.isPending} fullWidth size="lg" />
            <TouchableOpacity onPress={() => setShowModal(false)} style={{ marginTop: spacing.sm, alignItems: "center", padding: spacing.sm }}>
              <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
