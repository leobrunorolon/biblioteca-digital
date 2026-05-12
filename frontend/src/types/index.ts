// ============================================================
// TIPOS GLOBALES - Biblioteca Digital
// ============================================================

export type UserRole = "admin" | "editor" | "reader";
export type BookFormat = "pdf" | "epub" | "txt" | "mp3" | "m4b" | "ppt" | "doc";
export type ThemeMode = "light" | "dark" | "system";

// Niveles de acceso acumulativos
// aprendiz  → accede a contenido nivel 1
// companero → accede a nivel 1 + 2
// maestro   → accede a nivel 1 + 2 + 3
export type AccessTier = "aprendiz" | "companero" | "maestro";

export const TIER_LEVEL: Record<AccessTier, number> = {
  aprendiz:  1,
  companero: 2,
  maestro:   3,
};

export const TIER_LABEL: Record<AccessTier, string> = {
  aprendiz:  "Aprendiz",
  companero: "Compañero",
  maestro:   "Maestro",
};

export const TIER_EMOJI: Record<AccessTier, string> = {
  aprendiz:  "🌱",
  companero: "🤝",
  maestro:   "🏆",
};

export const TIER_COLOR: Record<AccessTier, string> = {
  aprendiz:  "#10B981",
  companero: "#6366F1",
  maestro:   "#EC4899",
};

// ============================================================
// AUTH
// ============================================================
export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role: UserRole;
  // Nivel asignado por el admin. null = sin acceso
  tier: AccessTier | null;
  isActive: boolean;
  theme: ThemeMode;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// ============================================================
// SECTIONS
// ============================================================
export interface Section {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  // Nivel al que pertenece esta sección
  tier: AccessTier;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSectionAccess {
  id: string;
  userId: string;
  sectionId: string;
  grantedBy?: string;
  grantedAt: string;
}

// ============================================================
// BOOKS
// ============================================================
export interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  coverUrl?: string;
  fileUrl: string;
  audioUrl?: string;
  format: BookFormat;
  sectionId: string;
  section?: Section;
  // Nivel efectivo del libro (tier_override ?? section.tier)
  effectiveTier: AccessTier;
  tierOverride?: AccessTier;
  totalPages?: number;
  totalDuration?: number;
  fileSize?: number;
  tags?: string[];
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookWithProgress extends Book {
  progress?: ReadingProgress;
  isFavorite?: boolean;
}

// ============================================================
// READING PROGRESS
// ============================================================
export interface ReadingProgress {
  id: string;
  userId: string;
  bookId: string;
  currentPage: number;
  progressPercent: number;
  audioPosition?: number; // segundos
  lastReadAt: string;
  completed: boolean;
  completedAt?: string;
  totalReadTime: number; // segundos
}

// ============================================================
// BOOKMARKS
// ============================================================
export interface Bookmark {
  id: string;
  userId: string;
  bookId: string;
  page: number;
  position?: string; // CFI para EPUB
  note?: string;
  color?: string;
  createdAt: string;
}

// ============================================================
// HIGHLIGHTS
// ============================================================
export interface Highlight {
  id: string;
  userId: string;
  bookId: string;
  cfiRange: string;
  text: string;
  color: string;
  note?: string;
  createdAt: string;
}

// ============================================================
// FAVORITES
// ============================================================
export interface Favorite {
  id: string;
  userId: string;
  bookId: string;
  createdAt: string;
}

// ============================================================
// ANALYTICS
// ============================================================
export interface AnalyticsData {
  topBooks: Array<{ bookId: string; book: Book; count: number }>;
  activeUsers: number;
  totalBooks: number;
  totalUsers: number;
  completedBooks: number;
}

// ============================================================
// UPLOAD
// ============================================================
export interface UploadBookPayload {
  title: string;
  author: string;
  description?: string;
  sectionId: string;
  format: BookFormat;
  // Si se quiere sobreescribir el nivel de la sección
  tierOverride?: AccessTier;
  tags?: string[];
  coverFile?: {
    uri: string;
    name: string;
    type: string;
  };
  bookFile: {
    uri: string;
    name: string;
    type: string;
    size?: number;
  };
  audioFile?: {
    uri: string;
    name: string;
    type: string;
    size?: number;
  };
}

// ============================================================
// NAVIGATION
// ============================================================
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Admin: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Sections: undefined;
  Search: undefined;
  Favorites: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  BookDetails: { bookId: string };
  SectionBooks: { sectionId: string; sectionName: string };
  Reader: { bookId: string; format: BookFormat };
  AudioPlayer: { bookId: string };
};

export type AdminStackParamList = {
  Dashboard: undefined;
  UploadBook: undefined;
  ManageUsers: undefined;
  ManageSections: undefined;
  ManageBooks: { sectionId?: string; sectionName?: string };
  BookPreview: { bookId: string };
  Analytics: undefined;
  Reader: { bookId: string; format: string };
  AudioPlayer: { bookId: string };
};

// ============================================================
// READER
// ============================================================
export interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  theme: "light" | "dark" | "sepia";
  scrollDirection: "vertical" | "horizontal";
}

// ============================================================
// AUDIO PLAYER
// ============================================================
export interface AudioPlayerState {
  isPlaying: boolean;
  position: number; // segundos
  duration: number; // segundos
  speed: 1 | 1.5 | 2;
  sleepTimer?: number; // minutos
}

// ============================================================
// API RESPONSES
// ============================================================
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
