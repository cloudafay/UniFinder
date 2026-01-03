// Hikaye Servisi
// Instagram/WhatsApp benzeri hikaye yönetimi

import { supabase } from '../lib/supabase';

export interface Story {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
  view_count: number;
  is_active: boolean;
  // Join ile gelen kullanıcı bilgileri
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface StoryView {
  id: string;
  story_id: string;
  viewer_id: string;
  viewed_at: string;
  // Join ile gelen viewer bilgileri
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export const storyService = {
  // Tüm aktif hikayeleri getir (ana sayfada gösterilecek)
  async getActiveStories(): Promise<{ data: Story[] | null; error: any }> {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Belirli kullanıcının hikayelerini getir
  async getUserStories(userId: string): Promise<{ data: Story[] | null; error: any }> {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Kullanıcının kendi hikayelerini getir (süresi dolmuş olanlar dahil)
  async getMyStories(userId: string): Promise<{ data: Story[] | null; error: any }> {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    return { data, error };
  },

  // Yeni hikaye oluştur
  async createStory(story: {
    user_id: string;
    image_url: string;
    caption?: string;
    expires_at: string;
  }): Promise<{ data: Story | null; error: any }> {
    const { data, error } = await supabase
      .from('stories')
      .insert({
        user_id: story.user_id,
        image_url: story.image_url,
        caption: story.caption || null,
        expires_at: story.expires_at,
      })
      .select()
      .single();

    return { data, error };
  },

  // Hikayeyi sil
  async deleteStory(storyId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId);

    return { error };
  },

  // Hikayeyi görüntüle ve kaydet
  async viewStory(storyId: string, viewerId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('story_views')
      .upsert({
        story_id: storyId,
        viewer_id: viewerId,
      }, {
        onConflict: 'story_id,viewer_id',
        ignoreDuplicates: true,
      });

    return { error };
  },

  // Hikayeyi kimlerin görüntülediğini getir
  async getStoryViews(storyId: string): Promise<{ data: StoryView[] | null; error: any }> {
    const { data, error } = await supabase
      .from('story_views')
      .select(`
        *,
        profiles:viewer_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('story_id', storyId)
      .order('viewed_at', { ascending: false });

    return { data, error };
  },

  // Kullanıcının görüntülediği hikaye ID'lerini getir
  async getViewedStoryIds(viewerId: string): Promise<{ data: string[] | null; error: any }> {
    const { data, error } = await supabase
      .from('story_views')
      .select('story_id')
      .eq('viewer_id', viewerId);

    if (error) return { data: null, error };
    
    return { 
      data: data?.map(v => v.story_id) || [], 
      error: null 
    };
  },

  // Hikaye fotoğrafını storage'a yükle
  async uploadStoryImage(userId: string, imageUri: string): Promise<{ url: string | null; error: any }> {
    try {
      const fileName = `${userId}/story_${Date.now()}.jpg`;
      
      // Web için base64'ten blob'a çevir
      let imageBlob: Blob;
      if (imageUri.startsWith('data:')) {
        const response = await fetch(imageUri);
        imageBlob = await response.blob();
      } else {
        const response = await fetch(imageUri);
        imageBlob = await response.blob();
      }

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, imageBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        return { url: null, error: uploadError };
      }

      const { data: publicUrlData } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

      return { url: publicUrlData.publicUrl, error: null };
    } catch (error) {
      return { url: null, error };
    }
  },

  // Hikaye fotoğrafını storage'dan sil
  async deleteStoryImage(imageUrl: string): Promise<{ error: any }> {
    try {
      // URL'den dosya yolunu çıkar
      const urlParts = imageUrl.split('/stories/');
      if (urlParts.length < 2) return { error: null };
      
      const filePath = urlParts[1];
      
      const { error } = await supabase.storage
        .from('stories')
        .remove([filePath]);

      return { error };
    } catch (error) {
      return { error };
    }
  },

  // Hikayesi olan kullanıcıları grupla (ana sayfada hikaye çemberleri için)
  async getStoriesGroupedByUser(): Promise<{ 
    data: { userId: string; userName: string; userAvatar: string | null; stories: Story[]; hasUnviewed: boolean }[] | null; 
    error: any 
  }> {
    const { data: stories, error } = await this.getActiveStories();
    
    if (error || !stories) return { data: null, error };

    // Kullanıcıya göre grupla
    const groupedMap = new Map<string, {
      userId: string;
      userName: string;
      userAvatar: string | null;
      stories: Story[];
      hasUnviewed: boolean;
    }>();

    stories.forEach(story => {
      const userId = story.user_id;
      if (!groupedMap.has(userId)) {
        groupedMap.set(userId, {
          userId,
          userName: story.profiles?.full_name || 'Kullanıcı',
          userAvatar: story.profiles?.avatar_url || null,
          stories: [],
          hasUnviewed: false, // Bu, görüntüleme kontrolü ile güncellenecek
        });
      }
      groupedMap.get(userId)!.stories.push(story);
    });

    return { data: Array.from(groupedMap.values()), error: null };
  },
};

export default storyService;

