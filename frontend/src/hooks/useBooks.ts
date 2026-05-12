import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { booksService } from "../services/books.service";
import { progressService } from "../services/progress.service";
import type { UploadBookPayload } from "../types";

// ── Query Keys ─────────────────────────────────────────────
export const bookKeys = {
  all:            ["books"] as const,
  bySection:      (sectionId: string) => ["books", "section", sectionId] as const,
  detail:         (bookId: string) => ["books", bookId] as const,
  search:         (query: string) => ["books", "search", query] as const,
  recent:         ["books", "recent"] as const,
  continueReading: ["books", "continue"] as const,
  favorites:      ["books", "favorites"] as const,
  progress:       (bookId: string) => ["progress", bookId] as const,
  bookmarks:      (bookId: string) => ["bookmarks", bookId] as const,
  highlights:     (bookId: string) => ["highlights", bookId] as const,
};

// ── Hooks de consulta ──────────────────────────────────────

export function useBooksBySection(sectionId: string) {
  return useInfiniteQuery({
    queryKey: bookKeys.bySection(sectionId),
    queryFn: ({ pageParam = 1 }) => booksService.getBooksBySection(sectionId, pageParam),
    getNextPageParam: (last) => last.hasMore ? last.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!sectionId,
  });
}

export function useBook(bookId: string) {
  return useQuery({
    queryKey: bookKeys.detail(bookId),
    queryFn: () => booksService.getBookById(bookId),
    enabled: !!bookId,
  });
}

export function useSearchBooks(query: string) {
  return useInfiniteQuery({
    queryKey: bookKeys.search(query),
    queryFn: ({ pageParam = 1 }) => booksService.searchBooks(query, pageParam),
    getNextPageParam: (last) => last.hasMore ? last.page + 1 : undefined,
    initialPageParam: 1,
    enabled: query.length >= 2,
  });
}

export function useRecentBooks() {
  return useQuery({
    queryKey: bookKeys.recent,
    queryFn: () => booksService.getRecentBooks(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useContinueReading() {
  return useQuery({
    queryKey: bookKeys.continueReading,
    queryFn: () => booksService.getContinueReading(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useReadingProgress(bookId: string) {
  return useQuery({
    queryKey: bookKeys.progress(bookId),
    queryFn: () => progressService.getProgress(bookId),
    enabled: !!bookId,
  });
}

export function useBookmarks(bookId: string) {
  return useQuery({
    queryKey: bookKeys.bookmarks(bookId),
    queryFn: () => progressService.getBookmarks(bookId),
    enabled: !!bookId,
  });
}

export function useHighlights(bookId: string) {
  return useQuery({
    queryKey: bookKeys.highlights(bookId),
    queryFn: () => progressService.getHighlights(bookId),
    enabled: !!bookId,
  });
}

// ── Hooks de mutación ──────────────────────────────────────

export function useUpdateProgress(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Parameters<typeof progressService.upsertProgress>[1]) =>
      progressService.upsertProgress(bookId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.progress(bookId) });
      queryClient.invalidateQueries({ queryKey: bookKeys.continueReading });
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
    },
  });
}

export function useToggleFavorite(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => progressService.toggleFavorite(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
      queryClient.invalidateQueries({ queryKey: bookKeys.favorites });
    },
  });
}

export function useAddBookmark(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { page: number; position?: string; note?: string; color?: string }) =>
      progressService.addBookmark(bookId, params.page, params.position, params.note, params.color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.bookmarks(bookId) });
    },
  });
}

export function useDeleteBookmark(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookmarkId: string) => progressService.deleteBookmark(bookmarkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.bookmarks(bookId) });
    },
  });
}

export function useUploadBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UploadBookPayload) => booksService.uploadBook(payload),
    onSuccess: (book) => {
      queryClient.invalidateQueries({ queryKey: bookKeys.bySection(book.sectionId) });
      queryClient.invalidateQueries({ queryKey: bookKeys.recent });
    },
  });
}

export function useSignedUrl(bookId: string, type: "book" | "audio" = "book") {
  return useQuery({
    queryKey: ["signed-url", bookId, type],
    queryFn: () => booksService.getSignedUrl(bookId, type),
    enabled: !!bookId,
    staleTime: 50 * 60 * 1000, // 50 minutos (URL válida 1 hora)
    gcTime: 55 * 60 * 1000,
  });
}
