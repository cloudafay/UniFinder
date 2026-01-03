// User Profile Screen
// Kullanıcı profili ekranı - Kendi profil görüntüleme ve düzenleme

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { storyService, Story } from '../../services/storyService';
import { getFollowStats, FollowStats } from '../../services/followService';
import { shareService } from '../../services/shareService';
import ProfileBadges from '../../components/ProfileBadges';
import SpotifySection from '../../components/SpotifySection';
import { getClassYearLabel } from '../../utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const PHOTO_WIDTH = 160;
const PHOTO_HEIGHT = 200;

// Placeholder için kullanılacak varsayılan değerler
const DEFAULT_VALUES = {
  photoLabels: ['Fotoğraf 1', 'Fotoğraf 2', 'Fotoğraf 3'],
  stats: {
    followers: 0,
    following: 0,
    matches: 0,
  },
};

const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isDark, colors, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [hasActiveStory, setHasActiveStory] = useState(false);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [stats, setStats] = useState<FollowStats>({
    followers: 0,
    following: 0,
    matches: 0,
  });

  // İstatistikleri yükle
  const loadStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const statsData = await getFollowStats(user.id);
      setStats(statsData);
    } catch (err) {
      console.error('İstatistik yükleme hatası:', err);
    }
  }, [user?.id]);

  // Hikayelerimi yükle
  const loadMyStories = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await storyService.getUserStories(user.id);
      if (!error && data) {
        setMyStories(data);
        setHasActiveStory(data.length > 0);
      }
    } catch (err) {
      console.error('Hikaye yükleme hatası:', err);
    }
  }, [user?.id]);

  // Sayfa odaklandığında yükle
  useFocusEffect(
    useCallback(() => {
      loadMyStories();
      loadStats();
    }, [loadMyStories, loadStats])
  );

  const handlePhotoPress = (photoUri: string, index: number) => {
    // Fotoğrafa tıklandığında tam ekran görüntüle (gelecekte modal olabilir)
    navigation.navigate('EditProfile' as never);
  };

  // Avatar'a tıklandığında hikaye görüntüle veya hikaye ekle
  const handleAvatarPress = () => {
    if (hasActiveStory && myStories.length > 0) {
      // Kendi hikayelerini görüntüle
      navigation.navigate('ViewStory', { storyId: myStories[0].id, userId: user?.id || '' });
    } else {
      // Hikaye ekle
      navigation.navigate('AddStory');
    }
  };

  const renderPhotoCard = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={[
        styles.photoCard,
        {
          width: PHOTO_WIDTH,
          height: PHOTO_HEIGHT,
          marginRight: 12,
        },
      ]}
      activeOpacity={0.9}
      onPress={() => handlePhotoPress(item, index)}
    >
      <Image
        source={{ uri: item }}
        style={styles.photoImage}
        resizeMode="cover"
      />
      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.photoGradient}
      />
      {/* Label */}
      <View style={styles.photoLabel}>
        <Text style={styles.photoLabelText}>
          {DEFAULT_VALUES.photoLabels[index] || `Fotoğraf ${index + 1}`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Ambient Background */}
      <View style={[styles.ambientContainer, { pointerEvents: 'none' as const }]}>
        <View style={[styles.ambientBlob, styles.blobTopRight]} />
        <View style={[styles.ambientBlob, styles.blobBottomLeft]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {/* Theme Toggle Button */}
          <TouchableOpacity
            style={[styles.themeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={toggleTheme}
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={20}
              color={isDark ? '#fbbf24' : '#6366f1'}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Profil
          </Text>
          <View style={styles.headerRight}>
            {/* Share Button */}
            <TouchableOpacity
              style={[styles.shareProfileButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => shareService.shareProfile(user?.id || '', user?.fullName || '')}
            >
              <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            {/* Settings Button */}
            <TouchableOpacity
              style={[styles.settingsButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Settings' as never)}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCardContainer}>
          <View
            style={[
              styles.profileCard,
              { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
              }
            ]}
          >
            {/* Avatar with Story Ring */}
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
              activeOpacity={0.9}
            >
              {/* Instagram-style gradient ring for active stories */}
              {hasActiveStory ? (
                <LinearGradient
                  colors={['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.storyRing}
                >
                  <View style={[styles.avatarInner, { backgroundColor: colors.cardBackground }]}>
                    <Image
                      source={{ uri: user?.avatarUrl || user?.photos?.[0] || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.fullName || 'U') + '&size=200&background=6366f1&color=fff' }}
                      style={styles.avatar}
                    />
                  </View>
                </LinearGradient>
              ) : (
                <View style={[styles.avatarBorder, { borderColor: colors.border }]}>
                  <Image
                    source={{ uri: user?.avatarUrl || user?.photos?.[0] || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.fullName || 'U') + '&size=200&background=6366f1&color=fff' }}
                    style={styles.avatar}
                  />
                </View>
              )}
              {/* Story badge - Hikaye ekleme */}
              <TouchableOpacity
                style={[styles.storyBadge, hasActiveStory && styles.storyBadgeActive]}
                onPress={() => navigation.navigate('AddStory')}
              >
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* User Info */}
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {user?.fullName || 'İsim Belirtilmedi'}
            </Text>
            <Text style={[styles.userInfo, { color: colors.textSecondary }]}>
              {getClassYearLabel(user?.year)} • {user?.department || 'Bölüm'} • {user?.university || 'Üniversite'}
            </Text>

            {/* Stats Row - Kompakt Takip/Takipçi/Eşleşme */}
            <View style={styles.statsRow}>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => navigation.navigate('Followers', { userId: user?.id })}
              >
                <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
                  {stats.followers}
                </Text>
                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                  Takipçi
                </Text>
              </TouchableOpacity>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => navigation.navigate('Following', { userId: user?.id })}
              >
                <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
                  {stats.following}
                </Text>
                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                  Takip
                </Text>
              </TouchableOpacity>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {stats.matches}
                </Text>
                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                  Eşleşme
                </Text>
              </TouchableOpacity>
            </View>

            {/* Edit Profile Button */}
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => navigation.navigate('EditProfile' as never)}
            >
              <Text style={styles.editProfileButtonText}>
                PROFİLİ DÜZENLE
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Photo Carousel */}
        <View style={styles.photosSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Öne Çıkanlar
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('EditProfile' as never)}
            >
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                {(user?.photos && user.photos.length > 0) ? 'Düzenle' : 'Ekle'}
              </Text>
            </TouchableOpacity>
          </View>
          {(user?.photos && user.photos.length > 0) ? (
            <FlatList
              data={user.photos}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              keyExtractor={(item, index) => `photo-${index}`}
              renderItem={renderPhotoCard}
              snapToInterval={PHOTO_WIDTH + 12}
              decelerationRate="fast"
            />
          ) : (
            <TouchableOpacity
              style={[styles.emptyPhotosCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
              onPress={() => navigation.navigate('EditProfile' as never)}
            >
              <View style={[styles.emptyPhotosIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="images-outline" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.emptyPhotosTitle, { color: colors.textPrimary }]}>
                Fotoğraflarını Ekle
              </Text>
              <Text style={[styles.emptyPhotosText, { color: colors.textSecondary }]}>
                Profiline fotoğraf ekleyerek eşleşme şansını artır!
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content Sections */}
        <View style={styles.sectionsContainer}>
          {/* Bio Section */}
          <View
            style={[
              styles.sectionCard,
              { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
              }
            ]}
          >
            <View style={styles.sectionCardHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="person" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.sectionCardTitle, { color: colors.textPrimary }]}>
                Hakkımda
              </Text>
            </View>
            <Text style={[styles.bioText, { color: colors.textSecondary }]}>
              {user?.bio || 'Henüz bir bio eklenmedi.'}
            </Text>
          </View>

          {/* Interests Section */}
          <View
            style={[
              styles.sectionCard,
              { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
              }
            ]}
          >
            <View style={styles.sectionCardHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                <MaterialCommunityIcons name="heart-multiple" size={18} color="#ec4899" />
              </View>
              <Text style={[styles.sectionCardTitle, { color: colors.textPrimary }]}>
                İlgi Alanları
              </Text>
            </View>
            <View style={styles.interestsContainer}>
              {(user?.interests && user.interests.length > 0) ? user.interests.map((interest, index) => (
                <View
                  key={index}
                  style={[
                    styles.interestTag,
                    { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(19, 55, 236, 0.08)',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(19, 55, 236, 0.15)',
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.interestTagText,
                      { color: isDark ? colors.textPrimary : colors.primary }
                    ]}
                  >
                    {interest}
                  </Text>
                </View>
              )) : (
                <Text style={{ color: colors.textSecondary }}>Henüz ilgi alanı eklenmedi</Text>
              )}
            </View>
          </View>

          {/* Badges Section */}
          {user?.id && (
            <ProfileBadges userId={user.id} maxDisplay={3} showTitle={true} />
          )}

          {/* Spotify Section */}
          {user?.id && (
            <SpotifySection userId={user.id} showCompatibility={false} />
          )}

          {/* Quick Actions - Mega Features */}
          <View
            style={[
              styles.sectionCard,
              { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
              }
            ]}
          >
            <View style={styles.sectionCardHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <MaterialIcons name="flash-on" size={18} color="#8b5cf6" />
              </View>
              <Text style={[styles.sectionCardTitle, { color: colors.textPrimary }]}>
                Hızlı İşlemler
              </Text>
            </View>
            
            <View style={styles.quickActionsGrid}>
              {/* Profile Preview */}
              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                onPress={() => navigation.navigate('ProfilePreview')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <MaterialIcons name="visibility" size={20} color="#3b82f6" />
                </View>
                <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Önizleme</Text>
              </TouchableOpacity>

              {/* Edit Prompts */}
              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                onPress={() => navigation.navigate('EditPrompts')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                  <MaterialIcons name="chat-bubble" size={20} color="#ec4899" />
                </View>
                <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Sorular</Text>
              </TouchableOpacity>

              {/* Boost */}
              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                onPress={() => navigation.navigate('Boost')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <MaterialIcons name="bolt" size={20} color="#f59e0b" />
                </View>
                <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Boost</Text>
              </TouchableOpacity>

              {/* Photo Verification */}
              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                onPress={() => navigation.navigate('PhotoVerification')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                  <MaterialIcons name="verified-user" size={20} color="#22c55e" />
                </View>
                <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Doğrula</Text>
              </TouchableOpacity>

              {/* Spotify Connect */}
              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                onPress={() => navigation.navigate('SpotifyConnect')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(30, 215, 96, 0.15)' }]}>
                  <MaterialCommunityIcons name="spotify" size={20} color="#1ed760" />
                </View>
                <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Spotify</Text>
              </TouchableOpacity>

              {/* Daily Tasks */}
              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                onPress={() => navigation.navigate('DailyTasks')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                  <MaterialIcons name="task-alt" size={20} color="#8b5cf6" />
                </View>
                <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Görevler</Text>
              </TouchableOpacity>

              {/* Badges */}
              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                onPress={() => navigation.navigate('Badges', { userId: user?.id })}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                  <MaterialIcons name="military-tech" size={20} color="#fbbf24" />
                </View>
                <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Rozetler</Text>
              </TouchableOpacity>

              {/* Advanced Filters */}
              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                onPress={() => navigation.navigate('AdvancedFilters')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                  <MaterialIcons name="tune" size={20} color="#6366f1" />
                </View>
                <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Filtreler</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={logout}
            style={[
              styles.logoutButton,
              { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' }
            ]}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ambientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  ambientBlob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blobTopRight: {
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(19, 55, 236, 0.15)',
    ...Platform.select({
      web: { filter: 'blur(80px)' },
      default: { opacity: 0.6 },
    }),
  },
  blobBottomLeft: {
    bottom: 100,
    left: -100,
    width: 250,
    height: 250,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    ...Platform.select({
      web: { filter: 'blur(80px)' },
      default: { opacity: 0.5 },
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  shareProfileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  profileCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  profileCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      },
      default: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
    }),
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  storyRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 3,
  },
  avatarBorder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 3,
    borderWidth: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 52,
  },
  storyBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#dc2743',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#101322',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(220, 39, 67, 0.5)',
      },
      default: {
        elevation: 4,
        shadowColor: '#dc2743',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
    }),
  },
  storyBadgeActive: {
    backgroundColor: '#1337ec',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(19, 55, 236, 0.5)',
      },
      default: {},
    }),
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 14,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    opacity: 0.3,
  },
  editProfileButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1337ec',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(19, 55, 236, 0.4)',
      },
      default: {
        elevation: 6,
        shadowColor: '#1337ec',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
    }),
  },
  editProfileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  photosSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyPhotosCard: {
    marginHorizontal: 20,
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyPhotosIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyPhotosTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyPhotosText: {
    fontSize: 14,
    textAlign: 'center',
  },
  photoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      },
      default: {
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  photoLabel: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  photoLabelText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
      },
      default: {},
    }),
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  interestTagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionItem: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default UserProfileScreen;
