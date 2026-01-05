-- Grup Silme ve Üyelik İşlemleri için RLS Düzeltmeleri
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- =====================================================
-- 1. GROUP_MEMBERS tablosu için DELETE politikası
-- =====================================================

-- Mevcut politikaları kontrol et
SELECT * FROM pg_policies WHERE tablename = 'group_members';

-- Üyeler kendi üyeliklerini silebilsin (gruptan ayrılma)
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
CREATE POLICY "Users can leave groups"
ON group_members
FOR DELETE
USING (user_id = auth.uid());

-- Adminler üyeleri çıkarabilsin
DROP POLICY IF EXISTS "Admins can remove members" ON group_members;
CREATE POLICY "Admins can remove members"
ON group_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'admin'
  )
);

-- =====================================================
-- 2. GROUP_MESSAGES tablosu için DELETE politikası
-- =====================================================

DROP POLICY IF EXISTS "Admins can delete group messages" ON group_messages;
CREATE POLICY "Admins can delete group messages"
ON group_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_messages.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'admin'
  )
);

-- =====================================================
-- 3. GROUP_CHATS tablosu için DELETE politikası
-- =====================================================

DROP POLICY IF EXISTS "Admins can delete groups" ON group_chats;
CREATE POLICY "Admins can delete groups"
ON group_chats
FOR DELETE
USING (
  creator_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_chats.id
    AND gm.user_id = auth.uid()
    AND gm.role = 'admin'
  )
);

-- =====================================================
-- 4. GROUP_CHATS tablosu için UPDATE politikası (member_count güncelleme)
-- =====================================================

DROP POLICY IF EXISTS "Members can update group info" ON group_chats;
CREATE POLICY "Members can update group info"
ON group_chats
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_chats.id
    AND gm.user_id = auth.uid()
  )
);

-- =====================================================
-- 5. Kontrol: Politikaları listele
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('group_chats', 'group_members', 'group_messages')
ORDER BY tablename, policyname;
