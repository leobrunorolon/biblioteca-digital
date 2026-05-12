import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Image, Modal, ScrollView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../hooks/useTheme";
import { supabase } from "../../services/supabase";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import type { Book, AccessTier } from "../../types";
import { TIER_LABEL, TIER_COLOR, TIER_EMOJI } from "../../types";

const FORMAT_COLOR: Record<string, string> = {
  pdf: "#EF4444", epub: "#3B82F6", txt: "#6B7280", mp3: "#F59E0B", m4b: "#F59E0B",
};

export function ManageBooksScreen() {
  const route      = useRoute<any>();
  const navigation = useNavigation<any>();
  const { sectionId, sectionName } = route.params ?? {};
  const { theme }  = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;
  const queryClient = useQueryClient();

  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form edición
  const [editTitle, setEditTitle]       = useState("");
  const [editAuthor, setEditAuthor]     = useState("");
  const [editDesc, setEditDesc]         = useState("");
  const [editTier, setEditTier]         = useState<AccessTier | null>(null);

  const { data: books, isLoading } = useQuery({
    queryKey: ["admin", "books", sectionId],
    queryFn: async () => {
      let query = supabase
        .from("books")
        .select("*, sections(name, color, tier)")
        .order("created_at", { ascending: false });

      if (sectionId) query = query.eq("section_id", sectionId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapBook);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (bookId: string) => {
      const { error } = await supabase.from("books").delete().eq("id", bookId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "books"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from("books").update({ is_active: !isActive }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "books"] }),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editingBook) return;
      const { error } = await supabase.from("books").update({
        title:         editTitle.trim(),
        author:        editAuthor.trim(),
        description:   editDesc.trim() || null,
        tier_override: editTier,
        updated_at:    new Date().toISOString(),
      }).eq("id", editingBook.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "books"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setShowEditModal(false);
      Alert.alert("✅", "Libro actualizado");
    },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  function confirmDelete(book: Book) {
    Alert.alert(
      "Eliminar libro",
      `¿Eliminar "${book.title}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteMutation.mutate(book.id),
        },
      ]
    );
  }

  function openEdit(book: Book) {
    setEditingBook(book);
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditDesc(book.description ?? "");
    setEditTier(book.tierOverride ?? null);
    setShowEditModal(true);
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
        data={books ?? []}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: typography.fontSizes.xxl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary }}>
              {sectionName ?? "Todos los libros"}
            </Text>
            <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginTop: 2 }}>
              {books?.length ?? 0} libro{(books?.length ?? 0) !== 1 ? "s" : ""}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📭</Text>
            <Text style={{ fontSize: typography.fontSizes.lg, fontWeight: "600", color: colors.textPrimary }}>
              Sin libros
            </Text>
            <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
              Subí el primer libro desde "Subir libro"
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("UploadBook")}
              style={{ marginTop: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.xl }}
            >
              <Text style={{ color: colors.textInverse, fontWeight: "700" }}>📤 Subir libro</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item: book }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("BookPreview", { bookId: book.id })}
          >
          <View style={{
            backgroundColor: colors.backgroundCard,
            borderRadius: borderRadius.xl,
            marginBottom: spacing.md,
            overflow: "hidden",
            ...shadows.sm,
            opacity: book.isActive ? 1 : 0.55,
          }}>
            <View style={{ flexDirection: "row", padding: spacing.md }}>
              {/* Portada */}
              {book.coverUrl ? (
                <Image
                  source={{ uri: book.coverUrl }}
                  style={{ width: 64, height: 96, borderRadius: borderRadius.md, backgroundColor: colors.surface }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{
                  width: 64, height: 96, borderRadius: borderRadius.md,
                  backgroundColor: colors.surface,
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 28 }}>📚</Text>
                </View>
              )}

              {/* Info */}
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text numberOfLines={2} style={{ fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.bold, color: colors.textPrimary }}>
                  {book.title}
                </Text>
                <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginTop: 2 }}>
                  {book.author}
                </Text>

                {/* Badges */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs }}>
                  {/* Formato */}
                  <View style={{ backgroundColor: FORMAT_COLOR[book.format] + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, color: FORMAT_COLOR[book.format], fontWeight: "700" }}>
                      {book.format.toUpperCase()}
                    </Text>
                  </View>

                  {/* Tier efectivo */}
                  <View style={{ backgroundColor: TIER_COLOR[book.effectiveTier] + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, color: TIER_COLOR[book.effectiveTier], fontWeight: "700" }}>
                      {TIER_EMOJI[book.effectiveTier]} {TIER_LABEL[book.effectiveTier]}
                      {book.tierOverride ? " (override)" : ""}
                    </Text>
                  </View>

                  {/* Estado */}
                  {!book.isActive && (
                    <View style={{ backgroundColor: colors.error + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 10, color: colors.error, fontWeight: "700" }}>Inactivo</Text>
                    </View>
                  )}
                </View>

                {/* Sección (si se muestra todos) */}
                {!sectionId && book.section && (
                  <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textTertiary, marginTop: 4 }}>
                    📂 {book.section.name}
                  </Text>
                )}
              </View>
            </View>

            {/* Barra de acciones */}
            <View style={{
              flexDirection: "row",
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}>
              <ActionBtn
                label="Editar"
                emoji="✏️"
                onPress={() => openEdit(book)}
                colors={colors}
                typography={typography}
              />
              <View style={{ width: 1, backgroundColor: colors.border }} />
              <ActionBtn
                label={book.isActive ? "Desactivar" : "Activar"}
                emoji={book.isActive ? "🔴" : "🟢"}
                onPress={() => toggleActiveMutation.mutate({ id: book.id, isActive: book.isActive })}
                colors={colors}
                typography={typography}
              />
              <View style={{ width: 1, backgroundColor: colors.border }} />
              <ActionBtn
                label="Eliminar"
                emoji="🗑️"
                onPress={() => confirmDelete(book)}
                colors={colors}
                typography={typography}
                danger
              />
            </View>
          </View>
          </TouchableOpacity>
        )}
      />

      {/* Modal editar libro */}
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

            <Input label="Título *" value={editTitle} onChangeText={setEditTitle} placeholder="Título del libro" />
            <Input label="Autor *"  value={editAuthor} onChangeText={setEditAuthor} placeholder="Nombre del autor" />
            <Input
              label="Descripción"
              value={editDesc}
              onChangeText={setEditDesc}
              placeholder="Descripción opcional"
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: "top" }}
            />

            {/* Override de tier */}
            <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: "600" }}>
              Nivel (sobreescribir el de la sección)
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.xs, marginBottom: spacing.xl }}>
              <TouchableOpacity
                onPress={() => setEditTier(null)}
                style={{
                  flex: 1, padding: spacing.sm, borderRadius: borderRadius.lg, alignItems: "center",
                  backgroundColor: editTier === null ? colors.primaryLight : colors.surface,
                  borderWidth: 2, borderColor: editTier === null ? colors.primary : "transparent",
                }}
              >
                <Text style={{ fontSize: 18 }}>🔗</Text>
                <Text style={{ fontSize: 10, color: editTier === null ? colors.primary : colors.textSecondary, fontWeight: "700" }}>
                  De sección
                </Text>
              </TouchableOpacity>
              {(["aprendiz", "companero", "maestro"] as AccessTier[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setEditTier(t)}
                  style={{
                    flex: 1, padding: spacing.sm, borderRadius: borderRadius.lg, alignItems: "center",
                    backgroundColor: editTier === t ? TIER_COLOR[t] + "20" : colors.surface,
                    borderWidth: 2, borderColor: editTier === t ? TIER_COLOR[t] : "transparent",
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{TIER_EMOJI[t]}</Text>
                  <Text style={{ fontSize: 10, color: editTier === t ? TIER_COLOR[t] : colors.textSecondary, fontWeight: "700" }}>
                    {TIER_LABEL[t]}
                  </Text>
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

function ActionBtn({ label, emoji, onPress, colors, typography, danger }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, gap: 4 }}
    >
      <Text style={{ fontSize: 14 }}>{emoji}</Text>
      <Text style={{ fontSize: typography.fontSizes.xs, fontWeight: "600", color: danger ? colors.error : colors.textSecondary }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function mapBook(data: any): Book {
  const sectionTier = data.sections?.tier ?? "aprendiz";
  return {
    id:            data.id,
    title:         data.title,
    author:        data.author,
    description:   data.description,
    coverUrl:      data.cover_url,
    fileUrl:       data.file_url,
    audioUrl:      data.audio_url,
    format:        data.format,
    sectionId:     data.section_id,
    section:       data.sections ? {
      id: data.section_id, name: data.sections.name,
      color: data.sections.color, tier: sectionTier,
      isActive: true, createdAt: "", updatedAt: "",
    } : undefined,
    effectiveTier: data.tier_override ?? sectionTier,
    tierOverride:  data.tier_override,
    totalPages:    data.total_pages,
    totalDuration: data.total_duration,
    fileSize:      data.file_size,
    tags:          data.tags,
    isActive:      data.is_active,
    createdBy:     data.created_by,
    createdAt:     data.created_at,
    updatedAt:     data.updated_at,
  };
}
