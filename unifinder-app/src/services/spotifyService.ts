// Spotify Service
// Spotify entegrasyonu ve müzik uyumluluğu

import { supabase } from '../lib/supabase';
import { Linking, Platform } from 'react-native';

// Not: expo-auth-session ve expo-web-browser kurulumu gerekli
// npx expo install expo-auth-session expo-web-browser

export interface SpotifyArtist {
  id: string;
  name: string;
  image_url?: string;
  genres: string[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album_art?: string;
}

export interface SpotifyProfile {
  connected: boolean;
  display_name?: string;
  top_artists: SpotifyArtist[];
  currently_playing?: SpotifyTrack;
}

// Spotify API endpoints
const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Scopes needed
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-currently-playing',
].join(' ');

export const spotifyService = {
  // OAuth bağlantısı başlat
  connect: async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Not: Tam OAuth flow için expo-auth-session kurulumu gerekli
      // npx expo install expo-auth-session expo-web-browser
      
      const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
      
      if (!clientId) {
        return { success: false, error: 'Spotify yapılandırması eksik' };
      }

      const redirectUri = 'unifinder://spotify-callback';

      const authUrl = `${SPOTIFY_AUTH_ENDPOINT}?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(SCOPES)}`;

      // Tarayıcıda aç
      const canOpen = await Linking.canOpenURL(authUrl);
      if (canOpen) {
        await Linking.openURL(authUrl);
        return { success: true };
      }

      return { success: false, error: 'Tarayıcı açılamadı' };
    } catch (error) {
      console.error('Spotify bağlantı hatası:', error);
      return { success: false, error: 'Bağlantı başarısız' };
    }
  },

  // Authorization code'u token'a çevir
  exchangeCodeForToken: async (
    userId: string, 
    code: string, 
    redirectUri: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return { success: false, error: 'Spotify yapılandırması eksik' };
      }

      const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }).toString(),
      });

      const data = await response.json();

      if (data.access_token) {
        // Token'ları veritabanına kaydet
        const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
        
        // Spotify profil bilgisini al
        const profileResponse = await fetch(`${SPOTIFY_API_BASE}/me`, {
          headers: { 'Authorization': `Bearer ${data.access_token}` },
        });
        const spotifyProfile = await profileResponse.json();

        await supabase
          .from('spotify_connections')
          .upsert({
            user_id: userId,
            spotify_id: spotifyProfile.id,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            token_expires_at: expiresAt,
            display_name: spotifyProfile.display_name,
          }, {
            onConflict: 'user_id',
          });

        // Profili güncelle
        await supabase
          .from('profiles')
          .update({ spotify_connected: true })
          .eq('id', userId);

        // Top artists'i çek ve kaydet
        await spotifyService.fetchAndSaveTopArtists(userId, data.access_token);

        return { success: true };
      }

      return { success: false, error: 'Token alınamadı' };
    } catch (error) {
      console.error('Token exchange hatası:', error);
      return { success: false, error: 'Token alınamadı' };
    }
  },

  // Bağlantıyı kes
  disconnect: async (userId: string): Promise<{ error: string | null }> => {
    // Spotify bağlantısını sil
    await supabase
      .from('spotify_connections')
      .delete()
      .eq('user_id', userId);

    // Top artists'i sil
    await supabase
      .from('user_top_artists')
      .delete()
      .eq('user_id', userId);

    // Profili güncelle
    const { error } = await supabase
      .from('profiles')
      .update({ spotify_connected: false })
      .eq('id', userId);

    return { error: error?.message || null };
  },

  // Bağlantı durumunu kontrol et
  isConnected: async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('spotify_connections')
      .select('id')
      .eq('user_id', userId)
      .single();

    return !!data;
  },

  // Top artists'i çek ve kaydet
  fetchAndSaveTopArtists: async (userId: string, accessToken: string): Promise<void> => {
    try {
      const response = await fetch(`${SPOTIFY_API_BASE}/me/top/artists?limit=10&time_range=medium_term`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      const data = await response.json();

      if (data.items) {
        // Mevcut kayıtları sil
        await supabase
          .from('user_top_artists')
          .delete()
          .eq('user_id', userId);

        // Yeni kayıtları ekle
        const artists = data.items.map((artist: any, index: number) => ({
          user_id: userId,
          artist_id: artist.id,
          artist_name: artist.name,
          image_url: artist.images?.[0]?.url,
          genres: artist.genres,
          rank: index + 1,
        }));

        await supabase
          .from('user_top_artists')
          .insert(artists);
      }
    } catch (error) {
      console.error('Top artists çekme hatası:', error);
    }
  },

  // Kullanıcının top artists'ini getir
  getTopArtists: async (userId: string): Promise<{ data: SpotifyArtist[] | null; error: string | null }> => {
    const { data, error } = await supabase
      .from('user_top_artists')
      .select('*')
      .eq('user_id', userId)
      .order('rank', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    const artists: SpotifyArtist[] = (data || []).map(a => ({
      id: a.artist_id,
      name: a.artist_name,
      image_url: a.image_url,
      genres: a.genres || [],
    }));

    return { data: artists, error: null };
  },

  // İki kullanıcı arasındaki müzik uyumluluğunu hesapla
  calculateCompatibility: async (userId1: string, userId2: string): Promise<number> => {
    const [artists1Result, artists2Result] = await Promise.all([
      spotifyService.getTopArtists(userId1),
      spotifyService.getTopArtists(userId2),
    ]);

    if (!artists1Result.data || !artists2Result.data) {
      return 0;
    }

    const artists1Ids = new Set(artists1Result.data.map(a => a.id));
    const artists2Ids = new Set(artists2Result.data.map(a => a.id));

    // Ortak sanatçı sayısı
    let commonArtists = 0;
    artists1Ids.forEach(id => {
      if (artists2Ids.has(id)) {
        commonArtists++;
      }
    });

    // Ortak türler
    const genres1 = new Set(artists1Result.data.flatMap(a => a.genres));
    const genres2 = new Set(artists2Result.data.flatMap(a => a.genres));
    
    let commonGenres = 0;
    genres1.forEach(genre => {
      if (genres2.has(genre)) {
        commonGenres++;
      }
    });

    // Uyumluluk skoru (0-100)
    const artistScore = (commonArtists / Math.max(artists1Ids.size, artists2Ids.size)) * 60;
    const genreScore = (commonGenres / Math.max(genres1.size, genres2.size)) * 40;

    return Math.round(artistScore + genreScore);
  },

  // Spotify profil bilgisini getir
  getProfile: async (userId: string): Promise<{ data: SpotifyProfile | null; error: string | null }> => {
    const { data: connection, error } = await supabase
      .from('spotify_connections')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !connection) {
      return { 
        data: { connected: false, top_artists: [] }, 
        error: null 
      };
    }

    const { data: artists } = await spotifyService.getTopArtists(userId);

    return {
      data: {
        connected: true,
        display_name: connection.display_name,
        top_artists: artists || [],
      },
      error: null,
    };
  },
};

export default spotifyService;
