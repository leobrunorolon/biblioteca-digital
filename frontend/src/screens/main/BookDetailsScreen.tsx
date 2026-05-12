import React from "react";
import {
  View, Text, ScrollView, Image,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, RouteProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useBook, useToggleFavorite } from "../../hooks/useBooks";
import { Button } from "../../components/ui/Button";
import type { MainStackParamList } from "../../types";

type Nav   = NativeStackNavigationProp<MainStackParamList, "BookDetails">;
type Route = RouteProp<MainStackParamList, "BookDetails">;

export function BookDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { bookId } = route.params;
  const { theme }  = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;

  const { data: book, isLoading, error } = useBook(bookId);
  const toggleFavorite = useToggleFavorite(bookId);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !book) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.error }}>Error al cargar el libro</Text>
      </View>
    );
  }

  const isAudio  = book.format === "mp3" || book.format === "m4b";
  const hasAudio = !!book.audioUrl;
  const progress = book.progress;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
    >
      {/* Portada */}
      <View style={{ alignItems: "center", padding: spacing.xl, paddingTop: spacing.xxl, backgroundColor: colors.backgroundSecond }}>
        {book.coverUrl ? (
          <Image
            source={{ uri: book.coverUrl }}
            style={{ width: 160, height: 240, borderRadius: borderRadius.lg, ...shadows.lg, backgroundColor: colors.surface }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ width: 160, height: 240, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 64 }}>📚</Text>
          </View>
        )}
      </View>

      <View style={{ padding: spacing.xl }}>

        {/* Título + favorito */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.xs }}>
          <Text style={{ flex: 1, fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary }}>
            {book.title}
          </Text>
          <TouchableOpacity
            onPress={() => toggleFavorite.mutate()}
            style={{
              width: 48, height: 48, borderRadius: 24,
              backgroundColor: book.isFavorite ? "#EF444420" : colors.surface,
              alignItems: "center", justifyContent: "center",
              marginLeft: spacing.sm,
              borderWidth: 1.5,
              borderColor: book.isFavorite ? "#EF4444" : colors.border,
            }}
          >
            <Text style={{ fontSize: 24 }}>{book.isFavorite ? "❤️" : "🤍"}</Text>
          </TouchableOpacity>
        </View>

        {/* Autor */}
        <Text style={{ fontSize: typography.fontSizes.base, color: colors.textSecondary, marginBottom: spacing.md }}>
          {book.author}
        </Text>

        {/* Sección */}
        {book.section && (
          <View style={{ flexDirection: "row", marginBottom: spacing.lg }}>
            <View style={{ backgroundColor: (book.section.color ?? colors.primary) + "20", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full }}>
              <Text style={{ fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.semibold, color: book.section.color ?? colors.primary }}>
                {book.section.name}
              </Text>
            </View>
          </View>
        )}

        {/* Progreso */}
        {progress && progress.progressPercent > 0 && (
          <View style={{ backgroundColor: colors.backgroundCard, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg, ...shadows.sm }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs }}>
              <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary }}>Progreso</Text>
              <Text style={{ fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.semibold, color: colors.primary }}>
                {Math.round(progress.progressPercent)}%
              </Text>
            </View>
            <View style={{ height: 6, backgroundColor: colors.surface, borderRadius: 3, overflow: "hidden" }}>
              <View style={{ width: `${progress.progressPercent}%`, height: "100%", backgroundColor: colors.primary, borderRadius: 3 }} />
            </View>
          </View>
        )}

        {/* Botones */}
        <View style={{ gap: spacing.sm }}>
          {!isAudio && (
            <Button
              title={progress && progress.progressPercent > 0 ? `Continuar (${Math.round(progress.progressPercent)}%)` : "Leer ahora"}
              onPress={() => navigation.navigate("Reader", { bookId: book.id, format: book.format })}
              fullWidth size="lg"
            />
          )}
          {(isAudio || hasAudio) && (
            <Button
              title={progress?.audioPosition ? "Continuar escuchando" : "Escuchar"}
              onPress={() => navigation.navigate("AudioPlayer", { bookId: book.id })}
              variant={isAudio ? "primary" : "outline"}
              fullWidth size="lg"
            />
          )}
        </View>

        {/* Descripción */}
        {book.description && (
          <View style={{ marginTop: spacing.xl }}>
            <Text style={{ fontSize: typography.fontSizes.md, fontWeight: typography.fontWeights.semibold, color: colors.textPrimary, marginBottom: spacing.sm }}>
              Descripción
            </Text>
            <Text style={{ fontSize: typography.fontSizes.base, color: colors.textSecondary, lineHeight: 24 }}>
              {book.description}
            </Text>
          </View>
        )}

        {/* Tags */}
        {book.tags && book.tags.length > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={{ fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.semibold, color: colors.textSecondary, marginBottom: spacing.sm }}>
              Etiquetas
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {book.tags.map((tag) => (
                <View key={tag} style={{ backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full }}>
                  <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textSecondary }}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
