-- ============================================================
-- SEED DATA - Secciones por nivel
-- ============================================================

-- APRENDIZ (nivel 1) - contenido introductorio
INSERT INTO sections (id, name, description, icon, color, tier) VALUES
  (uuid_generate_v4(), 'Primeros Pasos',     'Introducción al conocimiento',          'academic-cap',  '#10B981', 'aprendiz'),
  (uuid_generate_v4(), 'Fundamentos',        'Bases sólidas para empezar',            'book-open',     '#3B82F6', 'aprendiz'),
  (uuid_generate_v4(), 'Lecturas Básicas',   'Textos accesibles para todo público',   'document-text', '#F59E0B', 'aprendiz')
ON CONFLICT DO NOTHING;

-- COMPAÑERO (nivel 2) - contenido intermedio
INSERT INTO sections (id, name, description, icon, color, tier) VALUES
  (uuid_generate_v4(), 'Desarrollo Personal','Crecimiento y habilidades blandas',     'light-bulb',    '#8B5CF6', 'companero'),
  (uuid_generate_v4(), 'Técnica Avanzada',   'Profundización en áreas específicas',   'code-bracket',  '#6366F1', 'companero'),
  (uuid_generate_v4(), 'Audiolibros',        'Escuchá mientras hacés otra cosa',      'speaker-wave',  '#F97316', 'companero')
ON CONFLICT DO NOTHING;

-- MAESTRO (nivel 3) - contenido premium/completo
INSERT INTO sections (id, name, description, icon, color, tier) VALUES
  (uuid_generate_v4(), 'Biblioteca Completa','Acceso a todo el catálogo',             'sparkles',      '#EC4899', 'maestro'),
  (uuid_generate_v4(), 'Masterclass',        'Contenido exclusivo de alto nivel',     'star',          '#EF4444', 'maestro'),
  (uuid_generate_v4(), 'Archivo Especial',   'Material reservado para maestros',      'lock-open',     '#14B8A6', 'maestro')
ON CONFLICT DO NOTHING;

-- ============================================================
-- REFERENCIA RÁPIDA - Cómo asignar niveles
-- ============================================================
-- Asignar nivel Aprendiz a un usuario:
--   UPDATE profiles SET tier = 'aprendiz' WHERE email = 'usuario@email.com';
--
-- Subir a Compañero (ya tiene acceso a Aprendiz + Compañero):
--   UPDATE profiles SET tier = 'companero' WHERE email = 'usuario@email.com';
--
-- Subir a Maestro (acceso total):
--   UPDATE profiles SET tier = 'maestro' WHERE email = 'usuario@email.com';
--
-- Quitar acceso (sin nivel):
--   UPDATE profiles SET tier = NULL WHERE email = 'usuario@email.com';
