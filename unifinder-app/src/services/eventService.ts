// Event Service
// Etkinlik oluşturma ve yönetim işlemleri

import { supabase } from '../lib/supabase';
import { Profile } from '../lib/database.types';

// Tipler
export interface Event {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  category: 'party' | 'study' | 'sports' | 'social' | 'cultural' | 'other';
  event_date: string;
  end_date: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  max_participants: number;
  cover_image: string | null;
  is_public: boolean;
  status: 'active' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  creator?: Profile;
  // Alias properties for screen compatibility
  image_url?: string | null;      // Alias for cover_image
  capacity?: number;               // Alias for max_participants
  location_name?: string;          // Alias for location
  participant_count?: number;      // Computed field from participants
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: 'going' | 'interested' | 'waitlist';
  joined_at: string;
  profile?: Profile;
}

export interface EventFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  nearLocation?: { latitude: number; longitude: number; radiusKm: number };
  searchQuery?: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  category: Event['category'];
  event_date: string;
  end_date?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  max_participants: number;
  cover_image?: string;
  is_public?: boolean;
}

// Kategori bilgileri
export const EVENT_CATEGORIES = {
  party: { label: 'Parti', icon: '🎉', color: '#ec4899' },
  study: { label: 'Çalışma', icon: '📚', color: '#3b82f6' },
  sports: { label: 'Spor', icon: '⚽', color: '#22c55e' },
  social: { label: 'Sosyal', icon: '👥', color: '#f59e0b' },
  cultural: { label: 'Kültürel', icon: '🎭', color: '#8b5cf6' },
  other: { label: 'Diğer', icon: '✨', color: '#6b7280' },
};

export const eventService = {
  // Etkinlik oluştur
  createEvent: async (creatorId: string, data: CreateEventData): Promise<{ data: Event | null; error: any }> => {
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        creator_id: creatorId,
        title: data.title,
        description: data.description || null,
        category: data.category,
        event_date: data.event_date,
        end_date: data.end_date || null,
        location: data.location,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        max_participants: data.max_participants,
        cover_image: data.cover_image || null,
        is_public: data.is_public ?? true,
        status: 'active',
      })
      .select()
      .single();

    return { data: event, error };
  },

  // Etkinlikleri listele - tüm etkinlikler (gizli olanlar da dahil)
  getEvents: async (filters?: EventFilters): Promise<{ data: Event[] | null; error: any }> => {
    let query = supabase
      .from('events')
      .select(`
        *,
        creator:profiles!events_creator_id_fkey(id, full_name, avatar_url)
      `)
      .eq('status', 'active')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true });

    // Filtreler
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.startDate) {
      query = query.gte('event_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('event_date', filters.endDate);
    }

    if (filters?.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
    }

    const { data, error } = await query;

    return { data, error };
  },

  // Tek etkinlik getir
  getEventById: async (eventId: string): Promise<{ data: Event | null; error: any }> => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        creator:profiles!events_creator_id_fkey(id, full_name, avatar_url, department)
      `)
      .eq('id', eventId)
      .single();

    return { data, error };
  },

  // Kullanıcının etkinliklerini getir
  getUserEvents: async (userId: string): Promise<{ data: Event[] | null; error: any }> => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('creator_id', userId)
      .order('event_date', { ascending: true });

    return { data, error };
  },

  // Katıldığım etkinlikler
  getJoinedEvents: async (userId: string): Promise<{ data: Event[] | null; error: any }> => {
    const { data, error } = await supabase
      .from('event_participants')
      .select(`
        event:events(
          *,
          creator:profiles!events_creator_id_fkey(id, full_name, avatar_url)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'going');

    const events = data?.map(d => (d as any).event).filter(Boolean) as Event[];
    return { data: events || null, error };
  },

  // Etkinliğe katıl
  joinEvent: async (eventId: string, userId: string, status: 'going' | 'interested' = 'going'): Promise<{ error: any }> => {
    // Kapasite kontrolü
    const { data: event } = await supabase
      .from('events')
      .select('max_participants')
      .eq('id', eventId)
      .single();

    // Mevcut katılımcı sayısını al
    const { count } = await supabase
      .from('event_participants')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'going');

    if (event && count !== null && count >= event.max_participants && status === 'going') {
      // Bekleme listesine ekle
      status = 'waitlist' as any;
    }

    const { error } = await supabase
      .from('event_participants')
      .upsert({
        event_id: eventId,
        user_id: userId,
        status,
      }, {
        onConflict: 'event_id,user_id',
      });

    return { error };
  },

  // Etkinlikten ayrıl
  leaveEvent: async (eventId: string, userId: string): Promise<{ error: any }> => {
    const { error } = await supabase
      .from('event_participants')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    return { error };
  },

  // Katılımcıları getir
  getParticipants: async (eventId: string): Promise<{ data: EventParticipant[] | null; error: any }> => {
    const { data, error } = await supabase
      .from('event_participants')
      .select(`
        *,
        profile:profiles(id, full_name, avatar_url, department)
      `)
      .eq('event_id', eventId)
      .order('joined_at', { ascending: true });

    return { data, error };
  },

  // Katılım durumunu kontrol et
  getParticipationStatus: async (eventId: string, userId: string): Promise<'going' | 'interested' | 'waitlist' | null> => {
    const { data, error } = await supabase
      .from('event_participants')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return data.status as any;
  },

  // Etkinliği güncelle
  updateEvent: async (eventId: string, creatorId: string, updates: Partial<CreateEventData>): Promise<{ error: any }> => {
    const { error } = await supabase
      .from('events')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .eq('creator_id', creatorId);

    return { error };
  },

  // Etkinliği iptal et
  cancelEvent: async (eventId: string, creatorId: string): Promise<{ error: any }> => {
    const { error } = await supabase
      .from('events')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .eq('creator_id', creatorId);

    return { error };
  },

  // Etkinliği sil
  deleteEvent: async (eventId: string, creatorId: string): Promise<{ error: any }> => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('creator_id', creatorId);

    return { error };
  },

  // Yaklaşan etkinlikler (hatırlatma için)
  getUpcomingEvents: async (userId: string, hoursAhead: number = 24): Promise<Event[]> => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const { data } = await supabase
      .from('event_participants')
      .select(`
        event:events(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'going');

    const events = data?.map(d => (d as any).event).filter(Boolean) as Event[];

    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate >= now && eventDate <= futureDate;
    });
  },
};

export default eventService;
