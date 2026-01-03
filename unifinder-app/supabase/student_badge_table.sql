-- Student Badge System
-- Öğrenci rozeti sistemi

-- Profiles tablosuna is_verified_student kolonu ekle
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_verified_student BOOLEAN DEFAULT FALSE;

-- Üniversite bilgisi (email domain'den tespit edilen)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS university_name TEXT;

-- Badge tipi: 'verified_student', 'international_student', null
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS badge_type TEXT;

-- Yorum ekle
COMMENT ON COLUMN profiles.is_verified_student IS 'True if user registered with .edu.tr email';
COMMENT ON COLUMN profiles.university_name IS 'University name extracted from email domain';
COMMENT ON COLUMN profiles.badge_type IS 'Badge type: verified_student, international_student, or null';

-- Index oluştur (rozet filtreleme için)
CREATE INDEX IF NOT EXISTS idx_profiles_verified_student 
ON profiles(is_verified_student) 
WHERE is_verified_student = TRUE;

-- Mevcut kullanıcıları güncelle (email'e göre)
-- Bu bir kerelik çalıştırılacak
UPDATE profiles
SET 
  is_verified_student = TRUE,
  badge_type = 'verified_student'
WHERE email LIKE '%.edu.tr';

UPDATE profiles
SET 
  badge_type = 'international_student'
WHERE email LIKE '%.edu' 
  AND email NOT LIKE '%.edu.tr'
  AND badge_type IS NULL;
