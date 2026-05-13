import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
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
  const navigation  = useNavigation<Nav>();
  const { signIn }  = useAuthStore();
  const { theme }   = useTheme();
  const { colors, spacing, typography } = theme;
  const insets      = useSafeAreaInsets();

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [errors, setErrors]         = useState<{ email?: string; password?: string }>({});
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading]       = useState(false);

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
    setLoginError("");
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      // Si llega acá sin error, onAuthStateChange navega automáticamente
    } catch (error: any) {
      const msg = error.message ?? "";
      let userMessage = "Verificá tus credenciales e intentá de nuevo.";

      if (msg.toLowerCase().includes("email not confirmed")) {
        userMessage = "Tu email aún no fue confirmado. Contactá al administrador.";
      } else if (msg.toLowerCase().includes("invalid login credentials") || msg.toLowerCase().includes("invalid credentials")) {
        userMessage = "Email o contraseña incorrectos.";
      } else if (msg.toLowerCase().includes("too many requests")) {
        userMessage = "Demasiados intentos. Esperá unos minutos.";
      }

      setLoginError(userMessage);
      setLoading(false); // solo apagar loading si falló — si tuvo éxito navega y el componente se desmonta
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
      {/* Logo de la Logia */}
      <View style={{ alignItems: "center", marginBottom: spacing.xxl }}>
        <Image
          source={require("../../../assets/icon.png")}
          style={{ width: 140, height: 140, borderRadius: 70, marginBottom: spacing.md }}
          resizeMode="contain"
          onError={() => {}}
        />
        <Text style={{ fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.bold, color: colors.textPrimary, letterSpacing: 1 }}>
          Logia Almirante Howard
        </Text>
        <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, letterSpacing: 2 }}>
          Nº 67 · Jujuy
        </Text>
        <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textTertiary, marginTop: spacing.xs, letterSpacing: 1 }}>
          Biblioteca Digital
        </Text>
      </View>

      {/* Formulario */}
      <Input
        label="Email"
        placeholder="tu@email.com"
        value={email}
        onChangeText={(t) => { setEmail(t); setLoginError(""); }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
      />

      <Input
        label="Contraseña"
        placeholder="••••••••"
        value={password}
        onChangeText={(t) => { setPassword(t); setLoginError(""); }}
        secureTextEntry
        secureToggle
        autoComplete="off"
        error={errors.password}
      />

      {/* Error de login inline — no borra los campos */}
      {loginError ? (
        <View style={{
          backgroundColor: "#FEF2F2",
          borderRadius: 10,
          padding: spacing.md,
          marginBottom: spacing.md,
          borderLeftWidth: 3,
          borderLeftColor: "#EF4444",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: spacing.xs,
        }}>
          <Text style={{ fontSize: 14 }}>⚠️</Text>
          <Text style={{ flex: 1, fontSize: typography.fontSizes.sm, color: "#B91C1C", lineHeight: 18 }}>
            {loginError}
          </Text>
        </View>
      ) : null}

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
        loading={loading}
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
