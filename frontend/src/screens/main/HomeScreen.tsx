import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "../../store/auth.store";
import { useTheme } from "../../hooks/useTheme";
import { useRecentBooks, useContinueReading } from "../../hooks/useBooks";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";
import { BookCard } from "../../components/books/BookCard";
import type { MainStackParamList } from "../../types";

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;

  const { data: recentBooks, isLoading: loadingRecent, refetch: refetchRecent } = useRecentBooks();
  const { data: continueBooks, isLoading: loadingContinue, refetch: refetchContinue } = useContinueReading();

  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh al volver a esta pantalla
  useRefreshOnFocus([["books", "recent"], ["books", "continue"]]);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([refetchRecent(), refetchContinue()]);
    setRefreshing(false);
  }

  const greeting = getGreeting();
  const firstName = user?.fullName?.split(" ")[0] ?? "lector";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={{ padding: spacing.xl, paddingBottom: spacing.md }}>
        <Text
          style={{
            fontSize: typography.fontSizes.sm,
            color: colors.textSecondary,
          }}
        >
          {greeting},
        </Text>
        <Text
          style={{
            fontSize: typography.fontSizes.xxl,
            fontWeight: typography.fontWeights.bold,
            color: colors.textPrimary,
          }}
        >
          {firstName} 👋
        </Text>
      </View>

      {/* Continuar leyendo */}
      {continueBooks && continueBooks.length > 0 && (
        <Section title="Continuar leyendo" colors={colors} spacing={spacing} typography={typography}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl }}>
            {continueBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                variant="horizontal"
                onPress={() =>
                  navigation.navigate("BookDetails", { bookId: book.id })
                }
              />
            ))}
          </ScrollView>
        </Section>
      )}

      {/* Últimos agregados */}
      {recentBooks && recentBooks.length > 0 && (
        <Section title="Últimos agregados" colors={colors} spacing={spacing} typography={typography}>
          <View style={{ paddingHorizontal: spacing.xl }}>
            {recentBooks.slice(0, 5).map((book) => (
              <BookCard
                key={book.id}
                book={book}
                variant="list"
                onPress={() =>
                  navigation.navigate("BookDetails", { bookId: book.id })
                }
              />
            ))}
          </View>
        </Section>
      )}

      {/* Estado vacío */}
      {!loadingRecent && (!recentBooks || recentBooks.length === 0) && (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            padding: spacing.xxl,
            marginTop: spacing.xxl,
          }}
        >
          <Text style={{ fontSize: 64, marginBottom: spacing.lg }}>📚</Text>
          <Text
            style={{
              fontSize: typography.fontSizes.lg,
              fontWeight: typography.fontWeights.semibold,
              color: colors.textPrimary,
              textAlign: "center",
            }}
          >
            Tu biblioteca está vacía
          </Text>
          <Text
            style={{
              fontSize: typography.fontSizes.base,
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: spacing.sm,
            }}
          >
            Explorá las secciones para encontrar libros
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function Section({
  title,
  children,
  colors,
  spacing,
  typography,
}: {
  title: string;
  children: React.ReactNode;
  colors: any;
  spacing: any;
  typography: any;
}) {
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text
        style={{
          fontSize: typography.fontSizes.lg,
          fontWeight: typography.fontWeights.bold,
          color: colors.textPrimary,
          paddingHorizontal: spacing.xl,
          marginBottom: spacing.md,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}
