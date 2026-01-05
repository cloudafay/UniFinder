// Supabase Client Configuration
// Ana Supabase bağlantı dosyası

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Debug: API key kontrolü
console.log('🔑 Supabase URL:', supabaseUrl);
console.log('🔑 Supabase Key uzunluğu:', supabaseAnonKey?.length || 0);
console.log('🔑 Supabase Key başlangıcı:', supabaseAnonKey?.substring(0, 20) || 'YOK');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL ve Anon Key .env dosyasında tanımlanmalıdır!');
}

if (supabaseAnonKey && supabaseAnonKey.length < 100) {
  console.error('❌ Supabase Anon Key çok kısa! Doğru key eyJ... ile başlamalı ve ~200+ karakter olmalı');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth helper fonksiyonları
export const auth = {
  // Email ile kayıt ol
  signUp: async (email: string, password: string, userData?: { fullName?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { data, error };
  },

  // Email ile giriş yap
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Çıkış yap
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Mevcut oturumu al
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },

  // Mevcut kullanıcıyı al
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },

  // Şifre sıfırlama emaili gönder
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  },

  // Auth durumu değişikliklerini dinle
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

export default supabase;
