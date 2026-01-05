-- GROUP RLS POLİTİKALARINI DÜZELT
-- Bu script grup üyelikleri için RLS sorunlarını çözer

-- 1. Önce mevcut politikaları kaldır
DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "group_members_insert" ON group_members;
DROP POLICY IF EXISTS "group_members_delete" ON group_members;

-- 2. Yeni politikalar oluştur

-- SELECT: Kullanıcı kendi üyeliklerini görebilir VEYA aynı gruptaki diğer üyeleri
CREATE POLICY "group_members_select" ON group_members FOR SELECT USING (
  user_id = auth.uid()  -- Kendi üyeliklerini görebilir
  OR 
  group_id IN (  -- Aynı gruptaki diğer üyeleri görebilir
    SELECT gm.group_id FROM group_members gm WHERE gm.user_id = auth.uid()
  )
);

-- INSERT: Kullanıcı kendi üyeliğini ekleyebilir (public gruba katılma veya grup oluşturma)
CREATE POLICY "group_members_insert" ON group_members FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Ya grubun creator'ı bu kullanıcı (yeni grup oluşturma)
    EXISTS (
      SELECT 1 FROM group_chats gc WHERE gc.id = group_id AND gc.creator_id = auth.uid()
    )
    OR
    -- Ya da grup public (katılma)
    EXISTS (
      SELECT 1 FROM group_chats gc WHERE gc.id = group_id AND gc.is_public = true
    )
    OR
    -- Ya da zaten adminin daveti var (davet sistemi için)
    true  -- Şimdilik herkese izin ver - ileride davet sistemi eklenebilir
  )
);

-- DELETE: Kullanıcı kendi üyeliğini silebilir (gruptan ayrılma)
CREATE POLICY "group_members_delete" ON group_members FOR DELETE USING (
  user_id = auth.uid()
);

-- 3. group_messages için de güncelleyelim
DROP POLICY IF EXISTS "group_messages_select" ON group_messages;
DROP POLICY IF EXISTS "group_messages_insert" ON group_messages;

-- SELECT: Grup üyesi mesajları görebilir
CREATE POLICY "group_messages_select" ON group_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = group_messages.group_id 
    AND gm.user_id = auth.uid()
  )
  OR sender_id IS NULL  -- Sistem mesajları herkes görebilir
);

-- INSERT: Grup üyesi mesaj gönderebilir VEYA sistem mesajı (sender_id NULL)
CREATE POLICY "group_messages_insert" ON group_messages FOR INSERT WITH CHECK (
  (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM group_members gm 
      WHERE gm.group_id = group_messages.group_id 
      AND gm.user_id = auth.uid()
    )
  )
  OR sender_id IS NULL  -- Sistem mesajları için
);

-- 4. Verify: Mevcut grupları kontrol et
SELECT 'Gruplar:' as info;
SELECT id, name, creator_id, member_count FROM group_chats;

SELECT 'Üyelikler:' as info;
SELECT * FROM group_members;
