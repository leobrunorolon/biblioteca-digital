import { create } from "zustand";
import { supabase } from "../services/supabase";
import { authService } from "../services/auth.service";
import type { User } from "../types";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const session = await authService.getSession();

      if (session?.user) {
        const profile = await authService.getProfile(session.user.id);
        set({ user: profile, isAuthenticated: true });
      }
    } catch (error: any) {
      // Si el refresh token es inválido, limpiar la sesión
      if (error?.message?.includes("Refresh Token") || error?.message?.includes("Invalid")) {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
      } else {
        console.error("Error initializing auth:", error);
      }
    } finally {
      set({ isLoading: false });
    }

    // Escuchar cambios de sesión
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        try {
          const profile = await authService.getProfile(session.user.id);
          set({ user: profile, isAuthenticated: true });
        } catch (error) {
          console.error("Error loading profile:", error);
        }
      } else if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" && !session) {
        set({ user: null, isAuthenticated: false });
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // Token renovado exitosamente
        try {
          const profile = await authService.getProfile(session.user.id);
          set({ user: profile, isAuthenticated: true });
        } catch {}
      }
    });
  },

  signIn: async (email, password) => {
    // No tocar isLoading global — el componente maneja su propio loading
    // para evitar re-renders que limpian los campos
    await authService.signIn(email, password);
    // onAuthStateChange se encarga de setear user e isAuthenticated
  },

  signUp: async (email, password, fullName) => {
    set({ isLoading: true });
    try {
      await authService.signUp(email, password, fullName);
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await authService.signOut();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (email) => {
    await authService.resetPassword(email);
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;

    const updated = await authService.updateProfile(user.id, updates);
    set({ user: updated });
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));
