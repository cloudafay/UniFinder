-- Fix Notifications RLS Policy and Undo History Table
-- Run this SQL in Supabase SQL Editor to fix policy errors

-- ==============================================
-- 1. FIX NOTIFICATIONS RLS POLICY
-- ==============================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;

-- Create new permissive INSERT policy
-- Allows users to send notifications to others
CREATE POLICY "Users can create notifications for others"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (
  -- Kullanıcı kendi notification'larını oluşturabilir VEYA
  -- Başka kullanıcılara notification gönderebilir (match, like, etc.)
  auth.uid() = sender_id
);

-- Also allow reading own notifications
CREATE POLICY "Users can read their own notifications" 
ON notifications 
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = sender_id);

-- Allow updating own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ==============================================
-- 2. CREATE UNDO_HISTORY TABLE (IF NOT EXISTS)
-- ==============================================

CREATE TABLE IF NOT EXISTS undo_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  swiped_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('like', 'nope', 'superlike')),
  profile_data JSONB, -- Snapshot of profile at swipe time
  created_at TIMESTAMPTZ DEFAULT NOW(),
  can_undo BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 seconds')
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_undo_history_user_id ON undo_history(user_id);
CREATE INDEX IF NOT EXISTS idx_undo_history_expires ON undo_history(expires_at);

-- Enable RLS
ALTER TABLE undo_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for undo_history
CREATE POLICY "Users can manage own undo history"
ON undo_history
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to auto-delete expired undo records (optional, can be run as cron)
CREATE OR REPLACE FUNCTION delete_expired_undo_history()
RETURNS void AS $$
BEGIN
  DELETE FROM undo_history
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 3. VERIFICATION QUERIES
-- ==============================================

-- Check notifications RLS policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'notifications';

-- Check undo_history table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'undo_history'
);

-- Check undo_history RLS policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'undo_history';
