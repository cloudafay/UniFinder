// Spotify Bağlantı Ekranı
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { spotifyService, SpotifyArtist, SpotifyProfile } from '../../services/spotifyService';

const SpotifyConnectScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [spotifyProfile, setSpotifyProfile] = useState<SpotifyProfile | null>(null);

  const loadSpotifyProfile = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await spotifyService.getProfile(user.id);
      if (data) {
        setSpotifyProfile(data);
      }
    } catch (error) {
      console.error('Spotify profil yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSpotifyProfile();
  }, [loadSpotifyProfile]);

  const handleConnect = async () => {
    if (!user?.id) return;
    
    setIsConnecting(true);
    try {
      const { success, error } = await spotifyService.connect(user.id);
      
      if (success) {
        Alert.alert('Başarılı', 'Spotify hesabın bağlandı!');
        loadSpotifyProfile();
      } else {
        Alert.alert('Hata', error || 'Bağlantı başarısız');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir sorun oluştu');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Bağlantıyı Kes',
      'Spotify hesabının bağlantısını kesmek istediğine emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kes',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            await spotifyService.disconnect(user.id);
            setSpotifyProfile({ connected: false, top_artists: [] });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Spotify</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Spotify Card */}
        <LinearGradient
          colors={['#1DB954', '#191414']}
          style={styles.spotifyCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.spotifyLogo}>
            <MaterialIcons name="music-note" size={40} color="#fff" />
          </View>
          
          {spotifyProfile?.connected ? (
            <>
              <Text style={styles.connectedTitle}>Bağlı ✓</Text>
              <Text style={styles.connectedSubtitle}>
                {spotifyProfile.display_name || 'Spotify Hesabı'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.spotifyTitle}>Spotify'ı Bağla</Text>
              <Text style={styles.spotifySubtitle}>
                Müzik zevkini paylaş ve uyumlu kişileri bul
              </Text>
            </>
          )}
        </LinearGradient>

        {/* Connected State */}
        {spotifyProfile?.connected ? (
          <>
            {/* Top Artists */}
            {spotifyProfile.top_artists.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  En Çok Dinlediklerin
                </Text>
                <View style={styles.artistsGrid}>
                  {spotifyProfile.top_artists.map((artist, index) => (
                    <View key={artist.id} style={[styles.artistCard, { backgroundColor: colors.surface }]}>
                      <View style={styles.artistRank}>
                        <Text style={styles.artistRankText}>#{index + 1}</Text>
                      </View>
                      {artist.image_url ? (
                        <Image source={{ uri: artist.image_url }} style={styles.artistImage} />
                      ) : (
                        <View style={[styles.artistImagePlaceholder, { backgroundColor: '#1DB95420' }]}>
                          <MaterialIcons name="person" size={24} color="#1DB954" />
                        </View>
                      )}
                      <Text style={[styles.artistName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {artist.name}
                      </Text>
                      {artist.genres.length > 0 && (
                        <Text style={[styles.artistGenre, { color: colors.textTertiary }]} numberOfLines={1}>
                          {artist.genres[0]}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Benefits */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Avantajlar
              </Text>
              {[
                { icon: 'favorite', text: 'Müzik uyumluluğu göster' },
                { icon: 'people', text: 'Benzer zevklere sahip kişileri bul' },
                { icon: 'chat', text: 'Sohbet başlatıcı olarak kullan' },
              ].map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={[styles.benefitIcon, { backgroundColor: '#1DB95420' }]}>
                    <MaterialIcons name={benefit.icon as any} size={20} color="#1DB954" />
                  </View>
                  <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                    {benefit.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Disconnect Button */}
            <TouchableOpacity
              style={[styles.disconnectButton, { borderColor: '#ef4444' }]}
              onPress={handleDisconnect}
            >
              <MaterialIcons name="link-off" size={20} color="#ef4444" />
              <Text style={styles.disconnectButtonText}>Bağlantıyı Kes</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Benefits */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Neden Bağlamalısın?
              </Text>
              {[
                { icon: 'music-note', text: 'En çok dinlediğin sanatçıları göster' },
                { icon: 'favorite', text: 'Müzik uyumluluğu hesapla' },
                { icon: 'people', text: 'Benzer müzik zevkine sahip kişileri bul' },
                { icon: 'chat', text: 'Ortak sanatçılarla sohbet başlat' },
              ].map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={[styles.benefitIcon, { backgroundColor: '#1DB95420' }]}>
                    <MaterialIcons name={benefit.icon as any} size={20} color="#1DB954" />
                  </View>
                  <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                    {benefit.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Connect Button */}
            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="link" size={24} color="#fff" />
                  <Text style={styles.connectButtonText}>Spotify'ı Bağla</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Privacy Note */}
            <Text style={[styles.privacyNote, { color: colors.textTertiary }]}>
              Sadece en çok dinlediğin sanatçılar paylaşılır. Şarkı geçmişin veya çalma listelerine erişim sağlanmaz.
            </Text>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 16 },
  spotifyCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  spotifyLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  spotifyTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
  spotifySubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 8, textAlign: 'center' },
  connectedTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
  connectedSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  artistsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  artistCard: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  artistRank: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#1DB954',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  artistRankText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  artistImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  artistImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  artistName: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  artistGenre: { fontSize: 10, marginTop: 2, textAlign: 'center' },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitText: { fontSize: 15, flex: 1 },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1DB954',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  connectButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  disconnectButtonText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
  privacyNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});

export default SpotifyConnectScreen;
