import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  Modal, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../hooks/useTheme";
import { supabase } from "../../services/supabase";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { getIconEmoji } from "../../utils/icons";
import type { Section, AccessTier } from "../../types";
import { TIER_LABEL, TIER_COLOR, TIER_EMOJI } from "../../types";

const TIER_OPTIONS: AccessTier[] = ["aprendiz", "companero", "maestro"];
const ICONS  = ["📚","💻","🔬","💡","📖","🎧","✨","🏆","🤝","🌱","📄","🎓","🗺️","🎨","🎵","⚡","🔥","🌍","🧠","🎯"];
const COLORS = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#EC4899","#6366F1","#F97316","#14B8A6","#84CC16"];

function mapSection(s: any): Section {
  return {
    id: s.id, name: s.name, description: s.description,
    icon: s.icon, color: s.color, tier: s.tier,
    isActive: s.is_active, createdBy: s.created_by,
    createdAt: s.created_at, updatedAt: s.updated_at,
  };
}

export function ManageSectionsScreen() {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;
  const queryClient = useQueryClient();
  const navigation  = useNavigation<any>();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Section | null>(null);
  const [name, setName]           = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier]           = useState<AccessTier>("aprendiz");
  const [icon, setIcon]           = useState("📚");
  const [color, setColor]         = useState("#3B82F6");

  const { data: sections, isLoading } = useQuery({
    queryKey: ["admin", "sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sections")
        .select("*, books(count)")
        .order("tier").order("name");
      if (error) throw error;
      return (data ?? []).map((s: any) => ({
        ...mapSection(s),
        bookCount: s.books?.[0]?.count ?? 0,
      }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        tier, icon, color,
      };
      if (editing) {
        const { error } = await supabase.from("sections").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sections").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sections"] });
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      setShowModal(false);
      Alert.alert("✅", editing ? "Sección actualizada" : "Sección creada");
    },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async (section: Section) => {
      const { error } = await supabase
        .from("sections").update({ is_active: !section.isActive }).eq("id", section.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "sections"] }),
  });

  function openCreate() {
    setEditing(null);
    setName(""); setDescription(""); setTier("aprendiz"); setIcon("📚"); setColor("#3B82F6");
    setShowModal(true);
  }

  function openEdit(section: Section) {
    setEditing(section);
    setName(section.name);
    setDescription(section.description ?? "");
    setTier(section.tier);
    setIcon(section.icon ?? "📚");
    setColor(section.color ?? "#3B82F6");
    setShowModal(true);
  }

  function handleSave() {
    if (!name.trim()) { Alert.alert("Error", "El nombre es requerido"); return; }
    saveMutation.mutate();
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Agrupar por tier
  const grouped = TIER_OPTIONS.map((t) => ({
    tier: t,
    sections: (sections ?? []).filter((s: any) => s.tier === t),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}>

        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl }}>
          <View>
            <Text style={{ fontSize: typography.fontSizes.xxl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary }}>
              Secciones
            </Text>
            <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginTop: 2 }}>
              {sections?.length ?? 0} secciones en total
            </Text>
          </View>
          <TouchableOpacity
            onPress={openCreate}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.xl,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
            }}
          >
            <Text style={{ color: colors.textInverse, fontWeight: "700", fontSize: typography.fontSizes.base }}>+ Nueva</Text>
          </TouchableOpacity>
        </View>

        {/* Secciones agrupadas por nivel */}
        {grouped.map(({ tier: t, sections: secs }) => (
          <View key={t} style={{ marginBottom: spacing.xl }}>
            {/* Header del grupo */}
            <View style={{
              flexDirection: "row", alignItems: "center",
              backgroundColor: TIER_COLOR[t] + "15",
              paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
              borderRadius: borderRadius.lg, marginBottom: spacing.sm,
            }}>
              <Text style={{ fontSize: 18, marginRight: spacing.xs }}>{TIER_EMOJI[t]}</Text>
              <Text style={{ fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.bold, color: TIER_COLOR[t], textTransform: "uppercase", letterSpacing: 1 }}>
                {TIER_LABEL[t]}
              </Text>
              <Text style={{ fontSize: typography.fontSizes.xs, color: TIER_COLOR[t] + "99", marginLeft: spacing.xs }}>
                ({secs.length})
              </Text>
            </View>

            {secs.length === 0 ? (
              <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textTertiary, paddingLeft: spacing.md, fontStyle: "italic" }}>
                Sin secciones en este nivel
              </Text>
            ) : (
              secs.map((section: any) => (
                <View
                  key={section.id}
                  style={{
                    backgroundColor: colors.backgroundCard,
                    borderRadius: borderRadius.xl,
                    marginBottom: spacing.sm,
                    overflow: "hidden",
                    ...shadows.sm,
                    opacity: section.isActive ? 1 : 0.55,
                  }}
                >
                  {/* Franja de color */}
                  <View style={{ height: 4, backgroundColor: section.color ?? colors.primary }} />

                  <View style={{ padding: spacing.md }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      {/* Ícono */}
                      <View style={{
                        width: 48, height: 48, borderRadius: borderRadius.lg,
                        backgroundColor: (section.color ?? colors.primary) + "20",
                        alignItems: "center", justifyContent: "center",
                        marginRight: spacing.md,
                      }}>
                        <Text style={{ fontSize: 24 }}>{getIconEmoji(section.icon)}</Text>
                      </View>

                      {/* Info */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.bold, color: colors.textPrimary }}>
                          {section.name}
                        </Text>
                        {section.description ? (
                          <Text numberOfLines={1} style={{ fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 2 }}>
                            {section.description}
                          </Text>
                        ) : null}
                        <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textTertiary, marginTop: 2 }}>
                          {section.bookCount} libro{section.bookCount !== 1 ? "s" : ""}
                        </Text>
                      </View>

                      {/* Acciones */}
                      <View style={{ flexDirection: "row", gap: spacing.xs }}>
                        {/* Ver libros */}
                        <TouchableOpacity
                          onPress={() => navigation.navigate("ManageBooks", { sectionId: section.id, sectionName: section.name })}
                          style={{ padding: 8, backgroundColor: colors.surface, borderRadius: borderRadius.md }}
                        >
                          <Text style={{ fontSize: 16 }}>📋</Text>
                        </TouchableOpacity>

                        {/* Editar */}
                        <TouchableOpacity
                          onPress={() => openEdit(section)}
                          style={{ padding: 8, backgroundColor: colors.surface, borderRadius: borderRadius.md }}
                        >
                          <Text style={{ fontSize: 16 }}>✏️</Text>
                        </TouchableOpacity>

                        {/* Activar/desactivar */}
                        <TouchableOpacity
                          onPress={() => toggleActive.mutate(section)}
                          style={{ padding: 8, backgroundColor: colors.surface, borderRadius: borderRadius.md }}
                        >
                          <Text style={{ fontSize: 16 }}>{section.isActive ? "🟢" : "🔴"}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        ))}
      </ScrollView>

      {/* ── Modal crear/editar ── */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <ScrollView style={{ backgroundColor: colors.backgroundCard, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
            contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>

            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: spacing.lg }} />

            <Text style={{ fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.xl }}>
              {editing ? "Editar sección" : "Nueva sección"}
            </Text>

            <Input label="Nombre *" placeholder="Ej: Programación" value={name} onChangeText={setName} />
            <Input label="Descripción" placeholder="Breve descripción opcional" value={description} onChangeText={setDescription} />

            {/* Nivel */}
            <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: "600" }}>
              Nivel de acceso *
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }}>
              {TIER_OPTIONS.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTier(t)}
                  style={{
                    flex: 1, padding: spacing.sm, borderRadius: borderRadius.xl,
                    alignItems: "center",
                    backgroundColor: tier === t ? TIER_COLOR[t] + "20" : colors.surface,
                    borderWidth: 2,
                    borderColor: tier === t ? TIER_COLOR[t] : "transparent",
                  }}
                >
                  <Text style={{ fontSize: 22, marginBottom: 2 }}>{TIER_EMOJI[t]}</Text>
                  <Text style={{ fontSize: 11, color: tier === t ? TIER_COLOR[t] : colors.textSecondary, fontWeight: "700" }}>
                    {TIER_LABEL[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Ícono */}
            <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: "600" }}>
              Ícono
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.lg }}>
              {ICONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  onPress={() => setIcon(ic)}
                  style={{
                    width: 48, height: 48, borderRadius: borderRadius.lg,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: icon === ic ? colors.primaryLight : colors.surface,
                    borderWidth: 2,
                    borderColor: icon === ic ? colors.primary : "transparent",
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color */}
            <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: "600" }}>
              Color
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.xl }}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: c,
                    borderWidth: color === c ? 3 : 1.5,
                    borderColor: color === c ? colors.textPrimary : c + "60",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  {color === c && <Text style={{ fontSize: 16 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview */}
            <View style={{
              flexDirection: "row", alignItems: "center",
              backgroundColor: color + "15",
              padding: spacing.md, borderRadius: borderRadius.xl,
              borderLeftWidth: 4, borderLeftColor: color,
              marginBottom: spacing.xl,
            }}>
              <Text style={{ fontSize: 28, marginRight: spacing.md }}>{getIconEmoji(icon)}</Text>
              <View>
                <Text style={{ fontSize: typography.fontSizes.base, fontWeight: "700", color: colors.textPrimary }}>
                  {name || "Nombre de la sección"}
                </Text>
                <Text style={{ fontSize: typography.fontSizes.xs, color: TIER_COLOR[tier] }}>
                  {TIER_EMOJI[tier]} {TIER_LABEL[tier]}
                </Text>
              </View>
            </View>

            <Button
              title={editing ? "Guardar cambios" : "Crear sección"}
              onPress={handleSave}
              loading={saveMutation.isPending}
              fullWidth size="lg"
            />
            <TouchableOpacity onPress={() => setShowModal(false)} style={{ marginTop: spacing.md, alignItems: "center", padding: spacing.sm }}>
              <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
