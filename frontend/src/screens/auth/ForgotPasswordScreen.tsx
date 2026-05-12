import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/auth.store";
import { useTheme } from "../../hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export function ForgotPasswordScreen() {
  const navigation        = useNavigation();
  const { resetPassword } = useAuthStore();
  const { theme }         = useTheme();
  const { colors, spacing, typography } = theme;
  const insets            = useSafeAreaInsets();

  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  async function handleReset() {
    if (!email.trim()) { Alert.alert("Error", "Ingresá tu email"); return; }
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "No se pudo enviar el email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        padding: spacing.xl,
        paddingTop: insets.top + spacing.xl,
        paddingBottom: insets.bottom + spacing.xl,
      }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={20}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: spacing.xl }}>
        <Text style={{ color: colors.primary, fontSize: typography.fontSizes.base }}>← Volver</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>🔑</Text>

      <Text style={{ fontSize: typography.fontSizes.xxl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.xs }}>
        Recuperar contraseña
      </Text>

      {sent ? (
        <View>
          <Text style={{ fontSize: typography.fontSizes.base, color: colors.textSecondary, marginBottom: spacing.xl, lineHeight: 24 }}>
            Te enviamos un link a {email} para restablecer tu contraseña.
          </Text>
          <Button title="Volver al login" onPress={() => navigation.goBack()} variant="outline" fullWidth />
        </View>
      ) : (
        <View>
          <Text style={{ fontSize: typography.fontSizes.base, color: colors.textSecondary, marginBottom: spacing.xl }}>
            Ingresá tu email y te enviamos las instrucciones.
          </Text>
          <Input
            label="Email"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Button title="Enviar instrucciones" onPress={handleReset} loading={loading} fullWidth size="lg" style={{ marginTop: spacing.md }} />
        </View>
      )}
    </KeyboardAwareScrollView>
  );
}
