import { supabase } from "./supabase";
import type { User } from "../types";

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: "biblioteca://auth/callback",
      },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "biblioteca://auth/reset-password",
    });
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return mapProfile(data);
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name:  updates.fullName,
        avatar_url: updates.avatarUrl,
        theme:      updates.theme,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return mapProfile(data);
  },

  // Solo admin puede cambiar el tier de un usuario
  async setUserTier(userId: string, tier: import("../types").AccessTier | null) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ tier, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return mapProfile(data);
  },

  // Listar todos los usuarios (solo admin)
  async listUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapProfile);
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Mapear snake_case de DB a camelCase
function mapProfile(data: any): User {
  return {
    id:        data.id,
    email:     data.email,
    fullName:  data.full_name,
    avatarUrl: data.avatar_url,
    role:      data.role,
    tier:      data.tier ?? null,
    isActive:  data.is_active,
    theme:     data.theme,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
