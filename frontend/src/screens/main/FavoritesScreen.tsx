import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "../../hooks/useTheme";
import { useAuthStore } from "../../store/auth.store";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";
import { supabase } from "../../services/supabase";
import { BookCard } from "../../components/books/BookCard";
import type { MainStackParamList, BookWithProgress } from "../../types";

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function FavoritesScreen() {
  const navigation = useNavigation<Nav>();
  const { user }   = useAuthStore();
  const { theme }  = useTheme();
  const { colors, spacing, typography } = theme;

  const [refreshing, setRefreshing] = useState(false);

  const { data: favorites, isLoading, refetch } = useQuery({
    queryKey: ["books", "favorites", user?.id],
    queryFn: async (): Promise<BookWithProgress[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("favorites")
        .select(`
          book_id,
          books(
            *,
            sections(id, name, color, icon, tier),
            reading_progress!left(
              current_page, progress_percent, audio_position,
              last_read_at, completed, total_read_time
            )
          )
        `)
        .eq("user_id", user.id)
        .eq("books.reading_progress.user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? [])
        .map((item: any) => item.books)
        .filter(Boolean)
        .map((b: any) => {
          const sectionTier = b.sections?.tier ?? "aprendiz";
          const progress    = Array.isArray(b.reading_progress)
            ? b.reading_progress[0]
            : b.reading_progress;

          return {
            id:            b.id,
            title:         b.title,
            author:        b.author,
            description:   b.description,
            coverUrl:      b.cover_url,
            fileUrl:       b.file_url,
            audioUrl:      b.audio_url,
            format:        b.format,
            sectionId:     b.section_id,
            section:       b.sections ? {
              id: b.section_id, name: b.sections.name,
              color: b.sections.color, icon: b.sections.icon,
              tier: sectionTier, isActive: true,
              createdAt: "", updatedAt: "",
            } : undefined,
            effectiveTier: b.tier_override ?? sectionTier,
            tierOverride:  b.tier_override,
            totalPages:    b.total_pages,
            totalDuration: b.total_duration,
            fileSize:      b.file_size,
            tags:          b.tags,
            isActive:      b.is_active,
            createdBy:     b.created_by,
            createdAt:     b.created_at,
            updatedAt:     b.updated_at,
            isFavorite:    true,
            progress: progress ? {
              id:              progress.id ?? "",
              userId:          user.id,
              bookId:          b.id,
              currentPage:     progress.current_page,
              progressPercent: parseFloat(progress.progress_percent),
              audioPosition:   progress.audio_position,
              lastReadAt:      progress.last_read_at,
              completed:       progress.completed,
              totalReadTime:   progress.total_read_time,
            } : undefined,
          } as BookWithProgress;
        });
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  // Actualizar al volver a esta pantalla
  useRefreshOnFocus([["books", "favorites", user?.id ?? ""]]);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
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
        data={favorites ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{
              fontSize: typography.fontSizes.xxl,
              fontWeight: typography.fontWeights.bold,
              color: colors.textPrimary,
            }}>
              Favoritos
            </Text>
            {(favorites?.length ?? 0) > 0 && (
              <Text style={{
                fontSize: typography.fontSizes.sm,
                color: colors.textSecondary,
                marginTop: 2,
              }}>
                {favorites?.length} libro{favorites?.length !== 1 ? "s" : ""}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <BookCard
            book={item}
            variant="list"
            onPress={() => navigation.navigate("BookDetails", { bookId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <Text style={{ fontSize: 64, marginBottom: spacing.lg }}>🤍</Text>
            <Text style={{
              fontSize: typography.fontSizes.xl,
              fontWeight: typography.fontWeights.bold,
              color: colors.textPrimary,
              textAlign: "center",
            }}>
              Sin favoritos aún
            </Text>
            <Text style={{
              fontSize: typography.fontSizes.base,
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: spacing.sm,
              paddingHorizontal: spacing.xl,
            }}>
              Tocá el ❤️ en cualquier libro para guardarlo acá
            </Text>
          </View>
        }
      />
    </View>
  );
}
