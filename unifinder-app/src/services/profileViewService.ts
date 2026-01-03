/**
 * Profil Ziyaretçi Servisi
 * Profil görüntülemelerini kaydet ve listele
 */

import { supabase } from '../lib/supabase';

export interface ProfileViewer {
  id: string;
  full_name: string;
  avatar_url: string | null;
  university: string | null;
  department: string | null;
  is_verified: boolean;
  last_viewed_at: string;
  view_count: number;
}

export interface ProfileViewStats {
  totalViews: number;
  uniqueViewers: number;
  todayViews: number;
  weekViews: number;
}

// =============================================
// PROFİL GÖRÜNTÜLEME
// =============================================

/**
 * Profil görüntülemesini kaydet
 */
export const recordProfileView = async (profileId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id === profileId) return; // Kendine bakma sayılmaz

    // Upsert ile kaydet veya güncelle
    const { error } = await supabase
      .from('profile_views')
      .upsert(
        {
          profile_id: profileId,
          viewer_id: user.id,
          last_viewed_at: new Date().toISOString(),
        },
        {
          onConflict: 'profile_id,viewer_id',
        }
      );

    if (error) {
      // Conflict durumunda güncelle
      await supabase
        .from('profile_views')
        .update({ 
          last_viewed_at: new Date().toISOString(),
          view_count: supabase.rpc('increment_view_count') // Sayacı artır
        })
        .eq('profile_id', profileId)
        .eq('viewer_id', user.id);
    }
  } catch (error) {
    console.error('Profil görüntüleme kaydı hatası:', error);
  }
};

/**
 * Profil ziyaretçilerini getir (son 30 gün)
 */
export const getProfileViewers = async (): Promise<ProfileViewer[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('profile_views')
      .select(`
        id,
        last_viewed_at,
        view_count,
        viewer:profiles!profile_views_viewer_id_fkey (
          id,
          full_name,
          avatar_url,
          university,
          department,
          is_verified
        )
      `)
      .eq('profile_id', user.id)
      .gte('last_viewed_at', thirtyDaysAgo.toISOString())
      .order('last_viewed_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.viewer.id,
      full_name: item.viewer.full_name,
      avatar_url: item.viewer.avatar_url,
      university: item.viewer.university,
      department: item.viewer.department,
      is_verified: item.viewer.is_verified,
      last_viewed_at: item.last_viewed_at,
      view_count: item.view_count,
    }));
  } catch (error) {
    console.error('Profil ziyaretçileri hatası:', error);
    return [];
  }
};

/**
 * Profil görüntüleme istatistiklerini getir
 */
export const getProfileViewStats = async (): Promise<ProfileViewStats> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { totalViews: 0, uniqueViewers: 0, todayViews: 0, weekViews: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Tüm görüntülemeler
    const { data: allViews } = await supabase
      .from('profile_views')
      .select('id, view_count, last_viewed_at')
      .eq('profile_id', user.id)
      .gte('last_viewed_at', thirtyDaysAgo.toISOString());

    const views = allViews || [];
    
    const totalViews = views.reduce((sum, v) => sum + (v.view_count || 1), 0);
    const uniqueViewers = views.length;
    const todayViews = views.filter(v => new Date(v.last_viewed_at) >= today).length;
    const weekViews = views.filter(v => new Date(v.last_viewed_at) >= weekAgo).length;

    return { totalViews, uniqueViewers, todayViews, weekViews };
  } catch (error) {
    console.error('İstatistik hatası:', error);
    return { totalViews: 0, uniqueViewers: 0, todayViews: 0, weekViews: 0 };
  }
};

/**
 * Son X ziyaretçiyi getir (önizleme için)
 */
export const getRecentViewers = async (limit: number = 5): Promise<ProfileViewer[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('profile_views')
      .select(`
        last_viewed_at,
        view_count,
        viewer:profiles!profile_views_viewer_id_fkey (
          id,
          full_name,
          avatar_url,
          university,
          department,
          is_verified
        )
      `)
      .eq('profile_id', user.id)
      .order('last_viewed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.viewer.id,
      full_name: item.viewer.full_name,
      avatar_url: item.viewer.avatar_url,
      university: item.viewer.university,
      department: item.viewer.department,
      is_verified: item.viewer.is_verified,
      last_viewed_at: item.last_viewed_at,
      view_count: item.view_count,
    }));
  } catch (error) {
    console.error('Son ziyaretçiler hatası:', error);
    return [];
  }
};

export default {
  recordProfileView,
  getProfileViewers,
  getProfileViewStats,
  getRecentViewers,
};

