// Prompt Service
// Profil soruları (Hinge tarzı) işlemleri

import { supabase } from '../lib/supabase';

// Tipler
export interface ProfilePrompt {
  id: string;
  question: string;
  question_tr: string;
  category: 'personality' | 'lifestyle' | 'fun' | 'dating';
  is_active: boolean;
}

export interface UserPromptAnswer {
  id: string;
  user_id: string;
  prompt_id: string;
  answer: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  prompt?: ProfilePrompt;
}

export interface PromptLike {
  id: string;
  liker_id: string;
  answer_id: string;
  created_at: string;
}

// Kategori bilgileri
export const PROMPT_CATEGORIES = {
  personality: { label: 'Kişilik', icon: '🧠', color: '#8b5cf6' },
  lifestyle: { label: 'Yaşam Tarzı', icon: '🌟', color: '#22c55e' },
  fun: { label: 'Eğlence', icon: '🎉', color: '#f59e0b' },
  dating: { label: 'İlişki', icon: '💕', color: '#ec4899' },
};

const MAX_PROMPTS_PER_USER = 3;

export const promptService = {
  // Tüm soruları getir
  getAllPrompts: async (): Promise<{ data: ProfilePrompt[] | null; error: any }> => {
    const { data, error } = await supabase
      .from('profile_prompts')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    return { data, error };
  },

  // Kullanılabilir soruları getir (alias)
  getAvailablePrompts: async (): Promise<{ data: ProfilePrompt[] | null; error: any }> => {
    return promptService.getAllPrompts();
  },

  // Kategoriye göre soruları getir
  getPromptsByCategory: async (category: string): Promise<{ data: ProfilePrompt[] | null; error: any }> => {
    const { data, error } = await supabase
      .from('profile_prompts')
      .select('*')
      .eq('category', category)
      .eq('is_active', true);

    return { data, error };
  },

  // Kullanıcının cevaplarını getir
  getUserAnswers: async (userId: string): Promise<{ data: UserPromptAnswer[] | null; error: any }> => {
    const { data, error } = await supabase
      .from('user_prompt_answers')
      .select(`
        *,
        prompt:profile_prompts(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Cevap kaydet/güncelle
  saveAnswer: async (userId: string, promptId: string, answer: string): Promise<{ data: UserPromptAnswer | null; error: any }> => {
    // Mevcut cevap sayısını kontrol et
    const { count } = await supabase
      .from('user_prompt_answers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Yeni cevap mı kontrol et
    const { data: existing } = await supabase
      .from('user_prompt_answers')
      .select('id')
      .eq('user_id', userId)
      .eq('prompt_id', promptId)
      .single();

    if (!existing && (count || 0) >= MAX_PROMPTS_PER_USER) {
      return { data: null, error: { message: `En fazla ${MAX_PROMPTS_PER_USER} soru cevaplayabilirsiniz` } };
    }

    const { data, error } = await supabase
      .from('user_prompt_answers')
      .upsert({
        user_id: userId,
        prompt_id: promptId,
        answer,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,prompt_id',
      })
      .select(`
        *,
        prompt:profile_prompts(*)
      `)
      .single();

    return { data, error };
  },

  // Cevap sil
  deleteAnswer: async (userId: string, answerId: string): Promise<{ error: any }> => {
    const { error } = await supabase
      .from('user_prompt_answers')
      .delete()
      .eq('id', answerId)
      .eq('user_id', userId);

    return { error };
  },

  // Kullanıcı cevabını sil (prompt_id ile)
  deleteUserAnswer: async (userId: string, promptId: string): Promise<{ error: any }> => {
    const { error } = await supabase
      .from('user_prompt_answers')
      .delete()
      .eq('user_id', userId)
      .eq('prompt_id', promptId);

    return { error };
  },

  // Kullanıcı cevabını kaydet (alias)
  saveUserAnswer: async (userId: string, promptId: string, answer: string): Promise<{ data: UserPromptAnswer | null; error: string | null }> => {
    const result = await promptService.saveAnswer(userId, promptId, answer);
    return { 
      data: result.data, 
      error: result.error?.message || null 
    };
  },

  // Cevabı beğen
  likeAnswer: async (likerId: string, answerId: string): Promise<{ liked: boolean; error: any }> => {
    // Zaten beğenmiş mi kontrol et
    const { data: existing } = await supabase
      .from('prompt_likes')
      .select('id')
      .eq('liker_id', likerId)
      .eq('answer_id', answerId)
      .single();

    if (existing) {
      // Beğeniyi kaldır
      const { error } = await supabase
        .from('prompt_likes')
        .delete()
        .eq('id', existing.id);

      return { liked: false, error };
    } else {
      // Beğen
      const { error } = await supabase
        .from('prompt_likes')
        .insert({
          liker_id: likerId,
          answer_id: answerId,
        });

      // Bildirim gönder (cevap sahibine)
      if (!error) {
        const { data: answer } = await supabase
          .from('user_prompt_answers')
          .select('user_id')
          .eq('id', answerId)
          .single();

        if (answer && answer.user_id !== likerId) {
          // Bildirim oluştur
          await supabase
            .from('notifications')
            .insert({
              user_id: answer.user_id,
              type: 'prompt_like',
              title: 'Cevabın beğenildi!',
              body: 'Birisi profil cevabını beğendi',
              data: { liker_id: likerId, answer_id: answerId },
            });
        }
      }

      return { liked: true, error };
    }
  },

  // Beğeni durumunu kontrol et
  hasLiked: async (likerId: string, answerId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('prompt_likes')
      .select('id')
      .eq('liker_id', likerId)
      .eq('answer_id', answerId)
      .single();

    return !!data;
  },

  // Bir cevabın beğenilerini getir
  getAnswerLikes: async (answerId: string): Promise<{ count: number; likers: string[] }> => {
    const { data, count } = await supabase
      .from('prompt_likes')
      .select('liker_id', { count: 'exact' })
      .eq('answer_id', answerId)
      .limit(10);

    return {
      count: count || 0,
      likers: data?.map(l => l.liker_id) || [],
    };
  },

  // Kullanıcının beğendiği cevapları getir
  getLikedAnswers: async (userId: string): Promise<{ data: UserPromptAnswer[] | null; error: any }> => {
    const { data, error } = await supabase
      .from('prompt_likes')
      .select(`
        answer:user_prompt_answers(
          *,
          prompt:profile_prompts(*)
        )
      `)
      .eq('liker_id', userId)
      .order('created_at', { ascending: false });

    const answers = data?.map(d => (d as any).answer).filter(Boolean) as UserPromptAnswer[];
    return { data: answers || null, error };
  },

  // Rastgele sorular getir (öneri için)
  getRandomPrompts: async (count: number = 5, excludeIds: string[] = []): Promise<ProfilePrompt[]> => {
    let query = supabase
      .from('profile_prompts')
      .select('*')
      .eq('is_active', true);

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data } = await query;

    if (!data) return [];

    // Rastgele karıştır ve ilk N tanesini al
    const shuffled = data.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },

  // Popüler sorular (en çok cevaplanan)
  getPopularPrompts: async (limit: number = 5): Promise<ProfilePrompt[]> => {
    // Cevap sayısına göre sırala
    const { data } = await supabase
      .from('user_prompt_answers')
      .select('prompt_id')
      .limit(1000);

    if (!data) return [];

    // Prompt ID'leri say
    const counts: Record<string, number> = {};
    data.forEach(d => {
      counts[d.prompt_id] = (counts[d.prompt_id] || 0) + 1;
    });

    // En popüler prompt ID'leri
    const sortedIds = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    if (sortedIds.length === 0) return [];

    // Prompt detaylarını getir
    const { data: prompts } = await supabase
      .from('profile_prompts')
      .select('*')
      .in('id', sortedIds);

    return prompts || [];
  },
};

export default promptService;
