// Verification Service
// Fotoğraf doğrulama sistemi

import { supabase } from '../lib/supabase';

export interface VerificationRequest {
  id: string;
  user_id: string;
  selfie_url: string;
  pose_type: 'smile' | 'thumbs_up' | 'peace_sign';
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  processed_at?: string;
}

export const POSE_INSTRUCTIONS: Record<string, { title: string; description: string; icon: string }> = {
  smile: {
    title: 'Gülümse',
    description: 'Kameraya bakarak doğal bir şekilde gülümse',
    icon: '😊',
  },
  thumbs_up: {
    title: 'Başparmak Yukarı',
    description: 'Yüzünün yanında başparmağını yukarı kaldır',
    icon: '👍',
  },
  peace_sign: {
    title: 'Barış İşareti',
    description: 'Yüzünün yanında barış işareti yap',
    icon: '✌️',
  },
};

export const verificationService = {
  // Doğrulama talebi oluştur
  requestVerification: async (
    userId: string,
    selfieUri: string,
    poseType: 'smile' | 'thumbs_up' | 'peace_sign'
  ): Promise<{ data: VerificationRequest | null; error: string | null }> => {
    try {
      // Selfie'yi storage'a yükle
      const fileName = `verification/${userId}/${Date.now()}.jpg`;
      
      // URI'den blob oluştur
      const response = await fetch(selfieUri);
      const blob = await response.blob();
      
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        return { data: null, error: 'Fotoğraf yüklenemedi' };
      }

      // Public URL al
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      // Doğrulama talebi oluştur
      const { data, error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: userId,
          selfie_url: urlData.publicUrl,
          pose_type: poseType,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: 'Bir hata oluştu' };
    }
  },

  // Doğrulama durumunu getir
  getVerificationStatus: async (userId: string): Promise<{ data: VerificationRequest | null; error: string | null }> => {
    const { data, error } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  // Doğrulama geçmişini getir
  getVerificationHistory: async (userId: string): Promise<{ data: VerificationRequest[] | null; error: string | null }> => {
    const { data, error } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  // Rastgele poz seç
  getRandomPose: (): 'smile' | 'thumbs_up' | 'peace_sign' => {
    const poses: ('smile' | 'thumbs_up' | 'peace_sign')[] = ['smile', 'thumbs_up', 'peace_sign'];
    return poses[Math.floor(Math.random() * poses.length)];
  },

  // Doğrulama talebini onayla (admin için)
  approveVerification: async (requestId: string): Promise<{ error: string | null }> => {
    // Talebi güncelle
    const { data: request, error: fetchError } = await supabase
      .from('verification_requests')
      .select('user_id')
      .eq('id', requestId)
      .single();

    if (fetchError) {
      return { error: fetchError.message };
    }

    // Talebi onayla
    const { error: updateError } = await supabase
      .from('verification_requests')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      return { error: updateError.message };
    }

    // Profili güncelle
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_photo_verified: true })
      .eq('id', request.user_id);

    return { error: profileError?.message || null };
  },

  // Doğrulama talebini reddet (admin için)
  rejectVerification: async (requestId: string, reason: string): Promise<{ error: string | null }> => {
    const { error } = await supabase
      .from('verification_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        processed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    return { error: error?.message || null };
  },

  // Kullanıcının doğrulanmış olup olmadığını kontrol et
  isUserVerified: async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_photo_verified')
      .eq('id', userId)
      .single();

    return data?.is_photo_verified === true;
  },

  // Bekleyen talep var mı kontrol et
  hasPendingRequest: async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('verification_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .limit(1)
      .single();

    return !!data;
  },
};

export default verificationService;
