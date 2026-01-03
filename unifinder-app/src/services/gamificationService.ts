// Gamification Service
// Günlük görevler, rozetler ve XP sistemi

import { supabase } from '../lib/supabase';

// Tipler
export interface DailyTask {
  id: string;
  user_id: string;
  task_type: 'swipe_count' | 'message_sent' | 'profile_view' | 'story_post' | 'like_received';
  target: number;
  current: number;
  xp_reward: number;
  completed: boolean;
  date: string;
}

export interface Badge {
  id: string;
  name: string;
  name_tr: string;
  description: string;
  description_tr: string;
  icon: string;
  category: 'social' | 'activity' | 'achievement' | 'special';
  requirement_type: string;
  requirement_value: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface UserProgress {
  user_id: string;
  level: number;
  current_xp: number;
  total_xp: number;
  streak_days: number;
  last_active_date: string | null;
}

// Görev tipi açıklamaları (Türkçe)
export const TASK_TYPE_LABELS: Record<string, { title: string; description: string; icon: string }> = {
  swipe_count: { title: 'Profil Keşfet', description: 'profil gör', icon: '👀' },
  message_sent: { title: 'Mesaj Gönder', description: 'mesaj gönder', icon: '💬' },
  profile_view: { title: 'Profil Ziyaret Et', description: 'profil ziyaret et', icon: '👤' },
  story_post: { title: 'Hikaye Paylaş', description: 'hikaye paylaş', icon: '📸' },
  like_received: { title: 'Beğeni Al', description: 'beğeni al', icon: '❤️' },
};

export const gamificationService = {
  // =====================================================
  // GÜNLÜK GÖREVLER
  // =====================================================

  // Günlük görevleri getir (yoksa oluştur)
  getDailyTasks: async (userId: string): Promise<{ data: DailyTask[] | null; error: any }> => {
    const today = new Date().toISOString().split('T')[0];

    // Bugünkü görevleri kontrol et
    let { data, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today);

    if (error) {
      return { data: null, error };
    }

    // Görev yoksa oluştur
    if (!data || data.length === 0) {
      await gamificationService.generateDailyTasks(userId);
      
      // Tekrar çek
      const result = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today);
      
      return { data: result.data, error: result.error };
    }

    return { data, error: null };
  },

  // Günlük görevleri oluştur
  generateDailyTasks: async (userId: string): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];
    const taskTypes = ['swipe_count', 'message_sent', 'profile_view', 'story_post'];
    
    // 3-5 arası rastgele görev sayısı
    const taskCount = 3 + Math.floor(Math.random() * 3);
    const selectedTypes = taskTypes.sort(() => Math.random() - 0.5).slice(0, taskCount);

    const tasks = selectedTypes.map(taskType => ({
      user_id: userId,
      task_type: taskType,
      target: getTargetForTaskType(taskType),
      xp_reward: getXPRewardForTaskType(taskType),
      date: today,
      current: 0,
      completed: false,
    }));

    await supabase.from('daily_tasks').insert(tasks);
  },

  // Görev ilerlemesini güncelle
  updateTaskProgress: async (
    userId: string, 
    taskType: string, 
    increment: number = 1
  ): Promise<{ completed: boolean; xpAwarded: number }> => {
    const today = new Date().toISOString().split('T')[0];

    // Görevi bul
    const { data: task, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('task_type', taskType)
      .eq('date', today)
      .eq('completed', false)
      .single();

    if (error || !task) {
      return { completed: false, xpAwarded: 0 };
    }

    const newCurrent = Math.min(task.current + increment, task.target);
    const isCompleted = newCurrent >= task.target;

    // Güncelle
    await supabase
      .from('daily_tasks')
      .update({ 
        current: newCurrent, 
        completed: isCompleted 
      })
      .eq('id', task.id);

    // Tamamlandıysa XP ver
    if (isCompleted) {
      await gamificationService.awardXP(userId, task.xp_reward);
      
      // Tüm görevler tamamlandı mı kontrol et
      await gamificationService.checkAllTasksCompleted(userId);
    }

    return { completed: isCompleted, xpAwarded: isCompleted ? task.xp_reward : 0 };
  },

  // Tüm görevler tamamlandı mı kontrol et (bonus için)
  checkAllTasksCompleted: async (userId: string): Promise<boolean> => {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_tasks')
      .select('completed')
      .eq('user_id', userId)
      .eq('date', today);

    if (error || !data) return false;

    const allCompleted = data.every(task => task.completed);
    
    if (allCompleted && data.length > 0) {
      // Bonus XP ver (50 XP)
      await gamificationService.awardXP(userId, 50);
      console.log('Tüm görevler tamamlandı! +50 bonus XP');
    }

    return allCompleted;
  },


  // =====================================================
  // XP VE SEVİYE SİSTEMİ
  // =====================================================

  // XP ekle
  awardXP: async (userId: string, amount: number): Promise<{ newLevel: number; levelUp: boolean }> => {
    // Mevcut ilerlemeyi al veya oluştur
    let { data: progress, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Kayıt yok, oluştur
      const { data: newProgress } = await supabase
        .from('user_progress')
        .insert({
          user_id: userId,
          level: 1,
          current_xp: 0,
          total_xp: 0,
          streak_days: 0,
        })
        .select()
        .single();
      
      progress = newProgress;
    }

    if (!progress) {
      return { newLevel: 1, levelUp: false };
    }

    let currentLevel = progress.level;
    let currentXP = progress.current_xp + amount;
    let totalXP = progress.total_xp + amount;
    let levelUp = false;

    // Seviye atlama kontrolü (her seviye için 100 * seviye XP gerekli)
    while (currentXP >= currentLevel * 100) {
      currentXP -= currentLevel * 100;
      currentLevel++;
      levelUp = true;
    }

    // Güncelle
    await supabase
      .from('user_progress')
      .update({
        level: currentLevel,
        current_xp: currentXP,
        total_xp: totalXP,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    return { newLevel: currentLevel, levelUp };
  },

  // Kullanıcı ilerlemesini getir
  getUserProgress: async (userId: string): Promise<UserProgress | null> => {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Kayıt yok, varsayılan döndür
      return {
        user_id: userId,
        level: 1,
        current_xp: 0,
        total_xp: 0,
        streak_days: 0,
        last_active_date: null,
      };
    }

    return data;
  },

  // Streak güncelle
  updateStreak: async (userId: string): Promise<number> => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const { data: progress } = await supabase
      .from('user_progress')
      .select('streak_days, last_active_date')
      .eq('user_id', userId)
      .single();

    let newStreak = 1;

    if (progress) {
      if (progress.last_active_date === yesterday) {
        // Dün aktifti, streak devam
        newStreak = progress.streak_days + 1;
      } else if (progress.last_active_date === today) {
        // Bugün zaten güncellendi
        return progress.streak_days;
      }
      // Aksi halde streak sıfırlanır (1'den başlar)
    }

    await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        streak_days: newStreak,
        last_active_date: today,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    return newStreak;
  },

  // =====================================================
  // ROZET SİSTEMİ
  // =====================================================

  // Tüm rozetleri getir
  getAllBadges: async (): Promise<Badge[]> => {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('rarity', { ascending: true });

    return data || [];
  },

  // Kullanıcının rozetlerini getir
  getUserBadges: async (userId: string): Promise<UserBadge[]> => {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    return data || [];
  },

  // Rozet kazanma kontrolü
  checkBadgeEligibility: async (userId: string): Promise<Badge[]> => {
    const earnedBadges: Badge[] = [];

    // Kullanıcının mevcut rozetlerini al
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);

    // Tüm rozetleri al
    const { data: allBadges } = await supabase
      .from('badges')
      .select('*');

    if (!allBadges) return [];

    // Her rozet için uygunluk kontrolü
    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      const isEligible = await checkBadgeRequirement(userId, badge);
      
      if (isEligible) {
        // Rozeti ver
        await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badge.id,
          });

        earnedBadges.push(badge);
        
        // Rozet için XP ver
        const xpReward = getBadgeXPReward(badge.rarity);
        await gamificationService.awardXP(userId, xpReward);
      }
    }

    return earnedBadges;
  },

  // Top 3 rozeti getir (profil için)
  getTopBadges: async (userId: string, limit: number = 3): Promise<UserBadge[]> => {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .limit(limit);

    return data || [];
  },
};

// =====================================================
// YARDIMCI FONKSİYONLAR
// =====================================================

function getTargetForTaskType(taskType: string): number {
  const targets: Record<string, () => number> = {
    swipe_count: () => 5 + Math.floor(Math.random() * 10), // 5-15
    message_sent: () => 3 + Math.floor(Math.random() * 5), // 3-8
    profile_view: () => 3 + Math.floor(Math.random() * 5), // 3-8
    story_post: () => 1, // 1
    like_received: () => 2 + Math.floor(Math.random() * 3), // 2-5
  };
  return targets[taskType]?.() || 5;
}

function getXPRewardForTaskType(taskType: string): number {
  const rewards: Record<string, number> = {
    swipe_count: 10,
    message_sent: 15,
    profile_view: 10,
    story_post: 20,
    like_received: 15,
  };
  return rewards[taskType] || 10;
}

function getBadgeXPReward(rarity: string): number {
  const rewards: Record<string, number> = {
    common: 25,
    rare: 50,
    epic: 100,
    legendary: 200,
  };
  return rewards[rarity] || 25;
}

async function checkBadgeRequirement(userId: string, badge: Badge): Promise<boolean> {
  const { requirement_type, requirement_value } = badge;

  switch (requirement_type) {
    case 'match_count': {
      const { count } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
      return (count || 0) >= requirement_value;
    }
    case 'message_count': {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', userId);
      return (count || 0) >= requirement_value;
    }
    case 'story_count': {
      const { count } = await supabase
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return (count || 0) >= requirement_value;
    }
    case 'email_verified': {
      const { data } = await supabase
        .from('profiles')
        .select('is_verified')
        .eq('id', userId)
        .single();
      return data?.is_verified === true;
    }
    case 'photo_verified': {
      const { data } = await supabase
        .from('profiles')
        .select('is_photo_verified')
        .eq('id', userId)
        .single();
      return data?.is_photo_verified === true;
    }
    case 'streak_days': {
      const { data } = await supabase
        .from('user_progress')
        .select('streak_days')
        .eq('user_id', userId)
        .single();
      return (data?.streak_days || 0) >= requirement_value;
    }
    case 'event_created': {
      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);
      return (count || 0) >= requirement_value;
    }
    default:
      return false;
  }
}

export default gamificationService;
