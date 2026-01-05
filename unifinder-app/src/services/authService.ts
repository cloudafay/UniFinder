// Auth Service
// Kimlik doğrulama servisi - Supabase entegrasyonu

import { supabase, auth } from '../lib/supabase';
import { profileService } from './profileService';

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: any;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName?: string;
  department?: string;
  classYear?: string;
  bio?: string;
  interests?: string[];
  photos?: string[];
}

export interface RegisterResult {
  success: boolean;
  error?: string;
  needsEmailVerification?: boolean;
  email?: string;
}

export const authService = {
  /**
   * E-posta ve şifre ile giriş yap
   */
  login: async (email: string, password: string): Promise<LoginResult> => {
    try {
      // Input validation
      if (!email || !email.trim()) {
        return { success: false, error: 'E-posta adresi gerekli' };
      }
      if (!password) {
        return { success: false, error: 'Şifre gerekli' };
      }

      const { data, error } = await auth.signIn(email.trim().toLowerCase(), password);

      if (error) {
        // Supabase hata mesajlarını Türkçeleştir
        let errorMessage = 'Giriş başarısız';

        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'E-posta veya şifre hatalı';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'E-posta adresinizi doğrulamanız gerekiyor';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Çok fazla deneme yaptınız. Lütfen bekleyin.';
        }

        return { success: false, error: errorMessage };
      }

      return { success: true, user: data.user };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' };
    }
  },

  /**
   * Yeni kullanıcı kaydı
   */
  register: async (data: RegisterData): Promise<RegisterResult> => {
    try {
      // Input validation
      if (!data.email || !data.email.trim()) {
        return { success: false, error: 'E-posta adresi gerekli' };
      }
      if (!data.password || data.password.length < 6) {
        return { success: false, error: 'Şifre en az 6 karakter olmalı' };
      }

      const email = data.email.trim().toLowerCase();

      // Supabase Auth ile kayıt
      const { data: authData, error: authError } = await auth.signUp(
        email,
        data.password,
        { fullName: data.fullName }
      );

      if (authError) {
        let errorMessage = 'Kayıt başarısız';

        if (authError.message.includes('already registered')) {
          errorMessage = 'Bu e-posta adresi zaten kayıtlı';
        } else if (authError.message.includes('invalid email')) {
          errorMessage = 'Geçersiz e-posta adresi';
        } else if (authError.message.includes('weak password')) {
          errorMessage = 'Şifre çok zayıf. Daha güçlü bir şifre seçin.';
        }

        return { success: false, error: errorMessage };
      }

      // Kullanıcı oluşturulduysa profil oluştur
      if (authData.user) {
        const { error: profileError } = await profileService.create({
          id: authData.user.id,
          email: email,
          full_name: data.fullName || null,
          department: data.department || null,
          year: data.classYear || null,
          bio: data.bio || null,
          interests: data.interests || [],
          photos: data.photos || [],
          avatar_url: null, // Avatar ve vitrin fotoğrafları ayrı - kayıt sırasında avatar boş
          is_active: true,
          is_verified: false,
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Profil oluşturulamasa bile auth başarılı
        }
      }

      // E-posta doğrulama gerekiyor mu kontrol et
      const needsVerification = !authData.session;

      return {
        success: true,
        needsEmailVerification: needsVerification,
        email: email,
      };
    } catch (error: any) {
      console.error('Register error:', error);
      return { success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' };
    }
  },

  /**
   * Çıkış yap
   */
  logout: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await auth.signOut();

      if (error) {
        return { success: false, error: 'Çıkış yapılamadı' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Logout error:', error);
      return { success: false, error: 'Bir hata oluştu' };
    }
  },

  /**
   * Şifre sıfırlama e-postası gönder
   */
  forgotPassword: async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!email || !email.trim()) {
        return { success: false, error: 'E-posta adresi gerekli' };
      }

      const { error } = await auth.resetPassword(email.trim().toLowerCase());

      if (error) {
        return { success: false, error: 'Şifre sıfırlama e-postası gönderilemedi' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      return { success: false, error: 'Bir hata oluştu' };
    }
  },

  /**
   * E-posta doğrulama e-postasını yeniden gönder
   */
  resendVerificationEmail: async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!email || !email.trim()) {
        return { success: false, error: 'E-posta adresi gerekli' };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });

      if (error) {
        return { success: false, error: 'Doğrulama e-postası gönderilemedi' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Resend verification error:', error);
      return { success: false, error: 'Bir hata oluştu' };
    }
  },

  /**
   * Mevcut oturumu kontrol et
   */
  getSession: async () => {
    try {
      const { data, error } = await auth.getSession();
      return { session: data.session, error };
    } catch (error: any) {
      console.error('Get session error:', error);
      return { session: null, error };
    }
  },

  /**
   * Mevcut kullanıcıyı al
   */
  getCurrentUser: async () => {
    try {
      const { data, error } = await auth.getUser();
      return { user: data.user, error };
    } catch (error: any) {
      console.error('Get user error:', error);
      return { user: null, error };
    }
  },

  /**
   * Auth durumu değişikliklerini dinle
   */
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return auth.onAuthStateChange(callback);
  },
};

export default authService;
