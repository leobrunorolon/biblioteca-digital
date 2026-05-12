// ============================================================
// PALETA DE COLORES - Biblioteca Digital
// ============================================================

export const palette = {
  // Primarios
  indigo: {
    50:  "#EEF2FF",
    100: "#E0E7FF",
    200: "#C7D2FE",
    300: "#A5B4FC",
    400: "#818CF8",
    500: "#6366F1",
    600: "#4F46E5",
    700: "#4338CA",
    800: "#3730A3",
    900: "#312E81",
  },

  // Neutros
  gray: {
    50:  "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
    950: "#030712",
  },

  // Semánticos
  success: "#10B981",
  warning: "#F59E0B",
  error:   "#EF4444",
  info:    "#3B82F6",

  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
};

// ── Tema claro ─────────────────────────────────────────────
export const lightColors = {
  // Fondos
  background:        palette.gray[50],
  backgroundSecond:  palette.white,
  backgroundCard:    palette.white,
  backgroundModal:   palette.white,

  // Superficies
  surface:           palette.gray[100],
  surfaceSecond:     palette.gray[200],

  // Texto
  textPrimary:       palette.gray[900],
  textSecondary:     palette.gray[600],
  textTertiary:      palette.gray[400],
  textInverse:       palette.white,

  // Bordes
  border:            palette.gray[200],
  borderFocus:       palette.indigo[500],

  // Primario
  primary:           palette.indigo[600],
  primaryLight:      palette.indigo[100],
  primaryDark:       palette.indigo[800],

  // Semánticos
  success:           palette.success,
  warning:           palette.warning,
  error:             palette.error,
  info:              palette.info,

  // Navegación
  tabBar:            palette.white,
  tabBarBorder:      palette.gray[200],
  tabActive:         palette.indigo[600],
  tabInactive:       palette.gray[400],

  // Lector
  readerBackground:  palette.white,
  readerText:        palette.gray[900],
};

// ── Tema oscuro ────────────────────────────────────────────
export const darkColors = {
  // Fondos
  background:        palette.gray[950],
  backgroundSecond:  palette.gray[900],
  backgroundCard:    palette.gray[800],
  backgroundModal:   palette.gray[800],

  // Superficies
  surface:           palette.gray[800],
  surfaceSecond:     palette.gray[700],

  // Texto
  textPrimary:       palette.gray[50],
  textSecondary:     palette.gray[400],
  textTertiary:      palette.gray[600],
  textInverse:       palette.gray[900],

  // Bordes
  border:            palette.gray[700],
  borderFocus:       palette.indigo[400],

  // Primario
  primary:           palette.indigo[400],
  primaryLight:      palette.indigo[900],
  primaryDark:       palette.indigo[200],

  // Semánticos
  success:           palette.success,
  warning:           palette.warning,
  error:             palette.error,
  info:              palette.info,

  // Navegación
  tabBar:            palette.gray[900],
  tabBarBorder:      palette.gray[800],
  tabActive:         palette.indigo[400],
  tabInactive:       palette.gray[600],

  // Lector
  readerBackground:  palette.gray[950],
  readerText:        palette.gray[100],
};

export type AppColors = typeof lightColors;
