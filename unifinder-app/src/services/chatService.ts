// Chat Service
// Mesajlaşma işlemleri

import { supabase } from '../lib/supabase';
import { MessageInsert, Message } from '../lib/database.types';

export const chatService = {
  // Mesaj gönder
  sendMessage: async (matchId: string, senderId: string, content: string, messageType: 'text' | 'image' | 'gif' = 'text') => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        content,
        message_type: messageType,
      })
      .select()
      .single();

    // Match'in son mesaj zamanını güncelle
    if (!error) {
      await supabase
        .from('matches')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', matchId);
    }

    return { data, error };
  },

  // Match'in mesajlarını getir
  getMessages: async (matchId: string, limit: number = 50, offset: number = 0) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data: data?.reverse(), error };
  },

  // Mesajları okundu olarak işaretle
  markAsRead: async (matchId: string, userId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('match_id', matchId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    return { error };
  },

  // Okunmamış mesaj sayısı
  getUnreadCount: async (matchId: string, userId: string) => {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    return { count, error };
  },

  // Tüm okunmamış mesaj sayısı
  getTotalUnreadCount: async (userId: string) => {
    // Önce kullanıcının match'lerini al
    const { data: matches } = await supabase
      .from('matches')
      .select('id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('is_active', true);

    if (!matches || matches.length === 0) return { count: 0, error: null };

    const matchIds = matches.map(m => m.id);

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('match_id', matchIds)
      .neq('sender_id', userId)
      .eq('is_read', false);

    return { count, error };
  },

  // Realtime mesaj dinleme
  subscribeToMessages: (matchId: string, callback: (message: Message) => void) => {
    const subscription = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();

    return subscription;
  },

  // Subscription'ı kapat
  unsubscribe: async (subscription: any) => {
    await supabase.removeChannel(subscription);
  },

  // Son mesajı getir (liste önizlemesi için)
  getLastMessage: async (matchId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return { data, error };
  },
};

export default chatService;
