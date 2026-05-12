import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ReaderSettings } from "../types";

interface ReaderStore {
  settings: ReaderSettings;
  updateSettings: (updates: Partial<ReaderSettings>) => Promise<void>;
  initialize: () => Promise<void>;
}

const READER_KEY = "@biblioteca/reader-settings";

const defaultSettings: ReaderSettings = {
  fontSize: 20,        // más grande para personas mayores
  fontFamily: "Georgia",
  lineHeight: 1.8,     // más espacio entre líneas
  theme: "light",
  scrollDirection: "vertical",
};

export const useReaderStore = create<ReaderStore>((set, get) => ({
  settings: defaultSettings,

  initialize: async () => {
    try {
      const saved = await AsyncStorage.getItem(READER_KEY);
      if (saved) {
        set({ settings: { ...defaultSettings, ...JSON.parse(saved) } });
      }
    } catch {
      // Usar defaults
    }
  },

  updateSettings: async (updates) => {
    const newSettings = { ...get().settings, ...updates };
    set({ settings: newSettings });
    await AsyncStorage.setItem(READER_KEY, JSON.stringify(newSettings));
  },
}));
