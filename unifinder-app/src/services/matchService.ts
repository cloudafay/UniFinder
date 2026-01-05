// Match Service
// Eşleşme ve swipe işlemleri

import { supabase } from '../lib/supabase';
import { SwipeInsert, Match } from '../lib/database.types';
import { notificationService } from './notificationService';

export const matchService = {
  // Swipe yap (like, nope, superlike)
  swipe: async (swiperId: string, swipedId: string, action: 'like' | 'nope' | 'superlike') => {
    // Önce bu swipe'ın daha önce yapılıp yapılmadığını kontrol et
    const { data: existingSwipe } = await supabase
      .from('swipes')
      .select('id, action')
      .eq('swiper_id', swiperId)
      .eq('swiped_id', swipedId)
      .maybeSingle();

    if (existingSwipe) {
      console.log('⚠️ Bu kullanıcıya zaten swipe yapılmış:', existingSwipe.action);
      return { data: existingSwipe, isMatch: false, error: { message: 'Zaten swipe yapılmış' } };
    }

    // Swipe kaydet
    const { data: swipeData, error: swipeError } = await supabase
      .from('swipes')
      .insert({
        swiper_id: swiperId,
        swiped_id: swipedId,
        action,
      })
      .select()
      .single();

    if (swipeError) return { data: null, isMatch: false, error: swipeError };

    // Beğeni veya süper like ise, karşı tarafa bildirim gönder
    if (action === 'like' || action === 'superlike') {
      // Beğenen kişinin bilgilerini al
      const { data: swiperProfile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, photos')
        .eq('id', swiperId)
        .single();

      const swiperName = swiperProfile?.full_name || 'Birisi';
      const swiperPhoto = swiperProfile?.avatar_url || swiperProfile?.photos?.[0] || '';
      const isSuperLike = action === 'superlike';

      // Beğeni bildirimi gönder - "like_request" türünde (onay bekleyen)
      console.log('📨 Bildirim gönderiliyor:', swipedId, swiperName);
      const { data: notifData, error: notifError } = await notificationService.create({
        user_id: swipedId,
        type: 'like_request',
        title: isSuperLike ? '⭐ Süper Beğeni!' : '💖 Yeni Beğeni!',
        body: `${swiperName} sizi ${isSuperLike ? 'süper ' : ''}beğendi! Eşleşmek istiyorsanız onaylayın.`,
        data: {
          likerId: swiperId,
          likerName: swiperName,
          likerPhoto: swiperPhoto,
          isSuperLike,
          swipeId: swipeData.id,
        },
      });

      if (notifError) {
        console.error('❌ Bildirim gönderme hatası:', notifError);
      } else {
        console.log('✅ Bildirim gönderildi:', notifData);
      }

      // Karşılıklı beğeni kontrolü (otomatik eşleşme için)
      const { data: mutualSwipe } = await supabase
        .from('swipes')
        .select('*')
        .eq('swiper_id', swipedId)
        .eq('swiped_id', swiperId)
        .in('action', ['like', 'superlike'])
        .single();

      // Karşılıklı beğeni varsa, match oluştur
      if (mutualSwipe) {
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .insert({
            user1_id: swiperId < swipedId ? swiperId : swipedId,
            user2_id: swiperId < swipedId ? swipedId : swiperId,
          })
          .select()
          .single();

        if (matchError) return { data: null, isMatch: false, error: matchError };

        return { data: matchData, isMatch: true, error: null };
      }
    }

    return { data: swipeData, isMatch: false, error: null };
  },

  // Beğeniyi onayla ve eşleşme oluştur
  acceptLike: async (userId: string, likerId: string) => {
    // Önce karşı tarafın swipe'ını kontrol et
    const { data: existingSwipe } = await supabase
      .from('swipes')
      .select('*')
      .eq('swiper_id', likerId)
      .eq('swiped_id', userId)
      .in('action', ['like', 'superlike'])
      .single();

    if (!existingSwipe) {
      return { data: null, error: { message: 'Beğeni bulunamadı' } };
    }

    // Kullanıcının karşılık beğenisini kaydet
    const { error: swipeError } = await supabase
      .from('swipes')
      .insert({
        swiper_id: userId,
        swiped_id: likerId,
        action: 'like',
      });

    if (swipeError && !swipeError.message.includes('duplicate')) {
      return { data: null, error: swipeError };
    }

    // Match oluştur
    const user1 = userId < likerId ? userId : likerId;
    const user2 = userId < likerId ? likerId : userId;

    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .insert({
        user1_id: user1,
        user2_id: user2,
      })
      .select()
      .single();

    if (matchError) {
      // Match zaten varsa getir
      if (matchError.message.includes('duplicate') || matchError.code === '23505') {
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('*')
          .eq('user1_id', user1)
          .eq('user2_id', user2)
          .single();

        return { data: existingMatch, error: null };
      }
      return { data: null, error: matchError };
    }

    // Her iki tarafa da eşleşme bildirimi gönder
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const { data: likerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', likerId)
      .single();

    // Beğeniyi kabul eden kişiye bildirim
    await notificationService.create({
      user_id: userId,
      type: 'match',
      title: '🎉 Yeni Eşleşme!',
      body: `${likerProfile?.full_name || 'Birisi'} ile eşleştiniz!`,
      data: { matchId: matchData.id, matchedUserId: likerId },
    });

    // Beğenen kişiye bildirim
    await notificationService.create({
      user_id: likerId,
      type: 'match',
      title: '🎉 Yeni Eşleşme!',
      body: `${userProfile?.full_name || 'Birisi'} beğeninizi kabul etti!`,
      data: { matchId: matchData.id, matchedUserId: userId },
    });

    return { data: matchData, error: null };
  },

  // Tüm eşleşmelerimi getir
  getMyMatches: async (userId: string) => {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        user1:profiles!matches_user1_id_fkey(*),
        user2:profiles!matches_user2_id_fkey(*)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    // Diğer kullanıcının profilini çıkar
    const matchesWithProfiles = data?.map(match => {
      const otherUser = match.user1_id === userId ? match.user2 : match.user1;
      return {
        ...match,
        otherUser,
      };
    });

    return { data: matchesWithProfiles, error };
  },

  // Match detayı getir
  getMatchById: async (matchId: string) => {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        user1:profiles!matches_user1_id_fkey(*),
        user2:profiles!matches_user2_id_fkey(*)
      `)
      .eq('id', matchId)
      .single();

    return { data, error };
  },

  // Match'i unmatch yap (deaktif et)
  unmatch: async (matchId: string) => {
    const { error } = await supabase
      .from('matches')
      .update({ is_active: false })
      .eq('id', matchId);

    return { error };
  },

  // Beni beğenenleri getir (premium özellik)
  getLikesReceived: async (userId: string) => {
    const { data, error } = await supabase
      .from('swipes')
      .select(`
        *,
        swiper:profiles!swipes_swiper_id_fkey(*)
      `)
      .eq('swiped_id', userId)
      .in('action', ['like', 'superlike'])
      .order('created_at', { ascending: false });

    return { data, error };
  },
};

export default matchService;
