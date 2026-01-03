-- UniFinder Mega Features - Veritabanı Migration
-- Tarih: 28 Aralık 2025

-- =====================================================
-- 1. GAMIFICATION TABLOLARI
-- =====================================================

-- Günlük Görevler
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('swipe_count', 'message_sent', 'profile_view', 'story_post', 'like_received')),
  target INTEGER NOT NULL,
  current INTEGER DEFAULT 0,
  xp_reward INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, task_type, date)
);

-- Rozet Tanımları
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  name_tr TEXT NOT NULL,
  description TEXT,
  description_tr TEXT,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('social', 'activity', 'achievement', 'special')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kullanıcı Rozetleri
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Kullanıcı İlerleme (XP, Seviye)
CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================
-- 2. PROFIL SORULARI (PROMPTS)
-- =====================================================

CREATE TABLE IF NOT EXISTS profile_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  question_tr TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('personality', 'lifestyle', 'fun', 'dating')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_prompt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES profile_prompts(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

CREATE TABLE IF NOT EXISTS prompt_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES user_prompt_answers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(liker_id, answer_id)
);

-- =====================================================
-- 3. ETKİNLİK SİSTEMİ
-- =====================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('party', 'study', 'sports', 'social', 'cultural', 'other')),
  event_date TIMESTAMPTZ NOT NULL,
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  participant_count INTEGER DEFAULT 0,
  image_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  is_cancelled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'interested', 'waitlist')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- =====================================================
-- 4. GRUP SOHBETLERİ
-- =====================================================

CREATE TABLE IF NOT EXISTS group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  max_members INTEGER DEFAULT 50,
  member_count INTEGER DEFAULT 1,
  last_message_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES group_chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'gif', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================
-- 5. BOOST SİSTEMİ
-- =====================================================

CREATE TABLE IF NOT EXISTS boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS user_boost_inventory (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  remaining_boosts INTEGER DEFAULT 0,
  monthly_boosts INTEGER DEFAULT 1,
  last_reset_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. VİDEO ARAMA
-- =====================================================

CREATE TABLE IF NOT EXISTS call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('video', 'audio')),
  status TEXT NOT NULL CHECK (status IN ('ringing', 'connected', 'ended', 'missed', 'rejected')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration INTEGER, -- saniye
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. FOTOĞRAF DOĞRULAMA
-- =====================================================

CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  selfie_url TEXT NOT NULL,
  pose_type TEXT NOT NULL CHECK (pose_type IN ('smile', 'thumbs_up', 'peace_sign', 'wave')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- =====================================================
-- 8. SPOTİFY ENTEGRASYONU
-- =====================================================

CREATE TABLE IF NOT EXISTS spotify_connections (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  spotify_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  display_name TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_top_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  artist_id TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  image_url TEXT,
  genres TEXT[],
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 10),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, artist_id)
);

-- =====================================================
-- 9. UNDO GEÇMİŞİ
-- =====================================================

CREATE TABLE IF NOT EXISTS undo_history (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  last_swiped_profile_id UUID REFERENCES profiles(id),
  last_swipe_action TEXT,
  last_swipe_at TIMESTAMPTZ,
  undo_count_today INTEGER DEFAULT 0,
  last_undo_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================
-- 10. PROFİL TABLOSU GÜNCELLEMELERİ
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zodiac_sign TEXT CHECK (zodiac_sign IN (
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height INTEGER CHECK (height >= 100 AND height <= 250);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS smoking_preference TEXT CHECK (smoking_preference IN ('yes', 'no', 'sometimes', 'quitting'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS drinking_preference TEXT CHECK (drinking_preference IN ('yes', 'no', 'socially', 'rarely'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS relationship_goal TEXT CHECK (relationship_goal IN ('serious', 'casual', 'friendship', 'not_sure'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_photo_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spotify_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ;

-- =====================================================
-- 11. SEED DATA - ROZETLER
-- =====================================================

INSERT INTO badges (name, name_tr, description, description_tr, icon, category, requirement_type, requirement_value, rarity) VALUES
  ('first_match', 'İlk Eşleşme', 'Get your first match', 'İlk eşleşmeni yap', '💕', 'social', 'match_count', 1, 'common'),
  ('social_butterfly', 'Sosyal Kelebek', 'Get 10 matches', '10 eşleşme yap', '🦋', 'social', 'match_count', 10, 'rare'),
  ('popular', 'Popüler', 'Get 50 matches', '50 eşleşme yap', '⭐', 'social', 'match_count', 50, 'epic'),
  ('superstar', 'Süperstar', 'Get 100 matches', '100 eşleşme yap', '🌟', 'social', 'match_count', 100, 'legendary'),
  ('first_message', 'İlk Mesaj', 'Send your first message', 'İlk mesajını gönder', '💬', 'activity', 'message_count', 1, 'common'),
  ('chatterbox', 'Geveze', 'Send 100 messages', '100 mesaj gönder', '🗣️', 'activity', 'message_count', 100, 'rare'),
  ('storyteller', 'Hikayeci', 'Post 10 stories', '10 hikaye paylaş', '📸', 'activity', 'story_count', 10, 'rare'),
  ('verified_student', 'Doğrulanmış Öğrenci', 'Verify your student email', 'Öğrenci e-postanı doğrula', '🎓', 'achievement', 'email_verified', 1, 'common'),
  ('photo_verified', 'Fotoğraf Doğrulanmış', 'Verify your photos', 'Fotoğraflarını doğrula', '✅', 'achievement', 'photo_verified', 1, 'rare'),
  ('early_bird', 'Erken Kuş', 'Join in the first month', 'İlk ayda katıl', '🐦', 'special', 'early_adopter', 1, 'epic'),
  ('streak_master', 'Seri Ustası', '7 day login streak', '7 gün üst üste giriş yap', '🔥', 'activity', 'streak_days', 7, 'rare'),
  ('event_organizer', 'Etkinlik Organizatörü', 'Create 5 events', '5 etkinlik oluştur', '🎉', 'social', 'event_created', 5, 'epic')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 12. SEED DATA - PROFİL SORULARI
-- =====================================================

INSERT INTO profile_prompts (question, question_tr, category) VALUES
  ('My ideal first date would be...', 'İdeal ilk buluşmam...', 'dating'),
  ('The way to my heart is...', 'Kalbime giden yol...', 'dating'),
  ('I''m looking for someone who...', 'Aradığım kişi...', 'dating'),
  ('My love language is...', 'Aşk dilim...', 'dating'),
  ('A life goal of mine is...', 'Hayat hedeflerimden biri...', 'lifestyle'),
  ('My most spontaneous moment was...', 'En spontan anım...', 'lifestyle'),
  ('I''m convinced that...', 'Şuna eminim ki...', 'personality'),
  ('The key to my heart is...', 'Kalbimin anahtarı...', 'personality'),
  ('I geek out on...', 'Çok ilgilendiğim konu...', 'fun'),
  ('My simple pleasures are...', 'Basit zevklerim...', 'fun'),
  ('Two truths and a lie...', 'İki doğru bir yalan...', 'fun'),
  ('My most irrational fear is...', 'En mantıksız korkum...', 'fun'),
  ('The best travel story I have is...', 'En iyi seyahat hikayem...', 'lifestyle'),
  ('My favorite Netflix show is...', 'En sevdiğim Netflix dizisi...', 'fun'),
  ('I''m weirdly attracted to...', 'Garip bir şekilde hoşuma giden...', 'personality'),
  ('My comfort food is...', 'Rahatlatıcı yemeğim...', 'lifestyle'),
  ('On weekends you''ll find me...', 'Hafta sonları beni bulacağın yer...', 'lifestyle'),
  ('My hidden talent is...', 'Gizli yeteneğim...', 'fun'),
  ('The one thing I''d love to know about you is...', 'Senin hakkında bilmek istediğim tek şey...', 'dating'),
  ('Together we could...', 'Birlikte yapabileceğimiz şey...', 'dating')
ON CONFLICT DO NOTHING;


-- =====================================================
-- 13. RLS POLİTİKALARI
-- =====================================================

-- Daily Tasks
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tasks" ON daily_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON daily_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON daily_tasks FOR UPDATE USING (auth.uid() = user_id);

-- Badges (herkes görebilir)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);

-- User Badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view user badges" ON user_badges FOR SELECT USING (true);
CREATE POLICY "System can insert badges" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profile Prompts (herkes görebilir)
ALTER TABLE profile_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view prompts" ON profile_prompts FOR SELECT USING (true);

-- User Prompt Answers
ALTER TABLE user_prompt_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view answers" ON user_prompt_answers FOR SELECT USING (true);
CREATE POLICY "Users can manage own answers" ON user_prompt_answers FOR ALL USING (auth.uid() = user_id);

-- Prompt Likes
ALTER TABLE prompt_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view likes" ON prompt_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes" ON prompt_likes FOR ALL USING (auth.uid() = liker_id);

-- Events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public events" ON events FOR SELECT USING (is_public = true OR creator_id = auth.uid());
CREATE POLICY "Users can create events" ON events FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update events" ON events FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete events" ON events FOR DELETE USING (auth.uid() = creator_id);

-- Event Participants
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view participants" ON event_participants FOR SELECT USING (true);
CREATE POLICY "Users can join events" ON event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave events" ON event_participants FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON event_participants FOR UPDATE USING (auth.uid() = user_id);

-- Group Chats
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view groups" ON group_chats FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = id AND user_id = auth.uid())
);
CREATE POLICY "Users can create groups" ON group_chats FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Admins can update groups" ON group_chats FOR UPDATE USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = id AND user_id = auth.uid() AND role = 'admin')
);

-- Group Members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view group members" ON group_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid())
);
CREATE POLICY "Users can join groups" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON group_members FOR DELETE USING (auth.uid() = user_id);

-- Group Messages
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view messages" ON group_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid())
);
CREATE POLICY "Members can send messages" ON group_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid())
);

-- Boosts
ALTER TABLE boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own boosts" ON boosts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create boosts" ON boosts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own boosts" ON boosts FOR UPDATE USING (auth.uid() = user_id);

-- User Boost Inventory
ALTER TABLE user_boost_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own inventory" ON user_boost_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own inventory" ON user_boost_inventory FOR ALL USING (auth.uid() = user_id);

-- Call Sessions
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view calls" ON call_sessions FOR SELECT USING (
  auth.uid() = caller_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can create calls" ON call_sessions FOR INSERT WITH CHECK (auth.uid() = caller_id);
CREATE POLICY "Participants can update calls" ON call_sessions FOR UPDATE USING (
  auth.uid() = caller_id OR auth.uid() = receiver_id
);

-- Verification Requests
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own requests" ON verification_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create requests" ON verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Spotify Connections
ALTER TABLE spotify_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own spotify" ON spotify_connections FOR ALL USING (auth.uid() = user_id);

-- User Top Artists
ALTER TABLE user_top_artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view artists" ON user_top_artists FOR SELECT USING (true);
CREATE POLICY "Users can manage own artists" ON user_top_artists FOR ALL USING (auth.uid() = user_id);

-- Undo History
ALTER TABLE undo_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own undo" ON undo_history FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 14. FONKSİYONLAR
-- =====================================================

-- Günlük görev oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION generate_daily_tasks(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  task_types TEXT[] := ARRAY['swipe_count', 'message_sent', 'profile_view', 'story_post'];
  task_type TEXT;
  task_count INTEGER;
BEGIN
  -- Bugünkü görevleri sil
  DELETE FROM daily_tasks WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  -- 3-5 arası rastgele görev sayısı
  task_count := 3 + floor(random() * 3)::INTEGER;
  
  -- Görevleri oluştur
  FOR i IN 1..task_count LOOP
    task_type := task_types[1 + floor(random() * array_length(task_types, 1))::INTEGER];
    
    INSERT INTO daily_tasks (user_id, task_type, target, xp_reward, date)
    VALUES (
      p_user_id,
      task_type,
      CASE task_type
        WHEN 'swipe_count' THEN 5 + floor(random() * 10)::INTEGER
        WHEN 'message_sent' THEN 3 + floor(random() * 5)::INTEGER
        WHEN 'profile_view' THEN 3 + floor(random() * 5)::INTEGER
        WHEN 'story_post' THEN 1
        ELSE 5
      END,
      CASE task_type
        WHEN 'swipe_count' THEN 10
        WHEN 'message_sent' THEN 15
        WHEN 'profile_view' THEN 10
        WHEN 'story_post' THEN 20
        ELSE 10
      END,
      CURRENT_DATE
    )
    ON CONFLICT (user_id, task_type, date) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- XP ekleme ve seviye kontrolü
CREATE OR REPLACE FUNCTION add_xp(p_user_id UUID, p_amount INTEGER)
RETURNS TABLE(new_level INTEGER, level_up BOOLEAN) AS $$
DECLARE
  current_level INTEGER;
  new_total_xp INTEGER;
  xp_for_next_level INTEGER;
  did_level_up BOOLEAN := FALSE;
BEGIN
  -- Mevcut ilerlemeyi al veya oluştur
  INSERT INTO user_progress (user_id, current_xp, total_xp, level)
  VALUES (p_user_id, 0, 0, 1)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT level, total_xp INTO current_level, new_total_xp
  FROM user_progress WHERE user_id = p_user_id;
  
  new_total_xp := new_total_xp + p_amount;
  
  -- Seviye hesapla (her seviye için 100 * seviye XP gerekli)
  WHILE new_total_xp >= (current_level * 100) LOOP
    new_total_xp := new_total_xp - (current_level * 100);
    current_level := current_level + 1;
    did_level_up := TRUE;
  END LOOP;
  
  -- Güncelle
  UPDATE user_progress
  SET level = current_level, current_xp = new_total_xp, total_xp = total_xp + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT current_level, did_level_up;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Etkinlik katılımcı sayısı güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events SET participant_count = participant_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events SET participant_count = participant_count - 1 WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_participant_count_trigger
AFTER INSERT OR DELETE ON event_participants
FOR EACH ROW EXECUTE FUNCTION update_event_participant_count();

-- Grup üye sayısı güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE group_chats SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE group_chats SET member_count = member_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER group_member_count_trigger
AFTER INSERT OR DELETE ON group_members
FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Prompt like sayısı güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_prompt_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_prompt_answers SET likes_count = likes_count + 1 WHERE id = NEW.answer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_prompt_answers SET likes_count = likes_count - 1 WHERE id = OLD.answer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prompt_likes_count_trigger
AFTER INSERT OR DELETE ON prompt_likes
FOR EACH ROW EXECUTE FUNCTION update_prompt_likes_count();

-- =====================================================
-- MIGRATION TAMAMLANDI
-- =====================================================
