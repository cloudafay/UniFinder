-- Supabase Storage photos bucket için policy'ler
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- Mevcut policy'leri temizle
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow user delete own photos" ON storage.objects;

-- Yeni policy'ler oluştur

-- 1. Authenticated kullanıcılar photos bucket'ına yükleyebilir
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'photos');

-- 2. Herkes photos bucket'ındaki dosyaları okuyabilir (public)
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'photos');

-- 3. Authenticated kullanıcılar da okuyabilir
CREATE POLICY "Allow authenticated read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'photos');

-- 4. Kullanıcılar kendi yüklediklerini silebilir
CREATE POLICY "Allow user delete own photos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Kullanıcılar kendi fotoğraflarını güncelleyebilir
CREATE POLICY "Allow user update own photos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

SELECT 'Storage policies oluşturuldu!' as status;
