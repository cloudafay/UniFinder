// Profilde Spotify/Müzik Bölümü Komponenti
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { spotifyService, SpotifyArtist, SpotifyProfile } from '../services/spotifyService';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SpotifySectionProps {
  userId: string;
  showCompatibility?: boolean;
  compact?: boolean;
}

const SpotifySection: React.FC<SpotifySectionProps> = ({
  userId,
  showCompatibility = false,
  compact = false,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [compatibility, setCompatibility] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    loadSpotifyData();
  }, [userId]);

  const loadSpotifyData = async () => {
    try {
      const { data } = await spotifyService.getProfile(userId);
      setProfile(data);

      // Uyumluluk hesapla (başka kullanıcının profilinde)
      if (showCompatibility && user?.id && user.id !== userId) {
        const compat = await spotifyService.calculateCompatibility(user.id, userId);
        setCompatibility(compat);
      }
    } catch (error) {
      console.error('Spotify veri yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="small" color="#1ed760" />
      </View>
    );
  }

  // Bağlı değilse ve kendi profiliyse bağlantı öner
  if (!profile?.connected && isOwnProfile) {
    return (
      <TouchableOpacity
        style={[styles.connectCard, { backgroundColor: colors.surface }]}
        onPress={() => navigation.navigate('SpotifyConnect')}
      >
        <LinearGradient
          colors={['#1ed760', '#1db954']}
          style={styles.spotifyIconBg}
        >
          <MaterialCommunityIcons name="spotify" size={24} color="#fff" />
        </LinearGradient>
        <View style={styles.connectContent}>
          <Text style={[styles.connectTitle, { color: colors.textPrimary }]}>
            Spotify'ı Bağla
          </Text>
          <Text style={[styles.connectSubtitle, { color: colors.textSecondary }]}>
            Müzik zevkini paylaş, uyumlu eşleşmeler bul
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  }

  // Bağlı değilse ve başkasının profiliyse gösterme
  if (!profile?.connected) {
    return null;
  }

  // Compact görünüm (profil kartında)
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <MaterialCommunityIcons name="spotify" size={16} color="#1ed760" />
          <Text style={[styles.compactTitle, { color: colors.textSecondary }]}>
            Müzik Zevki
          </Text>
          {compatibility !== null && compatibility > 0 && (
            <View style={styles.compatBadge}>
              <Text style={styles.compatText}>{compatibility}% uyum</Text>
            </View>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactArtists}
        >
          {profile.top_artists.slice(0, 5).map((artist) => (
            <View key={artist.id} style={styles.compactArtist}>
              {artist.image_url ? (
                <Image source={{ uri: artist.image_url }} style={styles.compactArtistImage} />
              ) : (
                <View style={[styles.compactArtistPlaceholder, { backgroundColor: colors.background }]}>
                  <MaterialIcons name="person" size={16} color={colors.textSecondary} />
                </View>
              )}
              <Text
                style={[styles.compactArtistName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {artist.name}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Tam görünüm
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#1ed760', '#1db954']}
            style={styles.spotifyIconSmall}
          >
            <MaterialCommunityIcons name="spotify" size={18} color="#fff" />
          </LinearGradient>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Müzik Zevki
          </Text>
        </View>
        
        {compatibility !== null && compatibility > 0 && (
          <View style={[styles.compatibilityBadge, getCompatibilityStyle(compatibility)]}>
            <MaterialIcons name="favorite" size={14} color="#fff" />
            <Text style={styles.compatibilityText}>{compatibility}%</Text>
          </View>
        )}
      </View>

      {/* Uyumluluk açıklaması */}
      {compatibility !== null && compatibility > 0 && (
        <Text style={[styles.compatDescription, { color: colors.textSecondary }]}>
          {getCompatibilityMessage(compatibility)}
        </Text>
      )}

      {/* Top Artists */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        En Çok Dinlenen Sanatçılar
      </Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.artistsScroll}
      >
        {profile.top_artists.map((artist, index) => (
          <View key={artist.id} style={styles.artistItem}>
            <View style={styles.artistRank}>
              <Text style={styles.artistRankText}>{index + 1}</Text>
            </View>
            {artist.image_url ? (
              <Image source={{ uri: artist.image_url }} style={styles.artistImage} />
            ) : (
              <View style={[styles.artistPlaceholder, { backgroundColor: colors.background }]}>
                <MaterialIcons name="person" size={24} color={colors.textSecondary} />
              </View>
            )}
            <Text
              style={[styles.artistName, { color: colors.textPrimary }]}
              numberOfLines={2}
            >
              {artist.name}
            </Text>
            {artist.genres.length > 0 && (
              <Text
                style={[styles.artistGenre, { color: colors.textTertiary }]}
                numberOfLines={1}
              >
                {artist.genres[0]}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Currently Playing (varsa) */}
      {profile.currently_playing && (
        <View style={[styles.nowPlaying, { backgroundColor: isDark ? 'rgba(30, 215, 96, 0.1)' : 'rgba(30, 215, 96, 0.08)' }]}>
          <View style={styles.nowPlayingDot} />
          <Text style={[styles.nowPlayingLabel, { color: '#1ed760' }]}>
            Şu an dinliyor
          </Text>
          <Text style={[styles.nowPlayingTrack, { color: colors.textPrimary }]} numberOfLines={1}>
            {profile.currently_playing.name} - {profile.currently_playing.artist}
          </Text>
        </View>
      )}
    </View>
  );
};

// Uyumluluk stilini belirle
const getCompatibilityStyle = (compat: number) => {
  if (compat >= 70) return { backgroundColor: '#22c55e' };
  if (compat >= 40) return { backgroundColor: '#f59e0b' };
  return { backgroundColor: '#6366f1' };
};

// Uyumluluk mesajı
const getCompatibilityMessage = (compat: number): string => {
  if (compat >= 80) return '🎵 Mükemmel müzik uyumu! Aynı şarkıları seviyorsunuz';
  if (compat >= 60) return '🎶 Harika uyum! Ortak müzik zevkiniz var';
  if (compat >= 40) return '🎸 İyi uyum! Bazı ortak sanatçılarınız var';
  if (compat >= 20) return '🎹 Farklı zevkler, yeni keşifler!';
  return '🎧 Birbirinize yeni müzikler öğretebilirsiniz';
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  spotifyIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  compatibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  compatibilityText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  compatDescription: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  artistsScroll: {
    gap: 12,
  },
  artistItem: {
    alignItems: 'center',
    width: 80,
  },
  artistRank: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1ed760',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  artistRankText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  artistImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  artistPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  artistName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  artistGenre: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  nowPlaying: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
  },
  nowPlayingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1ed760',
  },
  nowPlayingLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  nowPlayingTrack: {
    flex: 1,
    fontSize: 13,
  },
  // Connect card
  connectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  spotifyIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectContent: {
    flex: 1,
  },
  connectTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  connectSubtitle: {
    fontSize: 13,
  },
  // Compact styles
  compactContainer: {
    gap: 8,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  compatBadge: {
    backgroundColor: '#1ed760',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  compatText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  compactArtists: {
    gap: 8,
  },
  compactArtist: {
    alignItems: 'center',
    width: 56,
  },
  compactArtistImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  compactArtistPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  compactArtistName: {
    fontSize: 10,
    textAlign: 'center',
  },
});

export default SpotifySection;
