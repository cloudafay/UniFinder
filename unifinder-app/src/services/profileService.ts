// Profil Servisi
// Kullanıcı profil işlemleri

import { supabase } from '../lib/supabase';
import { Profile, ProfileInsert, ProfileUpdate } from '../lib/database.types';
import emailValidation from '../utils/emailValidation';

// Rozet tipini e-postadan belirle
const determineBadgeInfo = (email: string): { 
  isVerifiedStudent: boolean; 
  badgeType: string | null;
  universityName: string | null;
} => {
  const result = emailValidation.validateEmail(email);
  
  if (result.isTurkishEdu) {
    return {
      isVerifiedStudent: true,
      badgeType: 'verified_student',
      universityName: result.universityName || null,
    };
  }
  
  if (result.isEduEmail) {
    return {
      isVerifiedStudent: false,
      badgeType: 'international_student',
      universityName: null,
    };
  }
  
  return {
    isVerifiedStudent: false,
    badgeType: null,
    universityName: null,
  };
};

export const profileService = {
  // Profil oluştur (rozet bilgisiyle)
  create: async (profile: ProfileInsert) => {
    // Email'den rozet bilgisini belirle
    const badgeInfo = profile.email ? determineBadgeInfo(profile.email) : {
      isVerifiedStudent: false,
      badgeType: null,
      universityName: null,
    };

    const profileWithBadge = {
      ...profile,
      is_verified_student: badgeInfo.isVerifiedStudent,
      badge_type: badgeInfo.badgeType,
      university_name: badgeInfo.universityName,
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(profileWithBadge)
      .select()
      .single();
    return { data, error };
  },

  // Profil getir (ID ile)
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  // Kendi profilimi getir
  getMyProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Kullanıcı bulunamadı') };
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    return { data, error };
  },

  // Profil güncelle
  update: async (id: string, updates: ProfileUpdate) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Keşfet için profilleri getir (swipe edilmemişler)
  getDiscoverProfiles: async (userId: string, limit: number = 10) => {
    console.log('🔍 getDiscoverProfiles called for userId:', userId);
    
    // Daha önce swipe ettiğim kullanıcıları al
    const { data: swipedUsers } = await supabase
      .from('swipes')
      .select('swiped_id')
      .eq('swiper_id', userId);

    const swipedIds = swipedUsers?.map(s => s.swiped_id) || [];
    swipedIds.push(userId); // Kendimi de hariç tut
    
    console.log('🔍 Swiped IDs to exclude:', swipedIds);

    // Swipe edilmemiş profilleri getir - is_active kontrolü kaldırıldı (test için)
    let query = supabase
      .from('profiles')
      .select('*')
      .neq('id', userId); // Kendimi hariç tut

    // Eğer daha önce swipe edilmiş kullanıcılar varsa, onları da hariç tut
    if (swipedIds.length > 1) {
      query = query.not('id', 'in', `(${swipedIds.join(',')})`);
    }
    
    query = query.limit(limit);

    const { data, error } = await query;
    
    console.log('🔍 Discover profiles result:', { 
      count: data?.length || 0, 
      error: error?.message,
      profiles: data?.map(p => ({ id: p.id, name: p.full_name, photos: p.photos?.length || 0 }))
    });

    return { data, error };
  },

  // Avatar yükle
  uploadAvatar: async (userId: string, file: { uri: string; type: string; name: string }) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    // Dosyayı blob'a çevir
    const response = await fetch(file.uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, {
        contentType: file.type,
        upsert: true,
      });

    if (error) return { data: null, error };

    // Public URL al
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Profili güncelle
    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    return { data: publicUrl, error: null };
  },

  // Fotoğraf yükle (galeri için)
  uploadPhoto: async (userId: string, file: { uri: string; type: string; name: string }, index: number) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/photo_${index}.${fileExt}`;

    const response = await fetch(file.uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('photos')
      .upload(fileName, blob, {
        contentType: file.type,
        upsert: true,
      });

    if (error) return { data: null, error };

    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);

    return { data: publicUrl, error: null };
  },

  // Son görülme güncelle
  updateLastSeen: async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', userId);
    return { error };
  },
};

export default profileService;
