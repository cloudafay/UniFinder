-- =====================================================
-- BİLDİRİMLER TABLOSU (NOTIFICATIONS)
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştırın
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

-- Test: Tablo oluşturuldu mu kontrol et
SELECT 'notifications tablosu başarıyla oluşturuldu!' as status;
