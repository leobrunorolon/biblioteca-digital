import { supabase } from "./supabase";
import type { ReadingProgress, Bookmark, Highlight } from "../types";

export const progressService = {
  // ── Progreso de lectura ────────────────────────────────────
  async getProgress(bookId: string): Promise<ReadingProgress | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("reading_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .maybeSingle();

    if (error) throw error;
    return data ? mapProgress(data) : null;
  },

  async upsertProgress(
    bookId: string,
    updates: {
      currentPage?: number;
      progressPercent?: number;
      audioPosition?: number;
      completed?: boolean;
      readTimeSeconds?: number;
    }
  ): Promise<ReadingProgress> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const existing = await progressService.getProgress(bookId);

    const payload: any = {
      user_id: user.id,
      book_id: bookId,
      last_read_at: new Date().toISOString(),
    };

    if (updates.currentPage !== undefined) payload.current_page = updates.currentPage;
    if (updates.progressPercent !== undefined) payload.progress_percent = updates.progressPercent;
    if (updates.audioPosition !== undefined) payload.audio_position = updates.audioPosition;
    if (updates.completed !== undefined) {
      payload.completed = updates.completed;
      if (updates.completed) payload.completed_at = new Date().toISOString();
    }
    if (updates.readTimeSeconds !== undefined) {
      payload.total_read_time = (existing?.totalReadTime ?? 0) + updates.readTimeSeconds;
    }

    const { data, error } = await supabase
      .from("reading_progress")
      .upsert(payload, { onConflict: "user_id,book_id" })
      .select()
      .single();

    if (error) throw error;
    return mapProgress(data);
  },

  // ── Bookmarks ──────────────────────────────────────────────
  async getBookmarks(bookId: string): Promise<Bookmark[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .order("page");

    if (error) throw error;
    return (data ?? []).map(mapBookmark);
  },

  async addBookmark(
    bookId: string,
    page: number,
    position?: string,
    note?: string,
    color?: string
  ): Promise<Bookmark> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        user_id: user.id,
        book_id: bookId,
        page,
        position,
        note,
        color,
      })
      .select()
      .single();

    if (error) throw error;
    return mapBookmark(data);
  },

  async deleteBookmark(bookmarkId: string): Promise<void> {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", bookmarkId);
    if (error) throw error;
  },

  // ── Highlights ─────────────────────────────────────────────
  async getHighlights(bookId: string): Promise<Highlight[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("highlights")
      .select("*")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .order("created_at");

    if (error) throw error;
    return (data ?? []).map(mapHighlight);
  },

  async addHighlight(
    bookId: string,
    cfiRange: string,
    text: string,
    color = "#FFFF00",
    note?: string
  ): Promise<Highlight> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data, error } = await supabase
      .from("highlights")
      .insert({
        user_id: user.id,
        book_id: bookId,
        cfi_range: cfiRange,
        text,
        color,
        note,
      })
      .select()
      .single();

    if (error) throw error;
    return mapHighlight(data);
  },

  async deleteHighlight(highlightId: string): Promise<void> {
    const { error } = await supabase
      .from("highlights")
      .delete()
      .eq("id", highlightId);
    if (error) throw error;
  },

  // ── Favoritos ──────────────────────────────────────────────
  async toggleFavorite(bookId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .maybeSingle();

    if (existing) {
      await supabase.from("favorites").delete().eq("id", existing.id);
      return false;
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, book_id: bookId });
      return true;
    }
  },

  async getFavorites(): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("favorites")
      .select("book_id")
      .eq("user_id", user.id);

    if (error) throw error;
    return (data ?? []).map((f: any) => f.book_id);
  },
};

// ── Mappers ────────────────────────────────────────────────

function mapProgress(data: any): ReadingProgress {
  return {
    id: data.id,
    userId: data.user_id,
    bookId: data.book_id,
    currentPage: data.current_page,
    progressPercent: parseFloat(data.progress_percent),
    audioPosition: data.audio_position,
    lastReadAt: data.last_read_at,
    completed: data.completed,
    completedAt: data.completed_at,
    totalReadTime: data.total_read_time,
  };
}

function mapBookmark(data: any): Bookmark {
  return {
    id: data.id,
    userId: data.user_id,
    bookId: data.book_id,
    page: data.page,
    position: data.position,
    note: data.note,
    color: data.color,
    createdAt: data.created_at,
  };
}

function mapHighlight(data: any): Highlight {
  return {
    id: data.id,
    userId: data.user_id,
    bookId: data.book_id,
    cfiRange: data.cfi_range,
    text: data.text,
    color: data.color,
    note: data.note,
    createdAt: data.created_at,
  };
}
