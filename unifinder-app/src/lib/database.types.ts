// Database Types
// Supabase tarafından otomatik oluşturulacak tipler
// Şimdilik manuel tanımlıyoruz, sonra Supabase CLI ile güncellenebilir

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Kullanıcı profilleri
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          university: string | null;
          department: string | null;
          year: string | null;
          birth_date: string | null;
          gender: 'male' | 'female' | 'other' | null;
          interests: string[] | null;
          photos: string[] | null;
          is_verified: boolean;
          is_active: boolean;
          last_seen: string | null;
          location: Json | null;
          // Student Badge System
          is_verified_student: boolean;
          university_name: string | null;
          badge_type: 'verified_student' | 'international_student' | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          university?: string | null;
          department?: string | null;
          year?: string | null;
          birth_date?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          interests?: string[] | null;
          photos?: string[] | null;
          is_verified?: boolean;
          is_active?: boolean;
          last_seen?: string | null;
          location?: Json | null;
          // Student Badge System
          is_verified_student?: boolean;
          university_name?: string | null;
          badge_type?: 'verified_student' | 'international_student' | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          university?: string | null;
          department?: string | null;
          year?: string | null;
          birth_date?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          interests?: string[] | null;
          photos?: string[] | null;
          is_verified?: boolean;
          is_active?: boolean;
          last_seen?: string | null;
          location?: Json | null;
          // Student Badge System
          is_verified_student?: boolean;
          university_name?: string | null;
          badge_type?: 'verified_student' | 'international_student' | null;
        };
      };

      // Swipe/Beğeni işlemleri
      swipes: {
        Row: {
          id: string;
          created_at: string;
          swiper_id: string;
          swiped_id: string;
          action: 'like' | 'nope' | 'superlike';
        };
        Insert: {
          id?: string;
          created_at?: string;
          swiper_id: string;
          swiped_id: string;
          action: 'like' | 'nope' | 'superlike';
        };
        Update: {
          id?: string;
          created_at?: string;
          swiper_id?: string;
          swiped_id?: string;
          action?: 'like' | 'nope' | 'superlike';
        };
      };

      // Eşleşmeler
      matches: {
        Row: {
          id: string;
          created_at: string;
          user1_id: string;
          user2_id: string;
          is_active: boolean;
          last_message_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user1_id: string;
          user2_id: string;
          is_active?: boolean;
          last_message_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user1_id?: string;
          user2_id?: string;
          is_active?: boolean;
          last_message_at?: string | null;
        };
      };

      // Mesajlar
      messages: {
        Row: {
          id: string;
          created_at: string;
          match_id: string;
          sender_id: string;
          content: string;
          message_type: 'text' | 'image' | 'gif';
          is_read: boolean;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          match_id: string;
          sender_id: string;
          content: string;
          message_type?: 'text' | 'image' | 'gif';
          is_read?: boolean;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          match_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: 'text' | 'image' | 'gif';
          is_read?: boolean;
          read_at?: string | null;
        };
      };

      // Bildirimler
      notifications: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          type: 'match' | 'message' | 'like' | 'superlike' | 'like_request' | 'system';
          title: string;
          body: string;
          data: Json | null;
          is_read: boolean;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          type: 'match' | 'message' | 'like' | 'superlike' | 'like_request' | 'system';
          title: string;
          body: string;
          data?: Json | null;
          is_read?: boolean;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          type?: 'match' | 'message' | 'like' | 'superlike' | 'like_request' | 'system';
          title?: string;
          body?: string;
          data?: Json | null;
          is_read?: boolean;
          read_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Kolay erişim için type alias'lar
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Swipe = Database['public']['Tables']['swipes']['Row'];
export type SwipeInsert = Database['public']['Tables']['swipes']['Insert'];

export type Match = Database['public']['Tables']['matches']['Row'];
export type MatchInsert = Database['public']['Tables']['matches']['Insert'];

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
