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
import type { AuthStackParamList } from "../../types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Register">;

export function RegisterScreen() {
  const navigation            = useNavigation<Nav>();
  const { signUp, isLoading } = useAuthStore();
  const { theme }             = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const insets                = useSafeAreaInsets();

  const [fullName, setFullName]               = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors]                   = useState<Record<string, string>>({});
  const [success, setSuccess]                 = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "El nombre es requerido";
    if (!email.trim()) e.email = "El email es requerido";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Email inválido";
    if (!password) e.password = "La contraseña es requerida";
    else if (password.length < 8) e.password = "Mínimo 8 caracteres";
    if (password !== confirmPassword) e.confirmPassword = "Las contraseñas no coinciden";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    try {
      await signUp(email.trim().toLowerCase(), password, fullName.trim());
      setSuccess(true);
    } catch (error: any) {
      const msg = error.message ?? "";
      let userMessage = "Intentá de nuevo.";

      if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("user already exists")) {
        userMessage = "Ya existe una cuenta con ese email. Intentá iniciar sesión.";
      } else if (msg.toLowerCase().includes("password")) {
        userMessage = "La contraseña no cumple los requisitos mínimos.";
      } else {
        userMessage = msg || userMessage;
      }

      Alert.alert("Error al registrarse", userMessage);
    }
  }

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
        {/* Ícono de éxito */}
        <View style={{
          width: 96, height: 96, borderRadius: 48,
          backgroundColor: "#10B98120",
          alignItems: "center", justifyContent: "center",
          marginBottom: spacing.lg,
        }}>
          <Text style={{ fontSize: 52 }}>✅</Text>
        </View>

        <Text style={{
          fontSize: typography.fontSizes.xxl,
          fontWeight: typography.fontWeights.bold,
          color: colors.textPrimary,
          textAlign: "center",
          marginBottom: spacing.sm,
        }}>
          ¡Cuenta creada!
        </Text>

        <Text style={{
          fontSize: typography.fontSizes.base,
          color: colors.textSecondary,
          textAlign: "center",
          marginBottom: spacing.xl,
        }}>
          Tu cuenta fue registrada con el email{"\n"}
          <Text style={{ color: colors.primary, fontWeight: typography.fontWeights.semibold }}>
            {email}
          </Text>
        </Text>

        {/* Aviso de acceso pendiente */}
        <View style={{
          backgroundColor: "#FEF3C7",
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          marginBottom: spacing.xl,
          width: "100%",
          borderLeftWidth: 4,
          borderLeftColor: "#F59E0B",
        }}>
          <Text style={{
            fontSize: typography.fontSizes.base,
            fontWeight: typography.fontWeights.bold,
            color: "#92400E",
            marginBottom: spacing.xs,
          }}>
            ⏳ Acceso pendiente
          </Text>
          <Text style={{
            fontSize: typography.fontSizes.sm,
            color: "#92400E",
            lineHeight: 20,
          }}>
            Tu cuenta fue creada pero todavía no tenés acceso al contenido.{"\n\n"}
            Contactá al administrador de la logia para que te habilite los permisos.
          </Text>
        </View>

        <Button title="Ir al inicio de sesión" onPress={() => navigation.navigate("Login")} fullWidth size="lg" />
      </View>
    );
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

      <Text style={{ fontSize: typography.fontSizes.xxl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.xs }}>
        Crear cuenta
      </Text>
      <Text style={{ fontSize: typography.fontSizes.base, color: colors.textSecondary, marginBottom: spacing.lg }}>
        Completá tus datos para empezar
      </Text>

      {/* Aviso */}
      <View style={{ backgroundColor: colors.primaryLight, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg, flexDirection: "row", gap: spacing.sm }}>
        <Text style={{ fontSize: 16 }}>ℹ️</Text>
        <Text style={{ flex: 1, fontSize: typography.fontSizes.xs, color: colors.primary, lineHeight: 18 }}>
          Después de registrarte, el administrador te asignará tu nivel de acceso al contenido.
        </Text>
      </View>

      <Input label="Nombre completo" placeholder="Juan Pérez" value={fullName} onChangeText={setFullName} autoCapitalize="words" autoComplete="name" error={errors.fullName} />
      <Input label="Email" placeholder="tu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errors.email} />
      <Input label="Contraseña" placeholder="Mínimo 8 caracteres" value={password} onChangeText={setPassword} secureTextEntry secureToggle error={errors.password} />
      <Input label="Confirmar contraseña" placeholder="Repetí tu contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry secureToggle error={errors.confirmPassword} />

      <Button title="Crear cuenta" onPress={handleRegister} loading={isLoading} fullWidth size="lg" style={{ marginTop: spacing.md }} />
    </KeyboardAwareScrollView>
  );
}
