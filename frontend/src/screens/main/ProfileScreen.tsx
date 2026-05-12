import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  Switch,
} from "react-native";
import { useAuthStore } from "../../store/auth.store";
import { useThemeStore } from "../../store/theme.store";
import { useTheme } from "../../hooks/useTheme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { TierBadge, TierProgressBar } from "../../components/ui/TierBadge";
import { authService } from "../../services/auth.service";
import type { ThemeMode } from "../../types";

export function ProfileScreen() {
  const { user, signOut, updateProfile } = useAuthStore();
  const { mode, setMode } = useThemeStore();
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;

  // ── Modales ────────────────────────────────────────────
  const [showEditProfile, setShowEditProfile]   = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showNotifications, setShowNotifications]   = useState(false);

  // ── Edit profile state ─────────────────────────────────
  const [fullName, setFullName]   = useState(user?.fullName ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Change password state ──────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword]   = useState(false);

  // ── Notifications state ────────────────────────────────
  const [notifNewBook, setNotifNewBook]         = useState(true);
  const [notifContinue, setNotifContinue]       = useState(true);
  const [notifAudiobook, setNotifAudiobook]     = useState(false);

  const themeOptions: { label: string; value: ThemeMode; emoji: string }[] = [
    { label: "Claro",   value: "light",  emoji: "☀️" },
    { label: "Oscuro",  value: "dark",   emoji: "🌙" },
    { label: "Sistema", value: "system", emoji: "📱" },
  ];

  function handleSignOut() {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: signOut },
    ]);
  }

  async function handleSaveProfile() {
    if (!fullName.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío");
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({ fullName: fullName.trim() });
      setShowEditProfile(false);
      Alert.alert("✅ Perfil actualizado");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo actualizar el perfil");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (!newPassword || newPassword.length < 8) {
      Alert.alert("Error", "La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }
    setSavingPassword(true);
    try {
      await authService.updatePassword(newPassword);
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("✅ Contraseña actualizada", "Tu contraseña fue cambiada correctamente");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo cambiar la contraseña");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
    >
      {/* ── Avatar y nombre ── */}
      <View style={{ alignItems: "center", padding: spacing.xxl, backgroundColor: colors.backgroundSecond }}>
        <View style={{
          width: 88, height: 88, borderRadius: 44,
          backgroundColor: colors.primaryLight,
          alignItems: "center", justifyContent: "center",
          marginBottom: spacing.md, overflow: "hidden",
        }}>
          {user?.avatarUrl
            ? <Image source={{ uri: user.avatarUrl }} style={{ width: 88, height: 88 }} />
            : <Text style={{ fontSize: 36 }}>{user?.fullName?.charAt(0).toUpperCase() ?? "U"}</Text>
          }
        </View>
        <Text style={{ fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary }}>
          {user?.fullName ?? "Usuario"}
        </Text>
        <Text style={{ fontSize: typography.fontSizes.base, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm }}>
          {user?.email}
        </Text>
        <TierBadge tier={user?.tier ?? null} size="md" />
      </View>

      <View style={{ padding: spacing.xl }}>

        {/* ── Nivel ── */}
        <SectionTitle title="Mi nivel" colors={colors} typography={typography} spacing={spacing} />
        <View style={{ backgroundColor: colors.backgroundCard, borderRadius: borderRadius.xl, padding: spacing.lg, ...shadows.sm, marginBottom: spacing.xl }}>
          <TierProgressBar currentTier={user?.tier ?? null} />
          <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textSecondary, textAlign: "center", marginTop: spacing.md }}>
            {user?.tier === "aprendiz"  ? "Tenés acceso al contenido de Aprendiz"
            : user?.tier === "companero" ? "Tenés acceso a Aprendiz y Compañero"
            : user?.tier === "maestro"   ? "Tenés acceso completo a toda la biblioteca 🎉"
            : "Contactá al administrador para obtener acceso"}
          </Text>
        </View>

        {/* ── Apariencia ── */}
        <SectionTitle title="Apariencia" colors={colors} typography={typography} spacing={spacing} />
        <View style={{ backgroundColor: colors.backgroundCard, borderRadius: borderRadius.xl, padding: spacing.md, ...shadows.sm, marginBottom: spacing.xl }}>
          <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginBottom: spacing.sm }}>Tema</Text>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {themeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setMode(opt.value)}
                style={{
                  flex: 1, alignItems: "center", padding: spacing.sm,
                  borderRadius: borderRadius.lg,
                  backgroundColor: mode === opt.value ? colors.primaryLight : colors.surface,
                  borderWidth: 1.5,
                  borderColor: mode === opt.value ? colors.primary : "transparent",
                }}
              >
                <Text style={{ fontSize: 22, marginBottom: 4 }}>{opt.emoji}</Text>
                <Text style={{ fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.medium, color: mode === opt.value ? colors.primary : colors.textSecondary }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Cuenta ── */}
        <SectionTitle title="Cuenta" colors={colors} typography={typography} spacing={spacing} />
        <View style={{ backgroundColor: colors.backgroundCard, borderRadius: borderRadius.xl, overflow: "hidden", ...shadows.sm, marginBottom: spacing.xl }}>
          <MenuItem emoji="✏️" label="Editar perfil"       colors={colors} typography={typography} spacing={spacing} onPress={() => { setFullName(user?.fullName ?? ""); setShowEditProfile(true); }} />
          <Divider colors={colors} />
          <MenuItem emoji="🔑" label="Cambiar contraseña"  colors={colors} typography={typography} spacing={spacing} onPress={() => setShowChangePassword(true)} />
          <Divider colors={colors} />
          <MenuItem emoji="🔔" label="Notificaciones"      colors={colors} typography={typography} spacing={spacing} onPress={() => setShowNotifications(true)} />
        </View>

        <Button title="Cerrar sesión" variant="danger" onPress={handleSignOut} fullWidth />
      </View>

      {/* ══════════════════════════════════════════════════
          MODAL — Editar perfil
      ══════════════════════════════════════════════════ */}
      <Modal visible={showEditProfile} transparent animationType="slide" onRequestClose={() => setShowEditProfile(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: colors.backgroundCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.xl, paddingBottom: spacing.xxl }}>
            <ModalHandle colors={colors} />
            <Text style={{ fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.xl }}>
              Editar perfil
            </Text>

            <Input
              label="Nombre completo"
              placeholder="Tu nombre"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textTertiary, marginBottom: spacing.xl }}>
              Email: {user?.email} (no se puede cambiar)
            </Text>

            <Button title="Guardar cambios" onPress={handleSaveProfile} loading={savingProfile} fullWidth size="lg" />
            <TouchableOpacity onPress={() => setShowEditProfile(false)} style={{ marginTop: spacing.md, alignItems: "center", padding: spacing.sm }}>
              <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════
          MODAL — Cambiar contraseña
      ══════════════════════════════════════════════════ */}
      <Modal visible={showChangePassword} transparent animationType="slide" onRequestClose={() => setShowChangePassword(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: colors.backgroundCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.xl, paddingBottom: spacing.xxl }}>
            <ModalHandle colors={colors} />
            <Text style={{ fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.xl }}>
              Cambiar contraseña
            </Text>

            <Input
              label="Nueva contraseña"
              placeholder="Mínimo 8 caracteres"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              secureToggle
            />
            <Input
              label="Confirmar nueva contraseña"
              placeholder="Repetí la contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              secureToggle
            />

            <Button title="Cambiar contraseña" onPress={handleChangePassword} loading={savingPassword} fullWidth size="lg" />
            <TouchableOpacity onPress={() => setShowChangePassword(false)} style={{ marginTop: spacing.md, alignItems: "center", padding: spacing.sm }}>
              <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════
          MODAL — Notificaciones
      ══════════════════════════════════════════════════ */}
      <Modal visible={showNotifications} transparent animationType="slide" onRequestClose={() => setShowNotifications(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: colors.backgroundCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.xl, paddingBottom: spacing.xxl }}>
            <ModalHandle colors={colors} />
            <Text style={{ fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.xl }}>
              Notificaciones
            </Text>

            <NotifRow
              label="Nuevo libro disponible"
              description="Cuando se agrega un libro a tus secciones"
              value={notifNewBook}
              onChange={setNotifNewBook}
              colors={colors}
              typography={typography}
              spacing={spacing}
              borderRadius={borderRadius}
            />
            <Divider colors={colors} />
            <NotifRow
              label="Continuar leyendo"
              description="Recordatorio para retomar tu lectura"
              value={notifContinue}
              onChange={setNotifContinue}
              colors={colors}
              typography={typography}
              spacing={spacing}
              borderRadius={borderRadius}
            />
            <Divider colors={colors} />
            <NotifRow
              label="Audiolibro disponible"
              description="Cuando un libro tiene versión de audio"
              value={notifAudiobook}
              onChange={setNotifAudiobook}
              colors={colors}
              typography={typography}
              spacing={spacing}
              borderRadius={borderRadius}
            />

            <TouchableOpacity
              onPress={() => setShowNotifications(false)}
              style={{ marginTop: spacing.xl, backgroundColor: colors.primary, padding: spacing.md, borderRadius: borderRadius.xl, alignItems: "center" }}
            >
              <Text style={{ color: colors.textInverse, fontWeight: "700", fontSize: typography.fontSizes.base }}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ── Sub-componentes ────────────────────────────────────────

function SectionTitle({ title, colors, typography, spacing }: any) {
  return (
    <Text style={{
      fontSize: typography.fontSizes.sm,
      fontWeight: typography.fontWeights.semibold,
      color: colors.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: spacing.sm,
    }}>
      {title}
    </Text>
  );
}

function MenuItem({ emoji, label, onPress, colors, typography, spacing }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "center", padding: spacing.md }}>
      <Text style={{ fontSize: 20, marginRight: spacing.md }}>{emoji}</Text>
      <Text style={{ flex: 1, fontSize: typography.fontSizes.base, color: colors.textPrimary }}>{label}</Text>
      <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

function Divider({ colors }: any) {
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 52 }} />;
}

function ModalHandle({ colors }: any) {
  return <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 }} />;
}

function NotifRow({ label, description, value, onChange, colors, typography, spacing, borderRadius }: any) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: spacing.md }}>
      <View style={{ flex: 1, marginRight: spacing.md }}>
        <Text style={{ fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.medium, color: colors.textPrimary }}>
          {label}
        </Text>
        <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 2 }}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.surface, true: colors.primary + "80" }}
        thumbColor={value ? colors.primary : colors.textTertiary}
      />
    </View>
  );
}
