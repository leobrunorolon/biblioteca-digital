-- ============================================================
-- BIBLIOTECA DIGITAL - Schema con sistema de niveles
-- Aprendiz → Compañero → Maestro (acumulativo)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

-- Roles internos del sistema
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'reader');

-- Niveles de acceso (acumulativos)
-- aprendiz  = nivel 1 → accede a libros nivel 1
-- companero = nivel 2 → accede a libros nivel 1 y 2
-- maestro   = nivel 3 → accede a libros nivel 1, 2 y 3
CREATE TYPE access_tier AS ENUM ('aprendiz', 'companero', 'maestro');

CREATE TYPE book_format AS ENUM ('pdf', 'epub', 'txt', 'mp3', 'm4b');
CREATE TYPE theme_mode  AS ENUM ('light', 'dark', 'system');

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  full_name    TEXT,
  avatar_url   TEXT,
  role         user_role   NOT NULL DEFAULT 'reader',
  -- Nivel de acceso asignado por el admin
  -- NULL = sin acceso a ningún contenido (usuario nuevo sin asignar)
  tier         access_tier NULL DEFAULT NULL,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  theme        theme_mode  NOT NULL DEFAULT 'system',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SECTIONS
-- Cada sección pertenece a un nivel
-- ============================================================
CREATE TABLE sections (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  description  TEXT,
  icon         TEXT,
  color        TEXT,
  -- A qué nivel pertenece esta sección
  tier         access_tier NOT NULL DEFAULT 'aprendiz',
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOOKS
-- Cada libro hereda el nivel de su sección,
-- pero también puede tener un nivel propio que lo sobreescribe
-- ============================================================
CREATE TABLE books (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          TEXT NOT NULL,
  author         TEXT NOT NULL,
  description    TEXT,
  cover_url      TEXT,
  file_url       TEXT NOT NULL,
  audio_url      TEXT,
  format         book_format NOT NULL,
  section_id     UUID NOT NULL REFERENCES sections(id),
  -- Nivel propio del libro (si es NULL, hereda el de la sección)
  tier_override  access_tier NULL DEFAULT NULL,
  total_pages    INTEGER,
  total_duration INTEGER,  -- segundos para audiolibros
  file_size      BIGINT,   -- bytes
  tags           TEXT[],
  is_active      BOOLEAN   NOT NULL DEFAULT TRUE,
  created_by     UUID REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- READING PROGRESS
-- ============================================================
CREATE TABLE reading_progress (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id          UUID NOT NULL REFERENCES books(id)    ON DELETE CASCADE,
  current_page     INTEGER     NOT NULL DEFAULT 0,
  progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  audio_position   INTEGER,   -- segundos
  last_read_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed        BOOLEAN     NOT NULL DEFAULT FALSE,
  completed_at     TIMESTAMPTZ,
  total_read_time  INTEGER     NOT NULL DEFAULT 0,  -- segundos
  UNIQUE(user_id, book_id)
);

-- ============================================================
-- BOOKMARKS
-- ============================================================
CREATE TABLE bookmarks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id    UUID NOT NULL REFERENCES books(id)    ON DELETE CASCADE,
  page       INTEGER NOT NULL,
  position   TEXT,
  note       TEXT,
  color      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HIGHLIGHTS
-- ============================================================
CREATE TABLE highlights (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id    UUID NOT NULL REFERENCES books(id)    ON DELETE CASCADE,
  cfi_range  TEXT NOT NULL,
  text       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#FFFF00',
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FAVORITES
-- ============================================================
CREATE TABLE favorites (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id    UUID NOT NULL REFERENCES books(id)    ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
CREATE TABLE activity_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  book_id    UUID REFERENCES books(id)    ON DELETE SET NULL,
  action     TEXT NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_books_section       ON books(section_id);
CREATE INDEX idx_books_format        ON books(format);
CREATE INDEX idx_books_tier          ON books(tier_override);
CREATE INDEX idx_books_tags          ON books USING GIN(tags);
CREATE INDEX idx_sections_tier       ON sections(tier);
CREATE INDEX idx_profiles_tier       ON profiles(tier);
CREATE INDEX idx_reading_progress_user ON reading_progress(user_id);
CREATE INDEX idx_reading_progress_book ON reading_progress(book_id);
CREATE INDEX idx_bookmarks_user_book ON bookmarks(user_id, book_id);
CREATE INDEX idx_highlights_user_book ON highlights(user_id, book_id);
CREATE INDEX idx_activity_log_user   ON activity_log(user_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- ============================================================
-- FUNCIÓN: nivel numérico del tier
-- aprendiz=1, companero=2, maestro=3
-- ============================================================
CREATE OR REPLACE FUNCTION tier_level(t access_tier)
RETURNS INTEGER AS $$
  SELECT CASE t
    WHEN 'aprendiz'  THEN 1
    WHEN 'companero' THEN 2
    WHEN 'maestro'   THEN 3
    ELSE 0
  END;
$$ LANGUAGE sql IMMUTABLE;

-- ============================================================
-- FUNCIÓN: nivel efectivo de un libro
-- Usa tier_override si existe, sino hereda de la sección
-- ============================================================
CREATE OR REPLACE FUNCTION book_effective_tier(p_book_id UUID)
RETURNS access_tier AS $$
  SELECT COALESCE(b.tier_override, s.tier)
  FROM books b
  JOIN sections s ON s.id = b.section_id
  WHERE b.id = p_book_id;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sections_updated_at
  BEFORE UPDATE ON sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- Nuevo usuario: sin tier asignado (NULL) hasta que admin lo asigne
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url, tier)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NULL  -- sin nivel hasta que admin asigne
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
