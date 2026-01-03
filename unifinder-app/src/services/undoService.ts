// Undo Service
// Swipe geri alma işlemleri

import { supabase } from '../lib/supabase';
import { Profile } from '../lib/database.types';

interface UndoState {
  lastSwipedProfile: Profile | null;
  lastSwipeAction: 'like' | 'nope' | 'superlike' | null;
  lastSwipeAt: Date | null;
  undoCountToday: number;
  lastUndoDate: string | null;
}

// Memory'de tutulan son swipe (5 saniye timeout için)
let memoryUndoState: {
  profile: Profile | null;
  action: string | null;
  timestamp: number | null;
} = {
  profile: null,
  action: null,
  timestamp: null,
};

const UNDO_TIMEOUT_MS = 5000; // 5 saniye
const FREE_USER_DAILY_LIMIT = 1;

export const undoService = {
  // Son swipe'ı kaydet (memory + database)
  storeSwipe: async (userId: string, profile: Profile, action: 'like' | 'nope' | 'superlike') => {
    // Memory'ye kaydet (hızlı erişim için)
    memoryUndoState = {
      profile,
      action,
      timestamp: Date.now(),
    };

    // Database'e kaydet - tablo yoksa hata vermesin
    try {
      const { error } = await supabase
        .from('undo_history')
        .upsert({
          user_id: userId,
          last_swiped_profile_id: profile.id,
          last_swipe_action: action,
          last_swipe_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        // Tablo yoksa veya kolon eksikse sessizce devam et
        console.log('Undo state kaydetme atlandı (tablo eksik olabilir):', error.code);
      }
    } catch (err) {
      console.log('Undo state kaydetme hatası (sessiz):', err);
    }
  },

  // Undo yapılabilir mi kontrol et
  canUndo: async (userId: string, isPremium: boolean): Promise<{ canUndo: boolean; reason?: string }> => {
    // Memory'de swipe var mı ve timeout geçmemiş mi?
    if (!memoryUndoState.profile || !memoryUndoState.timestamp) {
      return { canUndo: false, reason: 'NO_PREVIOUS_SWIPE' };
    }

    const timeSinceSwipe = Date.now() - memoryUndoState.timestamp;
    if (timeSinceSwipe > UNDO_TIMEOUT_MS) {
      return { canUndo: false, reason: 'UNDO_TIMEOUT' };
    }

    // Premium kullanıcılar sınırsız
    if (isPremium) {
      return { canUndo: true };
    }

    // Free kullanıcılar için günlük limit kontrolü
    const { data, error } = await supabase
      .from('undo_history')
      .select('undo_count_today, last_undo_date')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Undo history okuma hatası:', error);
      return { canUndo: false, reason: 'DATABASE_ERROR' };
    }

    const today = new Date().toISOString().split('T')[0];
    const undoCountToday = data?.last_undo_date === today ? (data?.undo_count_today || 0) : 0;

    if (undoCountToday >= FREE_USER_DAILY_LIMIT) {
      return { canUndo: false, reason: 'UNDO_LIMIT_REACHED' };
    }

    return { canUndo: true };
  },

  // Undo işlemini gerçekleştir
  performUndo: async (userId: string, isPremium: boolean): Promise<{ 
    success: boolean; 
    profile?: Profile; 
    error?: string 
  }> => {
    // Önce undo yapılabilir mi kontrol et
    const { canUndo, reason } = await undoService.canUndo(userId, isPremium);
    
    if (!canUndo) {
      return { success: false, error: reason };
    }

    const profile = memoryUndoState.profile;
    const action = memoryUndoState.action;

    if (!profile || !action) {
      return { success: false, error: 'NO_PREVIOUS_SWIPE' };
    }

    // Swipe kaydını sil
    const { error: deleteError } = await supabase
      .from('swipes')
      .delete()
      .eq('swiper_id', userId)
      .eq('swiped_id', profile.id)
      .eq('action', action);

    if (deleteError) {
      console.error('Swipe silme hatası:', deleteError);
      return { success: false, error: 'DELETE_FAILED' };
    }

    // Undo sayacını güncelle (sadece free kullanıcılar için)
    if (!isPremium) {
      const today = new Date().toISOString().split('T')[0];
      
      await supabase
        .from('undo_history')
        .upsert({
          user_id: userId,
          undo_count_today: 1,
          last_undo_date: today,
          last_swiped_profile_id: null,
          last_swipe_action: null,
          last_swipe_at: null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
    }

    // Memory'yi temizle
    memoryUndoState = {
      profile: null,
      action: null,
      timestamp: null,
    };

    return { success: true, profile };
  },

  // Günlük undo sayısını sıfırla (gece yarısı çağrılır)
  resetDailyCount: async (userId: string) => {
    const { error } = await supabase
      .from('undo_history')
      .update({
        undo_count_today: 0,
        last_undo_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Undo sayacı sıfırlama hatası:', error);
    }
  },

  // Kalan undo hakkı
  getRemainingUndos: async (userId: string, isPremium: boolean): Promise<number> => {
    if (isPremium) {
      return Infinity;
    }

    const { data, error } = await supabase
      .from('undo_history')
      .select('undo_count_today, last_undo_date')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return FREE_USER_DAILY_LIMIT;
    }

    const today = new Date().toISOString().split('T')[0];
    const undoCountToday = data?.last_undo_date === today ? (data?.undo_count_today || 0) : 0;

    return Math.max(0, FREE_USER_DAILY_LIMIT - undoCountToday);
  },

  // Memory state'i temizle (uygulama kapanırken)
  clearMemoryState: () => {
    memoryUndoState = {
      profile: null,
      action: null,
      timestamp: null,
    };
  },

  // Timeout kontrolü (UI için)
  getTimeRemaining: (): number => {
    if (!memoryUndoState.timestamp) return 0;
    const remaining = UNDO_TIMEOUT_MS - (Date.now() - memoryUndoState.timestamp);
    return Math.max(0, remaining);
  },

  // Son swipe'ı getir (UI için)
  getLastSwipe: (): { profile: Profile | null; action: string | null } => {
    return {
      profile: memoryUndoState.profile,
      action: memoryUndoState.action,
    };
  },
};

export default undoService;
