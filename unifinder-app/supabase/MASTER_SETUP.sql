-- =====================================================
-- UniFinder - MASTER SETUP SQL
-- Tüm tabloları ve özellikleri tek seferde kurar
-- Supabase Dashboard > SQL Editor'da çalıştırın
-- Tarih: 1 Ocak 2026
-- =====================================================

-- =====================================================
-- BÖLÜM 1: PROFILES TABLOSU GÜNCELLEMELERİ
-- =====================================================

-- Konum kolonları
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ;

-- Öğrenci rozeti kolonları
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified_student BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS university_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badge_type TEXT;

-- Gamification kolonları
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Boost kolonları
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ;

-- Doğrulama kolonları
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_photo_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spotify_connected BOOLEAN DEFAULT FALSE;

-- Profil detay kolonları
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zodiac_sign TEXT CHECK (zodiac_sign IN (
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height INTEGER CHECK (height >= 100 AND height <= 250);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS smoking_preference TEXT CHECK (smoking_preference IN ('yes', 'no', 'sometimes', 'quitting'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS drinking_preference TEXT CHECK (drinking_preference IN ('yes', 'no', 'socially', 'rarely'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS relationship_goal TEXT CHECK (relationship_goal IN ('serious', 'casual', 'friendship', 'not_sure'));

-- =====================================================
-- BÖLÜM 2: PUSH NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_tokens_select" ON push_tokens;
DROP POLICY IF EXISTS "push_tokens_insert" ON push_tokens;
DROP POLICY IF EXISTS "push_tokens_update" ON push_tokens;
DROP POLICY IF EXISTS "push_tokens_delete" ON push_tokens;
CREATE POLICY "push_tokens_select" ON push_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "push_tokens_insert" ON push_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_tokens_update" ON push_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "push_tokens_delete" ON push_tokens FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- BÖLÜM 3: HİKAYELER (STORIES)
-- =====================================================

CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

CREATE TABLE IF NOT EXISTS story_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  reactor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, reactor_id, emoji)
);

-- Stories RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stories_select" ON stories;
DROP POLICY IF EXISTS "stories_insert" ON stories;
DROP POLICY IF EXISTS "stories_update" ON stories;
DROP POLICY IF EXISTS "stories_delete" ON stories;
CREATE POLICY "stories_select" ON stories FOR SELECT USING (true);
CREATE POLICY "stories_insert" ON stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stories_update" ON stories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "stories_delete" ON stories FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "story_views_select" ON story_views;
DROP POLICY IF EXISTS "story_views_insert" ON story_views;
CREATE POLICY "story_views_select" ON story_views FOR SELECT USING (true);
CREATE POLICY "story_views_insert" ON story_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

DROP POLICY IF EXISTS "story_reactions_select" ON story_reactions;
DROP POLICY IF EXISTS "story_reactions_insert" ON story_reactions;
DROP POLICY IF EXISTS "story_reactions_delete" ON story_reactions;
CREATE POLICY "story_reactions_select" ON story_reactions FOR SELECT USING (true);
CREATE POLICY "story_reactions_insert" ON story_reactions FOR INSERT WITH CHECK (auth.uid() = reactor_id);
CREATE POLICY "story_reactions_delete" ON story_reactions FOR DELETE USING (auth.uid() = reactor_id);

-- Story view count trigger
CREATE OR REPLACE FUNCTION increment_story_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stories SET view_count = view_count + 1 WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_story_view_insert ON story_views;
CREATE TRIGGER on_story_view_insert
  AFTER INSERT ON story_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_story_view_count();

-- =====================================================
-- BÖLÜM 4: TAKİP SİSTEMİ
-- =====================================================

CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "followers_select" ON followers;
DROP POLICY IF EXISTS "followers_insert" ON followers;
DROP POLICY IF EXISTS "followers_delete" ON followers;
CREATE POLICY "followers_select" ON followers FOR SELECT USING (true);
CREATE POLICY "followers_insert" ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "followers_delete" ON followers FOR DELETE USING (auth.uid() = follower_id);

-- =====================================================
-- BÖLÜM 5: GAMIFICATION
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

-- Kullanıcı İlerleme
CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gamification RLS
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_tasks_select" ON daily_tasks;
DROP POLICY IF EXISTS "daily_tasks_insert" ON daily_tasks;
DROP POLICY IF EXISTS "daily_tasks_update" ON daily_tasks;
CREATE POLICY "daily_tasks_select" ON daily_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_tasks_insert" ON daily_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_tasks_update" ON daily_tasks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "badges_select" ON badges;
CREATE POLICY "badges_select" ON badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_badges_select" ON user_badges;
DROP POLICY IF EXISTS "user_badges_insert" ON user_badges;
CREATE POLICY "user_badges_select" ON user_badges FOR SELECT USING (true);
CREATE POLICY "user_badges_insert" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_progress_select" ON user_progress;
DROP POLICY IF EXISTS "user_progress_insert" ON user_progress;
DROP POLICY IF EXISTS "user_progress_update" ON user_progress;
CREATE POLICY "user_progress_select" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_progress_insert" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_progress_update" ON user_progress FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- BÖLÜM 6: PROFİL SORULARI (PROMPTS)
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

-- Prompts RLS
ALTER TABLE profile_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prompt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prompts_select" ON profile_prompts;
CREATE POLICY "prompts_select" ON profile_prompts FOR SELECT USING (true);

DROP POLICY IF EXISTS "answers_select" ON user_prompt_answers;
DROP POLICY IF EXISTS "answers_all" ON user_prompt_answers;
CREATE POLICY "answers_select" ON user_prompt_answers FOR SELECT USING (true);
CREATE POLICY "answers_all" ON user_prompt_answers FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "prompt_likes_select" ON prompt_likes;
DROP POLICY IF EXISTS "prompt_likes_all" ON prompt_likes;
CREATE POLICY "prompt_likes_select" ON prompt_likes FOR SELECT USING (true);
CREATE POLICY "prompt_likes_all" ON prompt_likes FOR ALL USING (auth.uid() = liker_id);

-- =====================================================
-- BÖLÜM 7: ETKİNLİKLER
-- =====================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('party', 'study', 'sports', 'social', 'cultural', 'other')),
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  max_participants INTEGER NOT NULL CHECK (max_participants > 0),
  cover_image TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
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

-- Events RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select" ON events;
DROP POLICY IF EXISTS "events_insert" ON events;
DROP POLICY IF EXISTS "events_update" ON events;
DROP POLICY IF EXISTS "events_delete" ON events;
CREATE POLICY "events_select" ON events FOR SELECT USING (is_public = true OR creator_id = auth.uid());
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "events_update" ON events FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "events_delete" ON events FOR DELETE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "event_participants_select" ON event_participants;
DROP POLICY IF EXISTS "event_participants_insert" ON event_participants;
DROP POLICY IF EXISTS "event_participants_delete" ON event_participants;
DROP POLICY IF EXISTS "event_participants_update" ON event_participants;
CREATE POLICY "event_participants_select" ON event_participants FOR SELECT USING (true);
CREATE POLICY "event_participants_insert" ON event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "event_participants_delete" ON event_participants FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "event_participants_update" ON event_participants FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- BÖLÜM 8: GRUP SOHBETLERİ
-- =====================================================

CREATE TABLE IF NOT EXISTS group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  max_members INTEGER DEFAULT 50,
  member_count INTEGER DEFAULT 1,
  last_message_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT FALSE,
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

-- Group Chats RLS
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_chats_select" ON group_chats;
DROP POLICY IF EXISTS "group_chats_insert" ON group_chats;
DROP POLICY IF EXISTS "group_chats_update" ON group_chats;
CREATE POLICY "group_chats_select" ON group_chats FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = id AND user_id = auth.uid()) OR is_public = true
);
CREATE POLICY "group_chats_insert" ON group_chats FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "group_chats_update" ON group_chats FOR UPDATE USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = id AND user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "group_members_insert" ON group_members;
DROP POLICY IF EXISTS "group_members_delete" ON group_members;
CREATE POLICY "group_members_select" ON group_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid())
);
CREATE POLICY "group_members_insert" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "group_members_delete" ON group_members FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "group_messages_select" ON group_messages;
DROP POLICY IF EXISTS "group_messages_insert" ON group_messages;
CREATE POLICY "group_messages_select" ON group_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid())
);
CREATE POLICY "group_messages_insert" ON group_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid())
);

-- =====================================================
-- BÖLÜM 9: BOOST SİSTEMİ
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
  remaining_boosts INTEGER DEFAULT 1,
  monthly_boosts INTEGER DEFAULT 1,
  last_reset_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Boosts RLS
ALTER TABLE boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_boost_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "boosts_select" ON boosts;
DROP POLICY IF EXISTS "boosts_insert" ON boosts;
DROP POLICY IF EXISTS "boosts_update" ON boosts;
CREATE POLICY "boosts_select" ON boosts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "boosts_insert" ON boosts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "boosts_update" ON boosts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "boost_inventory_select" ON user_boost_inventory;
DROP POLICY IF EXISTS "boost_inventory_all" ON user_boost_inventory;
CREATE POLICY "boost_inventory_select" ON user_boost_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "boost_inventory_all" ON user_boost_inventory FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- BÖLÜM 10: VİDEO ARAMA
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
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calls_select" ON call_sessions;
DROP POLICY IF EXISTS "calls_insert" ON call_sessions;
DROP POLICY IF EXISTS "calls_update" ON call_sessions;
CREATE POLICY "calls_select" ON call_sessions FOR SELECT USING (
  auth.uid() = caller_id OR auth.uid() = receiver_id
);
CREATE POLICY "calls_insert" ON call_sessions FOR INSERT WITH CHECK (auth.uid() = caller_id);
CREATE POLICY "calls_update" ON call_sessions FOR UPDATE USING (
  auth.uid() = caller_id OR auth.uid() = receiver_id
);

-- =====================================================
-- BÖLÜM 11: FOTOĞRAF DOĞRULAMA
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

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verification_select" ON verification_requests;
DROP POLICY IF EXISTS "verification_insert" ON verification_requests;
CREATE POLICY "verification_select" ON verification_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "verification_insert" ON verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- BÖLÜM 12: SPOTİFY ENTEGRASYONU
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

-- Spotify RLS
ALTER TABLE spotify_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_top_artists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spotify_all" ON spotify_connections;
CREATE POLICY "spotify_all" ON spotify_connections FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "artists_select" ON user_top_artists;
DROP POLICY IF EXISTS "artists_all" ON user_top_artists;
CREATE POLICY "artists_select" ON user_top_artists FOR SELECT USING (true);
CREATE POLICY "artists_all" ON user_top_artists FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- BÖLÜM 13: UNDO GEÇMİŞİ
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

ALTER TABLE undo_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "undo_all" ON undo_history;
CREATE POLICY "undo_all" ON undo_history FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- BÖLÜM 14: PROFİL ZİYARETÇİLERİ
-- =====================================================

CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, viewer_id)
);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_views_select" ON profile_views;
DROP POLICY IF EXISTS "profile_views_insert" ON profile_views;
CREATE POLICY "profile_views_select" ON profile_views FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "profile_views_insert" ON profile_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- =====================================================
-- BÖLÜM 15: PREMİUM ABONELİKLER
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'gold', 'platinum', 'diamond')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- BÖLÜM 16: ENGELLEME VE SESSTİZE ALMA
-- =====================================================

CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS muted_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  muter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  muted_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(muter_id, muted_id)
);

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE muted_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_select" ON blocked_users;
DROP POLICY IF EXISTS "blocked_all" ON blocked_users;
CREATE POLICY "blocked_select" ON blocked_users FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "blocked_all" ON blocked_users FOR ALL USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "muted_select" ON muted_users;
DROP POLICY IF EXISTS "muted_all" ON muted_users;
CREATE POLICY "muted_select" ON muted_users FOR SELECT USING (auth.uid() = muter_id);
CREATE POLICY "muted_all" ON muted_users FOR ALL USING (auth.uid() = muter_id);

-- =====================================================
-- BÖLÜM 17: İNDEKSLER
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_verified_student ON profiles(is_verified_student) WHERE is_verified_student = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_is_boosted ON profiles(is_boosted) WHERE is_boosted = TRUE;

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_is_active ON stories(is_active);

CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_creator ON events(creator_id);

CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created ON group_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, date);

-- =====================================================
-- BÖLÜM 18: FONKSİYONLAR
-- =====================================================

-- Yakındaki profilleri getir
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
  is_verified_student BOOLEAN,
  university_name TEXT,
  badge_type TEXT,
  is_boosted BOOLEAN
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
    (6371 * acos(
      cos(radians(user_lat)) * cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(p.latitude))
    )) AS distance_km,
    p.is_verified_student,
    p.university_name,
    p.badge_type,
    p.is_boosted
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
  ORDER BY 
    p.is_boosted DESC,  -- Boost'lu profiller önce
    distance_km ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- XP ekleme fonksiyonu
CREATE OR REPLACE FUNCTION add_xp(p_user_id UUID, p_amount INTEGER)
RETURNS TABLE(new_level INTEGER, level_up BOOLEAN) AS $$
DECLARE
  current_level INTEGER;
  new_total_xp INTEGER;
  did_level_up BOOLEAN := FALSE;
BEGIN
  INSERT INTO user_progress (user_id, current_xp, total_xp, level)
  VALUES (p_user_id, 0, 0, 1)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT level, total_xp INTO current_level, new_total_xp
  FROM user_progress WHERE user_id = p_user_id;
  
  new_total_xp := new_total_xp + p_amount;
  
  WHILE new_total_xp >= (current_level * 100) LOOP
    new_total_xp := new_total_xp - (current_level * 100);
    current_level := current_level + 1;
    did_level_up := TRUE;
  END LOOP;
  
  UPDATE user_progress
  SET level = current_level, current_xp = new_total_xp, total_xp = total_xp + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT current_level, did_level_up;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- BÖLÜM 19: TRİGGERLAR
-- =====================================================

-- Grup üye sayısı trigger'ı
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

DROP TRIGGER IF EXISTS group_member_count_trigger ON group_members;
CREATE TRIGGER group_member_count_trigger
AFTER INSERT OR DELETE ON group_members
FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Prompt like trigger'ı
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

DROP TRIGGER IF EXISTS prompt_likes_count_trigger ON prompt_likes;
CREATE TRIGGER prompt_likes_count_trigger
AFTER INSERT OR DELETE ON prompt_likes
FOR EACH ROW EXECUTE FUNCTION update_prompt_likes_count();

-- =====================================================
-- BÖLÜM 20: SEED DATA
-- =====================================================

-- Rozetler
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

-- Profil Soruları
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
-- BİLDİRİMLER TABLOSU (NOTIFICATIONS)
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match', 'message', 'like', 'superlike', 'like_request', 'system')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_delete" ON notifications;

-- Kullanıcılar kendi bildirimlerini görebilir
CREATE POLICY "notifications_select" ON notifications 
  FOR SELECT USING (auth.uid() = user_id);

-- Herkes bildirim oluşturabilir (swipe/match işlemleri için)
CREATE POLICY "notifications_insert" ON notifications 
  FOR INSERT WITH CHECK (true);

-- Kullanıcılar kendi bildirimlerini güncelleyebilir (okundu işaretleme)
CREATE POLICY "notifications_update" ON notifications 
  FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcılar kendi bildirimlerini silebilir
CREATE POLICY "notifications_delete" ON notifications 
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- KURULUM TAMAMLANDI ✅
-- =====================================================
-- 
-- Şimdi Supabase Dashboard > Storage'dan şu bucket'ları oluşturun:
-- 1. photos (Public)
-- 2. avatars (Public)
-- 3. stories (Public)
--
-- =====================================================
