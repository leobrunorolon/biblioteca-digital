-- ============================================================
-- HELPERS PARA GESTIÓN DE TIERS DESDE EL PANEL ADMIN
-- ============================================================

-- Vista: usuarios con su nivel y cantidad de libros accesibles
CREATE OR REPLACE VIEW user_tier_summary AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.tier,
  p.is_active,
  p.created_at,
  -- Cuántos libros puede ver según su tier
  (
    SELECT COUNT(*)
    FROM books b
    JOIN sections s ON s.id = b.section_id
    WHERE b.is_active = TRUE
      AND tier_level(COALESCE(b.tier_override, s.tier)) <= COALESCE(tier_level(p.tier), 0)
  ) AS accessible_books_count,
  -- Cuántos libros ha leído
  (
    SELECT COUNT(*)
    FROM reading_progress rp
    WHERE rp.user_id = p.id AND rp.progress_percent > 0
  ) AS books_in_progress,
  -- Cuántos completó
  (
    SELECT COUNT(*)
    FROM reading_progress rp
    WHERE rp.user_id = p.id AND rp.completed = TRUE
  ) AS books_completed
FROM profiles p;

-- Vista: libros con su nivel efectivo
CREATE OR REPLACE VIEW books_with_tier AS
SELECT
  b.*,
  s.name  AS section_name,
  s.color AS section_color,
  s.tier  AS section_tier,
  COALESCE(b.tier_override, s.tier) AS effective_tier,
  tier_level(COALESCE(b.tier_override, s.tier)) AS tier_level_num
FROM books b
JOIN sections s ON s.id = b.section_id;

-- Función: asignar tier a usuario (para usar desde Edge Functions o admin)
CREATE OR REPLACE FUNCTION admin_set_user_tier(
  p_user_id UUID,
  p_tier    access_tier  -- pasar NULL para quitar acceso
)
RETURNS profiles AS $$
DECLARE
  updated_profile profiles;
BEGIN
  UPDATE profiles
  SET tier = p_tier, updated_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO updated_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', p_user_id;
  END IF;

  RETURN updated_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: estadísticas de distribución de tiers
CREATE OR REPLACE FUNCTION tier_distribution()
RETURNS TABLE(
  tier          TEXT,
  user_count    BIGINT,
  pct           NUMERIC
) AS $$
  WITH totals AS (
    SELECT COUNT(*) AS total FROM profiles WHERE role = 'reader'
  )
  SELECT
    COALESCE(p.tier::TEXT, 'sin_nivel') AS tier,
    COUNT(*) AS user_count,
    ROUND(COUNT(*) * 100.0 / NULLIF((SELECT total FROM totals), 0), 1) AS pct
  FROM profiles p
  WHERE p.role = 'reader'
  GROUP BY p.tier
  ORDER BY
    CASE p.tier
      WHEN 'maestro'   THEN 1
      WHEN 'companero' THEN 2
      WHEN 'aprendiz'  THEN 3
      ELSE 4
    END;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- QUERIES ÚTILES PARA EL ADMIN (referencia)
-- ============================================================

-- Ver distribución de niveles:
--   SELECT * FROM tier_distribution();

-- Ver resumen de un usuario:
--   SELECT * FROM user_tier_summary WHERE email = 'usuario@email.com';

-- Ver todos los libros con su nivel efectivo:
--   SELECT title, author, effective_tier, tier_level_num FROM books_with_tier ORDER BY tier_level_num, title;

-- Asignar nivel Aprendiz:
--   SELECT admin_set_user_tier('uuid-del-usuario', 'aprendiz');

-- Subir a Compañero:
--   SELECT admin_set_user_tier('uuid-del-usuario', 'companero');

-- Subir a Maestro:
--   SELECT admin_set_user_tier('uuid-del-usuario', 'maestro');

-- Quitar acceso:
--   SELECT admin_set_user_tier('uuid-del-usuario', NULL);

-- Asignar nivel a todos los usuarios nuevos sin nivel:
--   UPDATE profiles SET tier = 'aprendiz' WHERE tier IS NULL AND role = 'reader';
