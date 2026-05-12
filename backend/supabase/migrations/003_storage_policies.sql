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
-- COVERS (público - solo lectura para todos)
-- ============================================================
CREATE POLICY "covers_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "covers_admin_editor_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'covers' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "covers_admin_editor_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'covers' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "covers_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'covers' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- BOOKS (privado - acceso por sección)
-- ============================================================
-- Los archivos se nombran: {section_id}/{book_id}.{ext}
CREATE POLICY "books_read_with_access" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'books' AND
    -- Verificar que el usuario tiene acceso a la sección del libro
    EXISTS (
      SELECT 1 FROM books b
      JOIN user_section_access usa ON usa.section_id = b.section_id
      WHERE usa.user_id = auth.uid()
        AND b.file_url LIKE '%' || storage.objects.name
    ) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "books_admin_editor_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'books' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "books_admin_editor_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'books' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "books_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'books' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- AUDIOBOOKS (privado - mismo control que books)
-- ============================================================
CREATE POLICY "audiobooks_read_with_access" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'audiobooks' AND
    EXISTS (
      SELECT 1 FROM books b
      JOIN user_section_access usa ON usa.section_id = b.section_id
      WHERE usa.user_id = auth.uid()
        AND b.audio_url LIKE '%' || storage.objects.name
    ) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "audiobooks_admin_editor_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audiobooks' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "audiobooks_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'audiobooks' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- AVATARS (público - cada usuario sube el suyo)
-- ============================================================
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_user_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_user_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
