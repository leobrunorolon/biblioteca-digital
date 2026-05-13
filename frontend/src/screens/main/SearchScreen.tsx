import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useSearchBooks } from "../../hooks/useBooks";
import { BookCard } from "../../components/books/BookCard";
import type { MainStackParamList } from "../../types";

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce simple
  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    const timer = setTimeout(() => setDebouncedQuery(text), 400);
    return () => clearTimeout(timer);
  }, []);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSearchBooks(debouncedQuery);

  const books = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Barra de búsqueda */}
      <View style={{ padding: spacing.xl, paddingBottom: spacing.md }}>
        <Text
          style={{
            fontSize: typography.fontSizes.xxl,
            fontWeight: typography.fontWeights.bold,
            color: colors.textPrimary,
            marginBottom: spacing.md,
          }}
        >
          Buscar
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.backgroundCard,
            borderRadius: borderRadius.xl,
            paddingHorizontal: spacing.md,
            borderWidth: 1.5,
            borderColor: query ? colors.borderFocus : colors.border,
          }}
        >
          <Text style={{ fontSize: 18, marginRight: spacing.sm }}>🔍</Text>
          <TextInput
            style={{
              flex: 1,
              fontSize: typography.fontSizes.base,
              color: colors.textPrimary,
              paddingVertical: 14,
            }}
            placeholder="Título, autor o descripción..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={handleQueryChange}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Text
              onPress={() => { setQuery(""); setDebouncedQuery(""); }}
              style={{ color: colors.textTertiary, fontSize: 18, padding: 4 }}
            >
              ✕
            </Text>
          )}
        </View>
      </View>

      {/* Resultados */}
      {debouncedQuery.length < 2 ? (
        <View style={{ alignItems: "center", paddingTop: spacing.xxl }}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🔍</Text>
          <Text style={{ fontSize: typography.fontSizes.base, color: colors.textSecondary }}>
            Escribí al menos 2 caracteres
          </Text>
        </View>
      ) : isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <BookCard
              book={item}
              variant="list"
              onPress={() => navigation.navigate("BookDetails", { bookId: item.id })}
            />
          )}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: spacing.xxl }}>
              <Text style={{ fontSize: 48, marginBottom: spacing.md }}>😕</Text>
              <Text
                style={{
                  fontSize: typography.fontSizes.lg,
                  fontWeight: typography.fontWeights.semibold,
                  color: colors.textPrimary,
                }}
              >
                Sin resultados
              </Text>
              <Text style={{ fontSize: typography.fontSizes.base, color: colors.textSecondary, marginTop: spacing.xs }}>
                Probá con otro término
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
