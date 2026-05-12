import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, RouteProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useBooksBySection } from "../../hooks/useBooks";
import { BookCard } from "../../components/books/BookCard";
import type { MainStackParamList } from "../../types";

type Nav   = NativeStackNavigationProp<MainStackParamList, "SectionBooks">;
type Route = RouteProp<MainStackParamList, "SectionBooks">;

export function SectionBooksScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { sectionId, sectionName } = route.params;
  const { theme }  = useTheme();
  const { colors, spacing, typography } = theme;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useBooksBySection(sectionId);

  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const books = data?.pages.flatMap((p) => p.data) ?? [];

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
        data={books}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        columnWrapperStyle={{ gap: spacing.sm }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📭</Text>
            <Text style={{ fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.semibold, color: colors.textPrimary }}>
              Sin libros aún
            </Text>
            <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
              Esta sección todavía no tiene contenido
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <BookCard
              book={item}
              variant="grid"
              onPress={() => navigation.navigate("BookDetails", { bookId: item.id })}
            />
          </View>
        )}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage
            ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
            : null
        }
      />
    </View>
  );
}
