import { supabase } from "./supabase";
import type { Book, BookWithProgress, UploadBookPayload, PaginatedResponse } from "../types";

// Generar UUID compatible con React Native (sin crypto nativo)
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const booksService = {
  // ── Listar libros por sección ──────────────────────────────
  async getBooksBySection(
    sectionId: string,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<Book>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("books")
      .select("*, sections(id, name, color, icon)", { count: "exact" })
      .eq("section_id", sectionId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: (data ?? []).map(mapBook),
      count: count ?? 0,
      page,
      pageSize,
      hasMore: (count ?? 0) > to + 1,
    };
  },

  // ── Obtener libro por ID ───────────────────────────────────
  async getBookById(bookId: string): Promise<BookWithProgress> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("books")
      .select(`
        *,
        sections(id, name, color, icon),
        reading_progress!left(
          id, current_page, progress_percent, audio_position,
          last_read_at, completed, total_read_time
        ),
        favorites!left(id)
      `)
      .eq("id", bookId)
      .eq("reading_progress.user_id", user?.id ?? "")
      .eq("favorites.user_id", user?.id ?? "")
      .single();

    if (error) throw error;
    return mapBookWithProgress(data);
  },

  // ── Buscar libros ──────────────────────────────────────────
  async searchBooks(query: string, page = 1, pageSize = 20): Promise<PaginatedResponse<Book>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("books")
      .select("*, sections(id, name, color, icon)", { count: "exact" })
      .eq("is_active", true)
      .or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%`)
      .order("title")
      .range(from, to);

    if (error) throw error;

    return {
      data: (data ?? []).map(mapBook),
      count: count ?? 0,
      page,
      pageSize,
      hasMore: (count ?? 0) > to + 1,
    };
  },

  // ── Libros recientes ───────────────────────────────────────
  async getRecentBooks(limit = 10): Promise<Book[]> {
    const { data, error } = await supabase
      .from("books")
      .select("*, sections(id, name, color, icon)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []).map(mapBook);
  },

  // ── Continuar leyendo ──────────────────────────────────────
  async getContinueReading(limit = 5): Promise<BookWithProgress[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("reading_progress")
      .select(`
        *,
        books(*, sections(id, name, color, icon))
      `)
      .eq("user_id", user.id)
      .eq("completed", false)
      .gt("progress_percent", 0)
      .order("last_read_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((item: any) => ({
      ...mapBook(item.books),
      progress: mapProgress(item),
    }));
  },

  // ── Obtener URL firmada ────────────────────────────────────
  async getSignedUrl(bookId: string, type: "book" | "audio" = "book"): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-signed-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ bookId, type }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error ?? "Error al obtener URL");
    }

    const { signedUrl } = await response.json();
    return signedUrl;
  },

  // ── Subir libro (admin/editor) ─────────────────────────────
  async uploadBook(payload: UploadBookPayload): Promise<Book> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const bookId = generateUUID();

    // Subir portada
    let coverUrl: string | undefined;
    if (payload.coverFile) {
      const coverExt  = payload.coverFile.name.split(".").pop();
      const coverPath = `${payload.sectionId}/${bookId}/cover.${coverExt}`;
      await uploadFileToStorage("covers", coverPath, payload.coverFile.uri, payload.coverFile.type);
      const { data: { publicUrl } } = supabase.storage.from("covers").getPublicUrl(coverPath);
      coverUrl = publicUrl;
    }

    // Subir archivo del libro
    const bookExt  = payload.bookFile.name.split(".").pop();
    const bookPath = `${payload.sectionId}/${bookId}/book.${bookExt}`;
    await uploadFileToStorage("books", bookPath, payload.bookFile.uri, payload.bookFile.type);
    const fileUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/books/${bookPath}`;

    // Subir audio si existe
    let audioUrl: string | undefined;
    if (payload.audioFile) {
      const audioExt  = payload.audioFile.name.split(".").pop();
      const audioPath = `${payload.sectionId}/${bookId}/audio.${audioExt}`;
      await uploadFileToStorage("audiobooks", audioPath, payload.audioFile.uri, payload.audioFile.type);
      audioUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/audiobooks/${audioPath}`;
    }

    // Insertar en DB
    const { data, error } = await supabase
      .from("books")
      .insert({
        id: bookId,
        title: payload.title,
        author: payload.author,
        description: payload.description,
        cover_url: coverUrl,
        file_url: fileUrl,
        audio_url: audioUrl,
        format: payload.format,
        section_id: payload.sectionId,
        tags: payload.tags,
        file_size: payload.bookFile.size,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return mapBook(data);
  },
};

// ── Helpers ────────────────────────────────────────────────

/**
 * Sube un archivo local a Supabase Storage usando XMLHttpRequest
 * que sí soporta URIs locales de Android (content:// y file://)
 */
async function uploadFileToStorage(
  bucket: string,
  path: string,
  uri: string,
  contentType: string
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const anonKey    = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  const uploadUrl  = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.setRequestHeader("Authorization", `Bearer ${session?.access_token ?? anonKey}`);
    xhr.setRequestHeader("x-upsert", "true");

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
      }
    };
    xhr.onerror = (e) => reject(new Error(`Network error: ${JSON.stringify(e)}`));
    xhr.ontimeout = () => reject(new Error("Upload timeout"));
    xhr.timeout = 120000; // 2 minutos

    const formData = new FormData();
    formData.append("", {
      uri,
      name: path.split("/").pop() ?? "file",
      type: contentType,
    } as any);

    xhr.send(formData);
  });
}

function mapBook(data: any): Book {
  return {
    id: data.id,
    title: data.title,
    author: data.author,
    description: data.description,
    coverUrl: data.cover_url,
    fileUrl: data.file_url,
    audioUrl: data.audio_url,
    format: data.format,
    sectionId: data.section_id,
    section: data.sections
      ? {
          id: data.sections.id,
          name: data.sections.name,
          color: data.sections.color,
          icon: data.sections.icon,
          isActive: true,
          createdAt: "",
          updatedAt: "",
        }
      : undefined,
    totalPages: data.total_pages,
    totalDuration: data.total_duration,
    fileSize: data.file_size,
    tags: data.tags,
    isActive: data.is_active,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapProgress(data: any) {
  return {
    id: data.id,
    userId: data.user_id,
    bookId: data.book_id,
    currentPage: data.current_page,
    progressPercent: data.progress_percent,
    audioPosition: data.audio_position,
    lastReadAt: data.last_read_at,
    completed: data.completed,
    completedAt: data.completed_at,
    totalReadTime: data.total_read_time,
  };
}

function mapBookWithProgress(data: any): BookWithProgress {
  const book = mapBook(data);
  const progressData = Array.isArray(data.reading_progress)
    ? data.reading_progress[0]
    : data.reading_progress;
  const favData = Array.isArray(data.favorites) ? data.favorites[0] : data.favorites;

  return {
    ...book,
    progress: progressData ? mapProgress(progressData) : undefined,
    isFavorite: !!favData,
  };
}
