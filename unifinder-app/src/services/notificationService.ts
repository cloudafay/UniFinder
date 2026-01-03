// Notification Service
// Bildirim işlemleri

import { supabase } from '../lib/supabase';
import { NotificationInsert, Notification } from '../lib/database.types';

export const notificationService = {
  // Bildirim oluştur
  create: async (notification: NotificationInsert) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    return { data, error };
  },

  // Kullanıcının bildirimlerini getir
  getMyNotifications: async (userId: string, limit: number = 20) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  },

  // Bildirimi okundu olarak işaretle
  markAsRead: async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId);

    return { error };
  },

  // Tüm bildirimleri okundu olarak işaretle
  markAllAsRead: async (userId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    return { error };
  },

  // Okunmamış bildirim sayısı
  getUnreadCount: async (userId: string) => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return { count, error };
  },

  // Bildirimi sil
  delete: async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    return { error };
  },

  // Realtime bildirim dinleme
  subscribeToNotifications: (userId: string, callback: (notification: Notification) => void) => {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return subscription;
  },

  // Subscription'ı kapat
  unsubscribe: async (subscription: any) => {
    await supabase.removeChannel(subscription);
  },

  // Match bildirimi gönder (helper)
  sendMatchNotification: async (userId: string, matchedUserName: string, matchedUserId: string) => {
    return notificationService.create({
      user_id: userId,
      type: 'match',
      title: 'Yeni Eşleşme! 🎉',
      body: `${matchedUserName} ile eşleştin!`,
      data: { matchedUserId },
    });
  },

  // Mesaj bildirimi gönder (helper)
  sendMessageNotification: async (userId: string, senderName: string, matchId: string, preview: string) => {
    return notificationService.create({
      user_id: userId,
      type: 'message',
      title: senderName,
      body: preview.length > 50 ? preview.substring(0, 50) + '...' : preview,
      data: { matchId },
    });
  },

  // Like bildirimi gönder (helper - premium)
  sendLikeNotification: async (userId: string, likerName: string, likerId: string, isSuperLike: boolean = false) => {
    return notificationService.create({
      user_id: userId,
      type: isSuperLike ? 'superlike' : 'like',
      title: isSuperLike ? 'Süper Beğeni! ⭐' : 'Yeni Beğeni! 💖',
      body: `${likerName} seni ${isSuperLike ? 'süper ' : ''}beğendi!`,
      data: { likerId },
    });
  },
};

export default notificationService;
