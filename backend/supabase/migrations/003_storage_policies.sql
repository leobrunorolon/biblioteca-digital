-- ============================================================
-- STORAGE BUCKETS Y POLICIES
-- ============================================================

-- Crear buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('covers',     'covers',     TRUE,  5242880,   ARRAY['image/jpeg','image/png','image/webp']),
  ('books',      'books',      FALSE, 104857600, ARRAY['application/pdf','application/epub+zip','text/plain']),
  ('audiobooks', 'audiobooks', FALSE, 524288000, ARRAY['audio/mpeg','audio/mp4','audio/x-m4b']),
  ('avatars',    'avatars',    TRUE,  2097152,   ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- COVERS (público para leer, admin/editor para escribir)
-- ============================================================
CREATE POLICY "covers_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "covers_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'covers' AND
    auth.role() = 'authenticated' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "covers_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'covers' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

-- ============================================================
-- BOOKS (usuarios con tier pueden leer, admin/editor escriben)
-- ============================================================
CREATE POLICY "books_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'books' AND
    auth.role() = 'authenticated' AND
    (SELECT tier FROM profiles WHERE id = auth.uid()) IS NOT NULL
  );

CREATE POLICY "books_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'books' AND
    auth.role() = 'authenticated' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "books_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'books' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

-- ============================================================
-- AUDIOBOOKS (igual que books)
-- ============================================================
CREATE POLICY "audiobooks_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'audiobooks' AND
    auth.role() = 'authenticated' AND
    (SELECT tier FROM profiles WHERE id = auth.uid()) IS NOT NULL
  );

CREATE POLICY "audiobooks_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audiobooks' AND
    auth.role() = 'authenticated' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "audiobooks_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'audiobooks' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

-- ============================================================
-- AVATARS (público para leer, cualquier autenticado sube el suyo)
-- ============================================================
CREATE POLICY "avatars_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated'
  );
