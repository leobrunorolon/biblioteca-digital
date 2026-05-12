-- ============================================================
-- ROW LEVEL SECURITY - Sistema de niveles acumulativos
-- ============================================================

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections       ENABLE ROW LEVEL SECURITY;
ALTER TABLE books          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights     ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites      ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Tier del usuario actual (puede ser NULL)
CREATE OR REPLACE FUNCTION get_user_tier()
RETURNS access_tier AS $$
  SELECT tier FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Nivel numérico del tier del usuario actual
CREATE OR REPLACE FUNCTION get_user_tier_level()
RETURNS INTEGER AS $$
  SELECT tier_level(tier) FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ¿Es admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ¿Es admin o editor?
CREATE OR REPLACE FUNCTION is_admin_or_editor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ¿El usuario tiene acceso a un tier dado?
-- Lógica acumulativa: si tenés nivel 2 (compañero), accedés a nivel 1 y 2
CREATE OR REPLACE FUNCTION user_can_access_tier(required_tier access_tier)
RETURNS BOOLEAN AS $$
  SELECT
    -- Admin siempre puede
    is_admin()
    OR
    -- El nivel del usuario >= nivel requerido
    (
      get_user_tier() IS NOT NULL
      AND
      get_user_tier_level() >= tier_level(required_tier)
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ¿El usuario puede ver este libro específico?
CREATE OR REPLACE FUNCTION user_can_read_book(p_book_id UUID)
RETURNS BOOLEAN AS $$
  SELECT user_can_access_tier(book_effective_tier(p_book_id));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

-- Cada usuario ve su propio perfil; admin ve todos
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR is_admin()
  );

-- Usuario actualiza su propio perfil (no puede cambiar tier ni role)
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- No puede cambiar su propio rol ni tier
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND (
      tier IS NOT DISTINCT FROM (SELECT tier FROM profiles WHERE id = auth.uid())
    )
  );

-- Admin actualiza cualquier perfil (incluyendo tier y role)
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

-- ============================================================
-- SECTIONS POLICIES
-- ============================================================

-- Un usuario ve las secciones cuyo tier puede acceder
CREATE POLICY "sections_select" ON sections
  FOR SELECT USING (
    is_active = TRUE
    AND user_can_access_tier(tier)
  );

-- Admin ve todas las secciones (activas o no)
CREATE POLICY "sections_select_admin" ON sections
  FOR SELECT USING (is_admin());

CREATE POLICY "sections_insert" ON sections
  FOR INSERT WITH CHECK (is_admin_or_editor());

CREATE POLICY "sections_update" ON sections
  FOR UPDATE USING (is_admin_or_editor());

CREATE POLICY "sections_delete" ON sections
  FOR DELETE USING (is_admin());

-- ============================================================
-- BOOKS POLICIES
-- ============================================================

-- Usuario ve libros cuyo nivel efectivo puede acceder
CREATE POLICY "books_select" ON books
  FOR SELECT USING (
    is_active = TRUE
    AND user_can_read_book(id)
  );

-- Admin ve todos los libros
CREATE POLICY "books_select_admin" ON books
  FOR SELECT USING (is_admin());

CREATE POLICY "books_insert" ON books
  FOR INSERT WITH CHECK (is_admin_or_editor());

CREATE POLICY "books_update" ON books
  FOR UPDATE USING (is_admin_or_editor());

CREATE POLICY "books_delete" ON books
  FOR DELETE USING (is_admin());

-- ============================================================
-- READING PROGRESS POLICIES
-- ============================================================

CREATE POLICY "progress_select" ON reading_progress
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "progress_insert" ON reading_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "progress_update" ON reading_progress
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- BOOKMARKS POLICIES
-- ============================================================

CREATE POLICY "bookmarks_select" ON bookmarks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "bookmarks_insert" ON bookmarks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "bookmarks_update" ON bookmarks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "bookmarks_delete" ON bookmarks
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- HIGHLIGHTS POLICIES
-- ============================================================

CREATE POLICY "highlights_select" ON highlights
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "highlights_insert" ON highlights
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "highlights_update" ON highlights
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "highlights_delete" ON highlights
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- FAVORITES POLICIES
-- ============================================================

CREATE POLICY "favorites_select" ON favorites
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "favorites_insert" ON favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_delete" ON favorites
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- ACTIVITY LOG POLICIES
-- ============================================================

CREATE POLICY "activity_select_admin" ON activity_log
  FOR SELECT USING (is_admin());

CREATE POLICY "activity_select_own" ON activity_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "activity_insert" ON activity_log
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
