-- Hatalı hikaye kayıtlarını düzeltme
-- file:// ile başlayan yerel URI'lar web'de çalışmaz

-- Yerel dosya yolu olan hikayeleri bul
SELECT id, user_id, image_url, created_at 
FROM stories 
WHERE image_url LIKE 'file://%';

-- Bu hikayeleri silmek için (yorumdan çıkarın):
-- DELETE FROM stories WHERE image_url LIKE 'file://%';

-- Veya belirli bir hikayeyi silmek için:
-- DELETE FROM stories WHERE id = 'HIKAYE_ID_BURAYA';
