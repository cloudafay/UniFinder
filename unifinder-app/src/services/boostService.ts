// Boost Service
// Profil öne çıkarma işlemleri

import { supabase } from '../lib/supabase';

// Tipler
export interface Boost {
  id: string;
  user_id: string;
  started_at: string;
  expires_at: string;
  views_count: number;
  likes_count: number;
  is_active: boolean;
}

export interface BoostInventory {
  user_id: string;
  remaining_boosts: number;
  monthly_boosts: number;
  last_reset_date: string | null;
}

export interface BoostStatus {
  isActive: boolean;
  expiresAt: string | null;
  remainingBoosts: number;
  monthlyBoosts: number;
  currentBoost: Boost | null;
  stats: {
    viewsDuringBoost: number;
    likesDuringBoost: number;
  } | null;
}

const BOOST_DURATION_MINUTES = 30;
const FREE_USER_MONTHLY_BOOSTS = 1;
const PREMIUM_USER_MONTHLY_BOOSTS = 5;

export const boostService = {
  // Boost durumunu getir
  getBoostStatus: async (userId: string, isPremium: boolean): Promise<BoostStatus> => {
    // Aktif boost kontrolü
    const { data: activeBoost } = await supabase
      .from('boosts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();

    // Envanter kontrolü
    let { data: inventory } = await supabase
      .from('user_boost_inventory')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Envanter yoksa oluştur
    if (!inventory) {
      const monthlyBoosts = isPremium ? PREMIUM_USER_MONTHLY_BOOSTS : FREE_USER_MONTHLY_BOOSTS;
      
      const { data: newInventory } = await supabase
        .from('user_boost_inventory')
        .insert({
          user_id: userId,
          remaining_boosts: monthlyBoosts,
          monthly_boosts: monthlyBoosts,
          last_reset_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      
      inventory = newInventory;
    }

    // Aylık reset kontrolü
    const today = new Date();
    const lastReset = inventory?.last_reset_date ? new Date(inventory.last_reset_date) : null;
    
    if (lastReset && lastReset.getMonth() !== today.getMonth()) {
      // Yeni ay, boost'ları resetle
      const monthlyBoosts = isPremium ? PREMIUM_USER_MONTHLY_BOOSTS : FREE_USER_MONTHLY_BOOSTS;
      
      await supabase
        .from('user_boost_inventory')
        .update({
          remaining_boosts: monthlyBoosts,
          monthly_boosts: monthlyBoosts,
          last_reset_date: today.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      inventory!.remaining_boosts = monthlyBoosts;
    }

    return {
      isActive: !!activeBoost,
      expiresAt: activeBoost?.expires_at || null,
      remainingBoosts: inventory?.remaining_boosts || 0,
      monthlyBoosts: inventory?.monthly_boosts || (isPremium ? PREMIUM_USER_MONTHLY_BOOSTS : FREE_USER_MONTHLY_BOOSTS),
      currentBoost: activeBoost || null,
      stats: activeBoost ? {
        viewsDuringBoost: activeBoost.views_count,
        likesDuringBoost: activeBoost.likes_count,
      } : null,
    };
  },

  // Boost aktifleştir
  activateBoost: async (userId: string, isPremium: boolean): Promise<{ success: boolean; boost?: Boost; error?: string }> => {
    // Mevcut aktif boost kontrolü
    const { data: existingBoost } = await supabase
      .from('boosts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (existingBoost) {
      return { success: false, error: 'Zaten aktif bir boost var' };
    }

    // Envanter kontrolü
    const { data: inventory } = await supabase
      .from('user_boost_inventory')
      .select('remaining_boosts')
      .eq('user_id', userId)
      .single();

    if (!inventory || inventory.remaining_boosts <= 0) {
      return { success: false, error: 'Boost hakkınız kalmadı' };
    }

    // Boost oluştur
    const now = new Date();
    const expiresAt = new Date(now.getTime() + BOOST_DURATION_MINUTES * 60 * 1000);

    const { data: boost, error: boostError } = await supabase
      .from('boosts')
      .insert({
        user_id: userId,
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (boostError) {
      return { success: false, error: 'Boost oluşturulamadı' };
    }

    // Envanteri güncelle
    await supabase
      .from('user_boost_inventory')
      .update({
        remaining_boosts: inventory.remaining_boosts - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Profili boosted olarak işaretle
    await supabase
      .from('profiles')
      .update({
        is_boosted: true,
        boost_expires_at: expiresAt.toISOString(),
      })
      .eq('id', userId);

    return { success: true, boost };
  },

  // Boost istatistiklerini güncelle (görüntülenme)
  incrementBoostViews: async (userId: string): Promise<void> => {
    await supabase
      .from('boosts')
      .update({ views_count: supabase.rpc('increment_boost_views') })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Basit increment
    const { data: boost } = await supabase
      .from('boosts')
      .select('id, views_count')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (boost) {
      await supabase
        .from('boosts')
        .update({ views_count: (boost.views_count || 0) + 1 })
        .eq('id', boost.id);
    }
  },

  // Boost istatistiklerini güncelle (beğeni)
  incrementBoostLikes: async (userId: string): Promise<void> => {
    const { data: boost } = await supabase
      .from('boosts')
      .select('id, likes_count')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (boost) {
      await supabase
        .from('boosts')
        .update({ likes_count: (boost.likes_count || 0) + 1 })
        .eq('id', boost.id);
    }
  },

  // Süresi dolan boost'ları temizle
  cleanupExpiredBoosts: async (): Promise<void> => {
    const now = new Date().toISOString();

    // Süresi dolan boost'ları deaktif et
    await supabase
      .from('boosts')
      .update({ is_active: false })
      .eq('is_active', true)
      .lt('expires_at', now);

    // Profillerdeki boost durumunu temizle
    await supabase
      .from('profiles')
      .update({
        is_boosted: false,
        boost_expires_at: null,
      })
      .eq('is_boosted', true)
      .lt('boost_expires_at', now);
  },

  // Boosted profilleri getir (keşif için)
  getBoostedProfiles: async (excludeUserId: string, limit: number = 5): Promise<string[]> => {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_boosted', true)
      .neq('id', excludeUserId)
      .gte('boost_expires_at', new Date().toISOString())
      .limit(limit);

    return data?.map(p => p.id) || [];
  },

  // Boost satın al (ek boost)
  purchaseBoosts: async (userId: string, quantity: number): Promise<{ success: boolean; error?: string }> => {
    const { data: inventory } = await supabase
      .from('user_boost_inventory')
      .select('remaining_boosts')
      .eq('user_id', userId)
      .single();

    if (!inventory) {
      return { success: false, error: 'Envanter bulunamadı' };
    }

    const { error } = await supabase
      .from('user_boost_inventory')
      .update({
        remaining_boosts: inventory.remaining_boosts + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: 'Satın alma başarısız' };
    }

    return { success: true };
  },

  // Boost geçmişi
  getBoostHistory: async (userId: string, limit: number = 10): Promise<Boost[]> => {
    const { data } = await supabase
      .from('boosts')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);

    return data || [];
  },

  // Kalan süre (saniye)
  getRemainingTime: (expiresAt: string): number => {
    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    return Math.max(0, Math.floor((expires - now) / 1000));
  },
};

export default boostService;
