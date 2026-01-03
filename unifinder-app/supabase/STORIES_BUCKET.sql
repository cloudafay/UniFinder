-- Supabase Storage stories bucket için policy'ler
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- NOT: Önce Supabase Dashboard > Storage'dan "stories" bucket'ını oluşturun!
-- Bucket ayarları: Public bucket: ON

-- Mevcut policy'leri temizle (hata verirse görmezden gelin)
DROP POLICY IF EXISTS "Allow authenticated uploads stories" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read stories" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read stories" ON storage.objects;
DROP POLICY IF EXISTS "Allow user delete own stories" ON storage.objects;

-- Stories bucket için policy'ler

-- 1. Authenticated kullanıcılar stories bucket'ına yükleyebilir
CREATE POLICY "Allow authenticated uploads stories" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'stories');

-- 2. Herkes stories bucket'ındaki dosyaları okuyabilir (public)
CREATE POLICY "Allow public read stories" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'stories');

-- 3. Authenticated kullanıcılar da okuyabilir
CREATE POLICY "Allow authenticated read stories" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'stories');

-- 4. Kullanıcılar kendi hikayelerini silebilir
CREATE POLICY "Allow user delete own stories" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'stories');

SELECT 'Stories bucket policies oluşturuldu!' as status;
