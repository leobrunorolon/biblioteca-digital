import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "../../store/auth.store";
import { useTheme } from "../../hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { MasonicLogo } from "../../components/ui/MasonicLogo";
import type { AuthStackParamList } from "../../types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Login">;

export function LoginScreen() {
  const navigation            = useNavigation<Nav>();
  const { signIn, isLoading } = useAuthStore();
  const { theme }             = useTheme();
  const { colors, spacing, typography } = theme;
  const insets                = useSafeAreaInsets();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "El email es requerido";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Email inválido";
    if (!password) e.password = "La contraseña es requerida";
    else if (password.length < 6) e.password = "Mínimo 6 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (error: any) {
      Alert.alert("Error al iniciar sesión", error.message ?? "Verificá tus credenciales e intentá de nuevo.");
    }
  }

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        padding: spacing.xl,
        paddingTop: insets.top + spacing.lg,
        paddingBottom: insets.bottom + spacing.xl,
      }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={20}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo masónico */}
      <View style={{ alignItems: "center", marginBottom: spacing.xxl }}>
        <MasonicLogo size={120} color="#C9A84C" showText />
        <Text style={{
          fontSize: typography.fontSizes.xs,
          color: colors.textTertiary,
          marginTop: spacing.sm,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}>
          Biblioteca Digital
        </Text>
      </View>

      {/* Formulario */}
      <Input
        label="Email"
        placeholder="tu@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
      />

      <Input
        label="Contraseña"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        secureToggle
        autoComplete="password"
        error={errors.password}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate("ForgotPassword")}
        style={{ alignSelf: "flex-end", marginBottom: spacing.lg, marginTop: -spacing.sm }}
      >
        <Text style={{ fontSize: typography.fontSizes.sm, color: colors.primary, fontWeight: typography.fontWeights.medium }}>
          ¿Olvidaste tu contraseña?
        </Text>
      </TouchableOpacity>

      <Button
        title="Iniciar sesión"
        onPress={handleLogin}
        loading={isLoading}
        fullWidth
        size="lg"
      />

      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.xl }}>
        <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.base }}>
          ¿No tenés cuenta?{" "}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={{ color: colors.primary, fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.semibold }}>
            Registrate
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}
