-- Konum Bazlı Filtreleme SQL
-- Supabase SQL Editor'de bu kodu çalıştırın

-- 1. Profiles tablosuna konum kolonları ekle
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;

-- 2. Konum indexi oluştur (performans için)
CREATE INDEX IF NOT EXISTS idx_profiles_location 
ON profiles (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 3. Yakındaki profilleri getiren RPC fonksiyonu
-- Haversine formülü ile mesafe hesaplama
CREATE OR REPLACE FUNCTION get_nearby_profiles(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 10,
  user_id UUID DEFAULT NULL,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  photos TEXT[],
  bio TEXT,
  university TEXT,
  department TEXT,
  year TEXT,
  gender TEXT,
  interests TEXT[],
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.display_name,
    p.avatar_url,
    p.photos,
    p.bio,
    p.university,
    p.department,
    p.year,
    p.gender,
    p.interests,
    p.latitude,
    p.longitude,
    -- Haversine formülü ile mesafe hesapla (km)
    (
      6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians(p.latitude)) * 
        cos(radians(p.longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(p.latitude))
      )
    ) AS distance_km
  FROM profiles p
  WHERE 
    -- Konum bilgisi olan profiller
    p.latitude IS NOT NULL 
    AND p.longitude IS NOT NULL
    -- Kendisi hariç
    AND (user_id IS NULL OR p.id != user_id)
    -- Belirtilen yarıçap içinde
    AND (
      6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians(p.latitude)) * 
        cos(radians(p.longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(p.latitude))
      )
    ) <= radius_km
    -- Daha önce swipe edilmemiş (opsiyonel - açılabilir)
    -- AND NOT EXISTS (
    --   SELECT 1 FROM swipes s 
    --   WHERE s.swiper_id = user_id AND s.swiped_id = p.id
    -- )
  ORDER BY distance_km ASC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- 4. Kullanıcının konumunu güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_user_location(
  p_user_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET 
    latitude = p_latitude,
    longitude = p_longitude,
    location_updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS - Sadece authenticated kullanıcılar RPC'yi çağırabilir
-- (Zaten mevcut RLS politikaları yeterli)

-- 6. Test verisi ekle (İstanbul koordinatları)
-- Kadıköy: 40.9819, 29.0270
-- Beşiktaş: 41.0422, 29.0056
-- Üsküdar: 41.0231, 29.0151
-- Bakırköy: 40.9792, 28.8717

-- Örnek: Mevcut profillerinize test konumu eklemek için:
-- UPDATE profiles SET latitude = 41.0082, longitude = 28.9784 WHERE id = 'YOUR_USER_ID';
