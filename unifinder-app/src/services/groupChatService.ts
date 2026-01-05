// Group Chat Service
// Grup sohbet işlemleri

import { supabase } from '../lib/supabase';
import { Profile } from '../lib/database.types';
import { RealtimeChannel } from '@supabase/supabase-js';

// Tipler
export interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  creator_id: string | null;
  max_members: number;
  member_count: number;
  last_message_at: string | null;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  creator?: Profile;
  lastMessage?: GroupMessage;
  // Alias for screen compatibility
  image_url?: string | null;  // Alias for avatar_url
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  profile?: Profile;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string | null;
  content: string;
  message_type: 'text' | 'image' | 'gif' | 'system';
  created_at: string;
  sender?: Profile;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  image_url?: string;
  max_members?: number;
  is_public?: boolean;
}

const MAX_GROUP_MEMBERS = 50;

export const groupChatService = {
  // Grup oluştur
  createGroup: async (creatorId: string, data: CreateGroupData): Promise<{ data: GroupChat | null; error: any }> => {
    console.log('🔵 createGroup başladı - creatorId:', creatorId);
    
    // Grubu oluştur
    const { data: group, error: groupError } = await supabase
      .from('group_chats')
      .insert({
        name: data.name,
        description: data.description || null,
        avatar_url: data.image_url || null,
        creator_id: creatorId,
        max_members: data.max_members || MAX_GROUP_MEMBERS,
        member_count: 1,
        is_public: data.is_public ?? false,
      })
      .select()
      .single();

    console.log('🔵 group_chats insert sonucu:', { group, groupError });

    if (groupError || !group) {
      console.error('❌ Grup oluşturma hatası:', groupError);
      return { data: null, error: groupError };
    }

    // Oluşturanı admin olarak ekle
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: creatorId,
        role: 'admin',
      });

    console.log('🔵 group_members insert sonucu:', { memberError });
    
    if (memberError) {
      console.error('❌ Üyelik ekleme hatası:', memberError);
      // Üyelik eklenemezse grubu sil
      await supabase.from('group_chats').delete().eq('id', group.id);
      return { data: null, error: memberError };
    }

    // Sistem mesajı gönder - sender_id olarak creator kullan (RLS için gerekli)
    const { error: msgError } = await supabase
      .from('group_messages')
      .insert({
        group_id: group.id,
        sender_id: creatorId, // NULL yerine creator ID kullan - RLS politikası için
        content: 'Grup oluşturuldu',
        message_type: 'system',
      });

    console.log('🔵 group_messages insert sonucu:', { msgError });
    if (msgError) {
      console.warn('⚠️ Sistem mesajı eklenemedi (kritik değil):', msgError);
    }

    console.log('✅ Grup başarıyla oluşturuldu:', group.id);
    return { data: group, error: null };
  },

  // Kullanıcının gruplarını getir
  getMyGroups: async (userId: string): Promise<{ data: GroupChat[] | null; error: any }> => {
    console.log('🔵 getMyGroups çağrıldı - userId:', userId);
    
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        group:group_chats(
          *,
          creator:profiles!group_chats_creator_id_fkey(id, full_name, avatar_url)
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    console.log('🔵 getMyGroups sonucu:', { data, error });
    
    let groups = data?.map(d => (d as any).group).filter(Boolean) as GroupChat[];
    
    // Geçersiz avatar URL'lerini temizle (blob:, file:// gibi geçici URL'ler)
    if (groups) {
      groups = groups.map(group => {
        if (group.avatar_url && !group.avatar_url.startsWith('http://') && !group.avatar_url.startsWith('https://')) {
          console.log('🔵 Geçersiz avatar_url temizlendi:', group.avatar_url);
          return { ...group, avatar_url: null };
        }
        return group;
      });
    }
    
    console.log('🔵 Filtrelenmiş gruplar:', groups?.length || 0);
    
    return { data: groups || null, error };
  },

  // Grup detayı getir
  getGroupById: async (groupId: string): Promise<{ data: GroupChat | null; error: any }> => {
    const { data, error } = await supabase
      .from('group_chats')
      .select(`
        *,
        creator:profiles!group_chats_creator_id_fkey(id, full_name, avatar_url)
      `)
      .eq('id', groupId)
      .single();

    return { data, error };
  },

  // Grup mesajlarını getir
  getMessages: async (groupId: string, limit: number = 50, offset: number = 0): Promise<{ data: GroupMessage[] | null; error: any }> => {
    const { data, error } = await supabase
      .from('group_messages')
      .select(`
        *,
        sender:profiles(id, full_name, avatar_url)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data: data?.reverse() || null, error };
  },

  // Mesaj gönder
  sendMessage: async (
    groupId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'image' | 'gif' = 'text'
  ): Promise<{ data: GroupMessage | null; error: any }> => {
    const { data, error } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        sender_id: senderId,
        content,
        message_type: messageType,
      })
      .select(`
        *,
        sender:profiles(id, full_name, avatar_url)
      `)
      .single();

    // Son mesaj zamanını güncelle
    if (!error) {
      await supabase
        .from('group_chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', groupId);
    }

    return { data, error };
  },

  // Üyeleri getir
  getMembers: async (groupId: string): Promise<{ data: GroupMember[] | null; error: any }> => {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        profile:profiles(id, full_name, avatar_url, department, is_active)
      `)
      .eq('group_id', groupId)
      .order('role', { ascending: true })
      .order('joined_at', { ascending: true });

    return { data, error };
  },

  // Üye ekle
  addMember: async (groupId: string, userId: string, addedBy: string): Promise<{ error: any }> => {
    // Kapasite kontrolü
    const { data: group } = await supabase
      .from('group_chats')
      .select('member_count, max_members')
      .eq('id', groupId)
      .single();

    if (group && group.member_count >= group.max_members) {
      return { error: { message: 'Grup kapasitesi dolu' } };
    }

    // Üye ekle
    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role: 'member',
      });

    if (!error) {
      // Sistem mesajı
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: null,
          content: `${profile?.full_name || 'Biri'} gruba katıldı`,
          message_type: 'system',
        });
    }

    return { error };
  },

  // Üye çıkar (admin)
  removeMember: async (groupId: string, userId: string, removedBy: string): Promise<{ error: any }> => {
    // Admin kontrolü
    const { data: remover } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', removedBy)
      .single();

    if (!remover || remover.role !== 'admin') {
      return { error: { message: 'Bu işlem için admin yetkisi gerekli' } };
    }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (!error) {
      // Sistem mesajı
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: null,
          content: `${profile?.full_name || 'Biri'} gruptan çıkarıldı`,
          message_type: 'system',
        });
    }

    return { error };
  },

  // Gruptan ayrıl
  leaveGroup: async (groupId: string, userId: string): Promise<{ error: any }> => {
    // Admin kontrolü - son admin ayrılamaz
    const { data: member } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (member?.role === 'admin') {
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('role', 'admin');

      if (count === 1) {
        return { error: { message: 'Son admin gruptan ayrılamaz. Önce başka birini admin yapın.' } };
      }
    }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (!error) {
      // Sistem mesajı
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: null,
          content: `${profile?.full_name || 'Biri'} gruptan ayrıldı`,
          message_type: 'system',
        });
    }

    return { error };
  },

  // Üye rolünü değiştir
  updateMemberRole: async (groupId: string, userId: string, newRole: 'admin' | 'moderator' | 'member', updatedBy: string): Promise<{ error: any }> => {
    // Admin kontrolü
    const { data: updater } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', updatedBy)
      .single();

    if (!updater || updater.role !== 'admin') {
      return { error: { message: 'Bu işlem için admin yetkisi gerekli' } };
    }

    const { error } = await supabase
      .from('group_members')
      .update({ role: newRole })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    return { error };
  },

  // Grubu güncelle
  updateGroup: async (groupId: string, userId: string, updates: Partial<CreateGroupData>): Promise<{ error: any }> => {
    // Admin kontrolü
    const { data: member } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (!member || member.role !== 'admin') {
      return { error: { message: 'Bu işlem için admin yetkisi gerekli' } };
    }

    const { error } = await supabase
      .from('group_chats')
      .update(updates)
      .eq('id', groupId);

    return { error };
  },

  // Grubu sil
  deleteGroup: async (groupId: string, userId: string): Promise<{ error: any }> => {
    // Admin kontrolü
    const { data: member } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (!member || member.role !== 'admin') {
      return { error: { message: 'Bu işlem için admin yetkisi gerekli' } };
    }

    const { error } = await supabase
      .from('group_chats')
      .delete()
      .eq('id', groupId);

    return { error };
  },

  // Üyelik kontrolü
  isMember: async (groupId: string, userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    return !error && !!data;
  },

  // Realtime mesaj dinleme
  subscribeToMessages: (groupId: string, callback: (message: GroupMessage) => void): RealtimeChannel => {
    const channel = supabase
      .channel(`group_messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          // Sender bilgisini çek
          const message = payload.new as GroupMessage;
          if (message.sender_id) {
            const { data: sender } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', message.sender_id)
              .single();
            message.sender = sender as any || undefined;
          }
          callback(message);
        }
      )
      .subscribe();

    return channel;
  },

  // Subscription'ı kapat
  unsubscribe: async (channel: RealtimeChannel) => {
    await supabase.removeChannel(channel);
  },

  // Grup fotoğrafını storage'a yükle
  uploadGroupImage: async (groupId: string, imageUri: string): Promise<{ url: string | null; error: any }> => {
    try {
      console.log('🔵 uploadGroupImage başladı - groupId:', groupId);
      
      const fileName = `group_${groupId}_${Date.now()}.jpg`;
      
      // URI'den blob'a çevir (web ve mobile için)
      let imageBlob: Blob;
      if (imageUri.startsWith('data:')) {
        // Base64 data URL
        const response = await fetch(imageUri);
        imageBlob = await response.blob();
      } else {
        // File veya blob URL
        const response = await fetch(imageUri);
        imageBlob = await response.blob();
      }

      const { error: uploadError } = await supabase.storage
        .from('groups')
        .upload(fileName, imageBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('❌ Grup fotoğrafı yükleme hatası:', uploadError);
        return { url: null, error: uploadError };
      }

      const { data: publicUrlData } = supabase.storage
        .from('groups')
        .getPublicUrl(fileName);

      console.log('✅ Grup fotoğrafı yüklendi:', publicUrlData.publicUrl);
      return { url: publicUrlData.publicUrl, error: null };
    } catch (error) {
      console.error('❌ uploadGroupImage catch error:', error);
      return { url: null, error };
    }
  },

  // Grup avatar_url güncelle
  updateGroupAvatar: async (groupId: string, avatarUrl: string): Promise<{ error: any }> => {
    const { error } = await supabase
      .from('group_chats')
      .update({ avatar_url: avatarUrl })
      .eq('id', groupId);
    
    return { error };
  },
};

export default groupChatService;
