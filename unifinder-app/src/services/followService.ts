/**
 * Takip Sistemi Servisi
 * Takip etme, takipten çıkma, takipçi/takip listesi işlemleri
 */

import { supabase } from '../lib/supabase';

// Tip tanımlamaları
export interface FollowRelation {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FollowUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  university: string | null;
  department: string | null;
  is_verified: boolean;
  followed_at: string;
}

export interface FollowStats {
  followers: number;
  following: number;
  matches: number;
}

// =============================================
// TAKİP İŞLEMLERİ
// =============================================

/**
 * Bir kullanıcıyı takip et
 */
export const followUser = async (followingId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Oturum bulunamadı' };
    }

    // Kendini takip etmeye çalışıyor mu?
    if (user.id === followingId) {
      return { success: false, error: 'Kendinizi takip edemezsiniz' };
    }

    // Zaten takip ediyor mu?
    const { data: existing } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single();

    if (existing) {
      return { success: false, error: 'Bu kullanıcıyı zaten takip ediyorsunuz' };
    }

    // Takip et
    const { error } = await supabase
      .from('followers')
      .insert({
        follower_id: user.id,
        following_id: followingId,
      });

    if (error) throw error;

    // Bildirim gönder
    await supabase
      .from('notifications')
      .insert({
        user_id: followingId,
        type: 'like', // Takip bildirimi için uygun tip
        title: 'Yeni Takipçi',
        body: 'Birisi sizi takip etmeye başladı',
        data: { follower_id: user.id },
      });

    return { success: true };
  } catch (error: any) {
    console.error('Takip etme hatası:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Bir kullanıcıyı takipten çık
 */
export const unfollowUser = async (followingId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Oturum bulunamadı' };
    }

    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Takipten çıkma hatası:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Kullanıcıyı takip ediyor mu kontrol et
 */
export const isFollowing = async (followingId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single();

    return !!data;
  } catch {
    return false;
  }
};

// =============================================
// TAKİPÇİ LİSTELERİ
// =============================================

/**
 * Kullanıcının takipçilerini getir
 */
export const getFollowers = async (userId: string): Promise<FollowUser[]> => {
  try {
    const { data, error } = await supabase
      .from('followers')
      .select(`
        id,
        created_at,
        follower:profiles!followers_follower_id_fkey (
          id,
          full_name,
          avatar_url,
          university,
          department,
          is_verified
        )
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.follower.id,
      full_name: item.follower.full_name,
      avatar_url: item.follower.avatar_url,
      university: item.follower.university,
      department: item.follower.department,
      is_verified: item.follower.is_verified,
      followed_at: item.created_at,
    }));
  } catch (error) {
    console.error('Takipçi listesi hatası:', error);
    return [];
  }
};

/**
 * Kullanıcının takip ettiklerini getir
 */
export const getFollowing = async (userId: string): Promise<FollowUser[]> => {
  try {
    const { data, error } = await supabase
      .from('followers')
      .select(`
        id,
        created_at,
        following:profiles!followers_following_id_fkey (
          id,
          full_name,
          avatar_url,
          university,
          department,
          is_verified
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.following.id,
      full_name: item.following.full_name,
      avatar_url: item.following.avatar_url,
      university: item.following.university,
      department: item.following.department,
      is_verified: item.following.is_verified,
      followed_at: item.created_at,
    }));
  } catch (error) {
    console.error('Takip edilen listesi hatası:', error);
    return [];
  }
};

// =============================================
// İSTATİSTİKLER
// =============================================

/**
 * Kullanıcının takip istatistiklerini getir
 */
export const getFollowStats = async (userId: string): Promise<FollowStats> => {
  try {
    // Paralel sorgular
    const [followersResult, followingResult, matchesResult] = await Promise.all([
      supabase.from('followers').select('id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('followers').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
      supabase.from('matches').select('id', { count: 'exact', head: true })
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('is_active', true),
    ]);

    return {
      followers: followersResult.count || 0,
      following: followingResult.count || 0,
      matches: matchesResult.count || 0,
    };
  } catch (error) {
    console.error('İstatistik hatası:', error);
    return { followers: 0, following: 0, matches: 0 };
  }
};

// =============================================
// KARŞILIKLI TAKİP
// =============================================

/**
 * Karşılıklı takip var mı kontrol et (mutual follow)
 */
export const isMutualFollow = async (userId1: string, userId2: string): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from('followers')
      .select('id')
      .or(`and(follower_id.eq.${userId1},following_id.eq.${userId2}),and(follower_id.eq.${userId2},following_id.eq.${userId1})`);

    return (data?.length || 0) === 2;
  } catch {
    return false;
  }
};

/**
 * Ortak takip edilen kullanıcıları getir
 */
export const getMutualFollowing = async (userId1: string, userId2: string): Promise<string[]> => {
  try {
    // Her iki kullanıcının takip ettiklerini al
    const [user1Following, user2Following] = await Promise.all([
      supabase.from('followers').select('following_id').eq('follower_id', userId1),
      supabase.from('followers').select('following_id').eq('follower_id', userId2),
    ]);

    const user1Ids = new Set((user1Following.data || []).map(f => f.following_id));
    const mutualIds = (user2Following.data || [])
      .filter(f => user1Ids.has(f.following_id))
      .map(f => f.following_id);

    return mutualIds;
  } catch {
    return [];
  }
};

export default {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowers,
  getFollowing,
  getFollowStats,
  isMutualFollow,
  getMutualFollowing,
};

