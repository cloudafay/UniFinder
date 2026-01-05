-- HIZLI FIX: Group Members RLS Politikasını Basitleştir
-- Supabase Dashboard > SQL Editor'de çalıştırın

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "group_members_insert" ON group_members;
DROP POLICY IF EXISTS "group_members_delete" ON group_members;

-- Basit ve çalışan politikalar
-- SELECT: Herkes görebilir (daha sonra sıkılaştırılabilir)
CREATE POLICY "group_members_select" ON group_members 
FOR SELECT USING (true);

-- INSERT: Sadece kendi user_id'si ile kayıt ekleyebilir
CREATE POLICY "group_members_insert" ON group_members 
FOR INSERT WITH CHECK (user_id = auth.uid());

-- DELETE: Sadece kendi kaydını silebilir
CREATE POLICY "group_members_delete" ON group_members 
FOR DELETE USING (user_id = auth.uid());

-- group_messages için de düzelt
DROP POLICY IF EXISTS "group_messages_select" ON group_messages;
DROP POLICY IF EXISTS "group_messages_insert" ON group_messages;

CREATE POLICY "group_messages_select" ON group_messages 
FOR SELECT USING (true);

CREATE POLICY "group_messages_insert" ON group_messages 
FOR INSERT WITH CHECK (sender_id = auth.uid() OR sender_id IS NULL);
