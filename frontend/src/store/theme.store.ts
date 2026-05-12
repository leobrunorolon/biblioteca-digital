import { create } from "zustand";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ThemeMode } from "../types";

interface ThemeStore {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  initialize: () => Promise<void>;
}

const THEME_KEY = "@biblioteca/theme";

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: "system",
  isDark: Appearance.getColorScheme() === "dark",

  initialize: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      const mode = (saved as ThemeMode) ?? "system";
      const isDark = resolveIsDark(mode);
      set({ mode, isDark });
    } catch {
      // Usar defaults
    }

    // Escuchar cambios del sistema
    Appearance.addChangeListener(({ colorScheme }) => {
      const { mode } = get();
      if (mode === "system") {
        set({ isDark: colorScheme === "dark" });
      }
    });
  },

  setMode: async (mode) => {
    const isDark = resolveIsDark(mode);
    set({ mode, isDark });
    await AsyncStorage.setItem(THEME_KEY, mode);
  },
}));

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return Appearance.getColorScheme() === "dark";
}
