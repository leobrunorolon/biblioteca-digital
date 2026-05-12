import React, { useState } from "react";
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  Alert, ActivityIndicator, Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { useBook } from "../../hooks/useBooks";
import { supabase } from "../../services/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { TIER_LABEL, TIER_COLOR, TIER_EMOJI } from "../../types";
import type { AccessTier } from "../../types";

const FORMAT_COLOR: Record<string, string> = {
  pdf: "#EF4444", epub: "#3B82F6", txt: "#6B7280", mp3: "#F59E0B", m4b: "#F59E0B",
};

export function BookPreviewScreen() {
  const navigation   = useNavigation<any>();
  const route        = useRoute<any>();
  const { bookId }   = route.params;
  const { theme }    = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;
  const insets       = useSafeAreaInsets();
  const queryClient  = useQueryClient();

  const { data: book, isLoading } = useBook(bookId);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle]   = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editDesc, setEditDesc]     = useState("");
  const [editTier, setEditTier]     = useState<AccessTier | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("books").delete().eq("id", bookId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "books"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      navigation.goBack();
      Alert.alert("✅", "Libro eliminado");
    },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("books").update({
        title:         editTitle.trim(),
        author:        editAuthor.trim(),
        description:   editDesc.trim() || null,
        tier_override: editTier,
        updated_at:    new Date().toISOString(),
      }).eq("id", bookId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "books"] });
      queryClient.invalidateQueries({ queryKey: ["books", bookId] });
      setShowEditModal(false);
      Alert.alert("✅", "Libro actualizado");
    },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  function openEdit() {
    if (!book) return;
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditDesc(book.description ?? "");
    setEditTier(book.tierOverride ?? null);
    setShowEditModal(true);
  }

  function confirmDelete() {
    Alert.alert(
      "Eliminar libro",
      `¿Eliminar "${book?.title}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => deleteMutation.mutate() },
      ]
    );
  }

  if (isLoading || !book) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isAudio = book.format === "mp3" || book.format === "m4b";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Portada */}
        <View style={{ alignItems: "center", padding: spacing.xl, paddingTop: spacing.xxl, backgroundColor: colors.backgroundSecond }}>
          {book.coverUrl ? (
            <Image
              source={{ uri: book.coverUrl }}
              style={{ width: 140, height: 210, borderRadius: borderRadius.xl, ...shadows.lg }}
              resizeMode="cover"
              onError={() => {}} // silenciar error si no carga
            />
          ) : (
            <View style={{
              width: 140, height: 210, borderRadius: borderRadius.xl,
              backgroundColor: colors.surface,
              alignItems: "center", justifyContent: "center",
              ...shadows.lg,
            }}>
              <Text style={{ fontSize: 48 }}>📚</Text>
              <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textTertiary, marginTop: spacing.xs }}>
                Sin portada
              </Text>
            </View>
          )}

          {/* Badges */}
          <View style={{ flexDirection: "row", gap: spacing.xs, marginTop: spacing.md }}>
            <View style={{ backgroundColor: FORMAT_COLOR[book.format] + "20", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full }}>
              <Text style={{ fontSize: typography.fontSizes.xs, color: FORMAT_COLOR[book.format], fontWeight: "700" }}>
                {book.format.toUpperCase()}
              </Text>
            </View>
            <View style={{ backgroundColor: TIER_COLOR[book.effectiveTier] + "20", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full }}>
              <Text style={{ fontSize: typography.fontSizes.xs, color: TIER_COLOR[book.effectiveTier], fontWeight: "700" }}>
                {TIER_EMOJI[book.effectiveTier]} {TIER_LABEL[book.effectiveTier]}
              </Text>
            </View>
            {!book.isActive && (
              <View style={{ backgroundColor: colors.error + "20", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full }}>
                <Text style={{ fontSize: typography.fontSizes.xs, color: colors.error, fontWeight: "700" }}>Inactivo</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ padding: spacing.xl }}>
          {/* Título y autor */}
          <Text style={{ fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary }}>
            {book.title}
          </Text>
          <Text style={{ fontSize: typography.fontSizes.base, color: colors.textSecondary, marginTop: spacing.xs }}>
            {book.author}
          </Text>

          {/* Sección */}
          {book.section && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.sm }}>
              <View style={{ backgroundColor: (book.section.color ?? colors.primary) + "20", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full }}>
                <Text style={{ fontSize: typography.fontSizes.xs, color: book.section.color ?? colors.primary, fontWeight: "600" }}>
                  📂 {book.section.name}
                </Text>
              </View>
            </View>
          )}

          {/* Descripción */}
          {book.description && (
            <View style={{ marginTop: spacing.lg }}>
              <Text style={{ fontSize: typography.fontSizes.sm, fontWeight: "700", color: colors.textSecondary, marginBottom: spacing.xs }}>
                DESCRIPCIÓN
              </Text>
              <Text style={{ fontSize: typography.fontSizes.base, color: colors.textSecondary, lineHeight: 24 }}>
                {book.description}
              </Text>
            </View>
          )}

          {/* Tags */}
          {book.tags && book.tags.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.md }}>
              {book.tags.map((tag) => (
                <View key={tag} style={{ backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full }}>
                  <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textSecondary }}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Info técnica */}
          <View style={{ backgroundColor: colors.backgroundCard, borderRadius: borderRadius.xl, padding: spacing.md, marginTop: spacing.lg, ...shadows.sm }}>
            <Text style={{ fontSize: typography.fontSizes.xs, fontWeight: "700", color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.sm }}>
              Info técnica
            </Text>
            {[
              { label: "Formato",  value: book.format.toUpperCase() },
              { label: "Páginas",  value: book.totalPages ? `${book.totalPages}` : "—" },
              { label: "Tamaño",   value: book.fileSize ? `${(book.fileSize / 1024 / 1024).toFixed(1)} MB` : "—" },
              { label: "Subido",   value: new Date(book.createdAt).toLocaleDateString("es-AR") },
            ].map(({ label, value }) => (
              <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary }}>{label}</Text>
                <Text style={{ fontSize: typography.fontSizes.sm, fontWeight: "600", color: colors.textPrimary }}>{value}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Barra de acciones fija abajo */}
      <View style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        backgroundColor: colors.backgroundCard,
        borderTopWidth: 1, borderTopColor: colors.border,
        paddingTop: spacing.md,
        paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.md,
        paddingHorizontal: spacing.md,
        flexDirection: "row",
        gap: spacing.sm,
      }}>
        {/* Leer / Escuchar */}
        <TouchableOpacity
          onPress={() => {
            if (isAudio) {
              navigation.navigate("AudioPlayer", { bookId: book.id });
            } else {
              navigation.navigate("Reader", { bookId: book.id, format: book.format });
            }
          }}
          style={{
            flex: 1,
            backgroundColor: colors.primary,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.xl,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: spacing.xs,
          }}
        >
          <Text style={{ fontSize: 18 }}>{isAudio ? "🎧" : "📖"}</Text>
          <Text style={{ color: colors.textInverse, fontWeight: "700", fontSize: typography.fontSizes.base }}>
            {isAudio ? "Escuchar" : "Leer"}
          </Text>
        </TouchableOpacity>

        {/* Editar */}
        <TouchableOpacity
          onPress={openEdit}
          style={{
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            backgroundColor: colors.surface,
            borderRadius: borderRadius.xl,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: spacing.xs,
          }}
        >
          <Text style={{ fontSize: 18 }}>✏️</Text>
          <Text style={{ color: colors.textPrimary, fontWeight: "600", fontSize: typography.fontSizes.sm }}>
            Editar
          </Text>
        </TouchableOpacity>

        {/* Eliminar */}
        <TouchableOpacity
          onPress={confirmDelete}
          style={{
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
            backgroundColor: colors.error + "15",
            borderRadius: borderRadius.xl,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.error + "30",
          }}
        >
          <Text style={{ fontSize: 20 }}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Espacio para que el scroll no quede tapado por la barra */}
      <View style={{ height: 80 + (insets.bottom > 0 ? insets.bottom : spacing.md) }} />

      {/* Modal editar */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <ScrollView
            style={{ backgroundColor: colors.backgroundCard, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
            contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}
          >
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: spacing.lg }} />
            <Text style={{ fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.xl }}>
              Editar libro
            </Text>

            <Input label="Título *"      value={editTitle}  onChangeText={setEditTitle}  placeholder="Título del libro" />
            <Input label="Autor *"       value={editAuthor} onChangeText={setEditAuthor} placeholder="Nombre del autor" />
            <Input
              label="Descripción"
              value={editDesc} onChangeText={setEditDesc}
              placeholder="Descripción opcional"
              multiline numberOfLines={3}
              style={{ height: 80, textAlignVertical: "top" }}
            />

            <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: "600" }}>
              Nivel (sobreescribir el de la sección)
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.xs, marginBottom: spacing.xl }}>
              <TouchableOpacity
                onPress={() => setEditTier(null)}
                style={{ flex: 1, padding: spacing.sm, borderRadius: borderRadius.lg, alignItems: "center", backgroundColor: editTier === null ? colors.primaryLight : colors.surface, borderWidth: 2, borderColor: editTier === null ? colors.primary : "transparent" }}
              >
                <Text style={{ fontSize: 18 }}>🔗</Text>
                <Text style={{ fontSize: 10, color: editTier === null ? colors.primary : colors.textSecondary, fontWeight: "700" }}>Sección</Text>
              </TouchableOpacity>
              {(["aprendiz", "companero", "maestro"] as AccessTier[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setEditTier(t)}
                  style={{ flex: 1, padding: spacing.sm, borderRadius: borderRadius.lg, alignItems: "center", backgroundColor: editTier === t ? TIER_COLOR[t] + "20" : colors.surface, borderWidth: 2, borderColor: editTier === t ? TIER_COLOR[t] : "transparent" }}
                >
                  <Text style={{ fontSize: 18 }}>{TIER_EMOJI[t]}</Text>
                  <Text style={{ fontSize: 10, color: editTier === t ? TIER_COLOR[t] : colors.textSecondary, fontWeight: "700" }}>{TIER_LABEL[t]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title="Guardar cambios" onPress={() => editMutation.mutate()} loading={editMutation.isPending} fullWidth size="lg" />
            <TouchableOpacity onPress={() => setShowEditModal(false)} style={{ marginTop: spacing.sm, alignItems: "center", padding: spacing.sm }}>
              <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
