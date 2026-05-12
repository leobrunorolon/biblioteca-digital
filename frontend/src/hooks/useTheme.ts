import { useThemeStore } from "../store/theme.store";
import { getTheme } from "../theme";

export function useTheme() {
  // Acceso seguro al store — evita crash si el store no está listo
  const isDark  = useThemeStore((s) => s.isDark);
  const mode    = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const theme   = getTheme(isDark ?? false);
  return { theme, isDark: isDark ?? false, mode: mode ?? "system", setMode };
}
