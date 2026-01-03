/**
 * Premium Üyelik Servisi
 * Abonelik yönetimi ve premium özellik kontrolü
 */

import { supabase } from '../lib/supabase';

// Plan tipleri
export type PlanType = 'free' | 'gold' | 'platinum' | 'diamond';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  started_at: string;
  expires_at: string | null;
  is_active: boolean;
  payment_provider: string | null;
  auto_renew: boolean;
}

export interface PremiumFeature {
  feature_key: string;
  feature_value: string;
  is_enabled: boolean;
}

export interface PlanDetails {
  type: PlanType;
  name: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly';
  features: string[];
  color: string;
  icon: string;
}

// Plan detayları
export const PLANS: PlanDetails[] = [
  {
    type: 'free',
    name: 'Ücretsiz',
    price: 0,
    currency: 'TRY',
    period: 'monthly',
    features: [
      'Günde 50 beğeni',
      'Günde 1 süper beğeni',
      'Sınırsız mesajlaşma',
      'Temel keşif özellikleri',
    ],
    color: '#64748b',
    icon: 'person-outline',
  },
  {
    type: 'gold',
    name: 'Gold',
    price: 79.99,
    currency: 'TRY',
    period: 'monthly',
    features: [
      'Sınırsız beğeni',
      'Günde 5 süper beğeni',
      'Seni beğenenleri gör',
      'Geri alma özelliği',
      'Ayda 1 profil öne çıkarma',
      'Profil ziyaretçilerini gör',
    ],
    color: '#f59e0b',
    icon: 'star',
  },
  {
    type: 'platinum',
    name: 'Platinum',
    price: 149.99,
    currency: 'TRY',
    period: 'monthly',
    features: [
      'Gold\'un tüm özellikleri',
      'Günde 10 süper beğeni',
      'Ayda 3 profil öne çıkarma',
      'Öncelikli beğeni gösterimi',
      'Gelişmiş filtreler',
    ],
    color: '#a855f7',
    icon: 'diamond',
  },
  {
    type: 'diamond',
    name: 'Diamond',
    price: 299.99,
    currency: 'TRY',
    period: 'monthly',
    features: [
      'Platinum\'un tüm özellikleri',
      'Sınırsız süper beğeni',
      'Sınırsız profil öne çıkarma',
      'Özel rozet',
      'VIP destek',
      'Reklamsız deneyim',
    ],
    color: '#06b6d4',
    icon: 'diamond-outline',
  },
];

// =============================================
// ABONELİK İŞLEMLERİ
// =============================================

/**
 * Kullanıcının mevcut aboneliğini getir
 */
export const getCurrentSubscription = async (): Promise<Subscription | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data;
  } catch (error) {
    console.error('Abonelik getirme hatası:', error);
    return null;
  }
};

/**
 * Kullanıcının plan tipini getir
 */
export const getUserPlanType = async (): Promise<PlanType> => {
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription) return 'free';
    
    // Süresi dolmuş mu kontrol et
    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      return 'free';
    }
    
    return subscription.plan_type;
  } catch {
    return 'free';
  }
};

/**
 * Belirli bir özelliğe erişimi var mı kontrol et
 */
export const hasFeature = async (featureKey: string): Promise<boolean> => {
  try {
    const planType = await getUserPlanType();
    
    const { data, error } = await supabase
      .from('premium_features')
      .select('feature_value, is_enabled')
      .eq('plan_type', planType)
      .eq('feature_key', featureKey)
      .single();

    if (error || !data) return false;
    if (!data.is_enabled) return false;
    
    return data.feature_value === 'true' || data.feature_value === 'unlimited';
  } catch {
    return false;
  }
};

/**
 * Bir özelliğin limitini getir
 */
export const getFeatureLimit = async (featureKey: string): Promise<number | 'unlimited'> => {
  try {
    const planType = await getUserPlanType();
    
    const { data, error } = await supabase
      .from('premium_features')
      .select('feature_value')
      .eq('plan_type', planType)
      .eq('feature_key', featureKey)
      .single();

    if (error || !data) return 0;
    if (data.feature_value === 'unlimited') return 'unlimited';
    
    return parseInt(data.feature_value, 10) || 0;
  } catch {
    return 0;
  }
};

/**
 * Plan özelliklerini getir
 */
export const getPlanFeatures = async (planType: PlanType): Promise<PremiumFeature[]> => {
  try {
    const { data, error } = await supabase
      .from('premium_features')
      .select('feature_key, feature_value, is_enabled')
      .eq('plan_type', planType);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Plan özellikleri hatası:', error);
    return [];
  }
};

// =============================================
// ÖDEMİ SİMÜLASYONU (Gerçek entegrasyon için güncellenmeli)
// =============================================

/**
 * Abonelik başlat (simülasyon)
 */
export const startSubscription = async (
  planType: PlanType,
  paymentProvider: 'apple' | 'google' | 'stripe' = 'stripe'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Oturum bulunamadı' };
    }

    // Mevcut aboneliği iptal et
    await supabase
      .from('subscriptions')
      .update({ is_active: false })
      .eq('user_id', user.id);

    // 1 aylık abonelik oluştur
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_type: planType,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        payment_provider: paymentProvider,
        transaction_id: `TXN_${Date.now()}`, // Simülasyon
        auto_renew: true,
      });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Abonelik başlatma hatası:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Aboneliği iptal et
 */
export const cancelSubscription = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Oturum bulunamadı' };
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        auto_renew: false,
        // is_active kalıyor, süre dolunca deaktif olacak
      })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Abonelik iptal hatası:', error);
    return { success: false, error: error.message };
  }
};

// =============================================
// YARDIMCI FONKSİYONLAR
// =============================================

/**
 * Kalan süreyi hesapla
 */
export const getRemainingDays = async (): Promise<number> => {
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription?.expires_at) return 0;

    const expiresAt = new Date(subscription.expires_at);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  } catch {
    return 0;
  }
};

/**
 * Premium kullanıcı mı?
 */
export const isPremium = async (): Promise<boolean> => {
  const planType = await getUserPlanType();
  return planType !== 'free';
};

export default {
  PLANS,
  getCurrentSubscription,
  getUserPlanType,
  hasFeature,
  getFeatureLimit,
  getPlanFeatures,
  startSubscription,
  cancelSubscription,
  getRemainingDays,
  isPremium,
};

