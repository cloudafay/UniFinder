-- =====================================================
-- UniFinder - Supabase Tam Kurulum SQL'i
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştır
-- =====================================================

-- =====================================================
-- 1. PUSH NOTIFICATIONS - Push Token Tablosu
-- =====================================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  device_type TEXT, -- 'ios', 'android', 'web'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- RLS aktif et
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own tokens" ON push_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens" ON push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens" ON push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

-- =====================================================
-- 2. LOCATION - Konum Kolonları
-- =====================================================

-- Profiles tablosuna konum kolonları ekle
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE;

-- Konum indexi
CREATE INDEX IF NOT EXISTS idx_profiles_location 
ON profiles(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Yakındaki profilleri bulmak için fonksiyon (Haversine formülü)
CREATE OR REPLACE FUNCTION get_nearby_profiles(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 10,
  exclude_user_id UUID DEFAULT NULL,
  max_results INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  university TEXT,
  department TEXT,
  year TEXT,
  interests TEXT[],
  photos TEXT[],
  is_active BOOLEAN,
  distance_km DOUBLE PRECISION,
  -- Badge fields
  is_verified_student BOOLEAN,
  university_name TEXT,
  badge_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.university,
    p.department,
    p.year,
    p.interests,
    p.photos,
    p.is_active,
    -- Haversine distance calculation
    (6371 * acos(
      cos(radians(user_lat)) * cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(p.latitude))
    )) AS distance_km,
    p.is_verified_student,
    p.university_name,
    p.badge_type
  FROM profiles p
  WHERE 
    p.latitude IS NOT NULL 
    AND p.longitude IS NOT NULL
    AND p.is_active = TRUE
    AND (exclude_user_id IS NULL OR p.id != exclude_user_id)
    AND (6371 * acos(
      cos(radians(user_lat)) * cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(p.latitude))
    )) <= radius_km
  ORDER BY distance_km ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. STUDENT BADGE - Öğrenci Rozeti Sistemi
-- =====================================================

-- Rozet kolonları ekle
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_verified_student BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS university_name TEXT,
ADD COLUMN IF NOT EXISTS badge_type TEXT;

-- Yorumlar
COMMENT ON COLUMN profiles.is_verified_student IS 'True if user registered with .edu.tr email';
COMMENT ON COLUMN profiles.university_name IS 'University name extracted from email domain';
COMMENT ON COLUMN profiles.badge_type IS 'Badge type: verified_student, international_student, or null';

-- Rozet filtreleme indexi
CREATE INDEX IF NOT EXISTS idx_profiles_verified_student 
ON profiles(is_verified_student) 
WHERE is_verified_student = TRUE;

-- Mevcut kullanıcıları güncelle (email'e göre rozet ata)
UPDATE profiles
SET 
  is_verified_student = TRUE,
  badge_type = 'verified_student'
WHERE email LIKE '%.edu.tr'
  AND (is_verified_student IS NULL OR is_verified_student = FALSE);

UPDATE profiles
SET 
  badge_type = 'international_student'
WHERE email LIKE '%.edu' 
  AND email NOT LIKE '%.edu.tr'
  AND badge_type IS NULL;

-- =====================================================
-- 4. STORAGE BUCKETS (Manuel oluştur - Dashboard'dan)
-- =====================================================
-- Supabase Dashboard > Storage > New Bucket:
-- 1. "avatars" bucket - Public
-- 2. "photos" bucket - Public

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık UniFinder uygulaması:
-- ✅ Push notifications gönderebilir
-- ✅ Konum bazlı filtreleme yapabilir
-- ✅ Öğrenci rozeti sistemi çalışır
-- =====================================================
