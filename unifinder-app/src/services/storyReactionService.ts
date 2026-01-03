/**
 * Hikaye Tepki Servisi
 * Hikaye emoji tepkileri yönetimi
 */

import { supabase } from '../lib/supabase';

// Desteklenen emoji listesi
export const STORY_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '🔥', '👏', '💯'] as const;
export type StoryEmoji = typeof STORY_EMOJIS[number];

export interface StoryReaction {
  id: string;
  story_id: string;
  reactor_id: string;
  emoji: string;
  created_at: string;
  reactor?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface ReactionCount {
  emoji: string;
  count: number;
}

// =============================================
// TEPKİ İŞLEMLERİ
// =============================================

/**
 * Hikayeye tepki ver
 */
export const addReaction = async (
  storyId: string,
  emoji: StoryEmoji
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Oturum bulunamadı' };
    }

    // Aynı tepki varsa kaldır (toggle)
    const { data: existing } = await supabase
      .from('story_reactions')
      .select('id')
      .eq('story_id', storyId)
      .eq('reactor_id', user.id)
      .eq('emoji', emoji)
      .single();

    if (existing) {
      await supabase
        .from('story_reactions')
        .delete()
        .eq('id', existing.id);
      return { success: true };
    }

    // Yeni tepki ekle
    const { error } = await supabase
      .from('story_reactions')
      .insert({
        story_id: storyId,
        reactor_id: user.id,
        emoji,
      });

    if (error) throw error;

    // Hikaye sahibine bildirim gönder
    const { data: story } = await supabase
      .from('stories')
      .select('user_id')
      .eq('id', storyId)
      .single();

    if (story && story.user_id !== user.id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: story.user_id,
          type: 'like',
          title: 'Hikayene Tepki',
          body: `Birisi hikayene ${emoji} tepkisi verdi`,
          data: { story_id: storyId, emoji, reactor_id: user.id },
        });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Tepki ekleme hatası:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Tepkiyi kaldır
 */
export const removeReaction = async (
  storyId: string,
  emoji: StoryEmoji
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Oturum bulunamadı' };
    }

    const { error } = await supabase
      .from('story_reactions')
      .delete()
      .eq('story_id', storyId)
      .eq('reactor_id', user.id)
      .eq('emoji', emoji);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Tepki kaldırma hatası:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Hikayenin tüm tepkilerini getir
 */
export const getStoryReactions = async (storyId: string): Promise<StoryReaction[]> => {
  try {
    const { data, error } = await supabase
      .from('story_reactions')
      .select(`
        id,
        story_id,
        reactor_id,
        emoji,
        created_at,
        reactor:profiles!story_reactions_reactor_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('story_id', storyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to match StoryReaction type (reactor is returned as array from join)
    const reactions: StoryReaction[] = (data || []).map((item: any) => ({
      id: item.id,
      story_id: item.story_id,
      reactor_id: item.reactor_id,
      emoji: item.emoji,
      created_at: item.created_at,
      reactor: Array.isArray(item.reactor) && item.reactor.length > 0
        ? item.reactor[0]
        : item.reactor,
    }));

    return reactions;
  } catch (error) {
    console.error('Tepki getirme hatası:', error);
    return [];
  }
};

/**
 * Hikayenin tepki sayılarını getir
 */
export const getReactionCounts = async (storyId: string): Promise<ReactionCount[]> => {
  try {
    const { data, error } = await supabase
      .from('story_reactions')
      .select('emoji')
      .eq('story_id', storyId);

    if (error) throw error;

    // Grupla ve say
    const counts: { [key: string]: number } = {};
    (data || []).forEach(r => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Tepki sayısı hatası:', error);
    return [];
  }
};

/**
 * Kullanıcının bu hikayeye verdiği tepkileri getir
 */
export const getUserReactions = async (storyId: string): Promise<string[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('story_reactions')
      .select('emoji')
      .eq('story_id', storyId)
      .eq('reactor_id', user.id);

    if (error) throw error;
    return (data || []).map(r => r.emoji);
  } catch (error) {
    return [];
  }
};

export default {
  STORY_EMOJIS,
  addReaction,
  removeReaction,
  getStoryReactions,
  getReactionCounts,
  getUserReactions,
};

