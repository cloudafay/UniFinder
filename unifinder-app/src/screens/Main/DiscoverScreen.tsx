// Keşfet Ekranı - Ana Swipe Ekranı
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { useFilters } from '../../context/FilterContext';
import { profileService } from '../../services/profileService';
import { matchService } from '../../services/matchService';
import locationService from '../../services/locationService';
import pushNotificationService from '../../services/pushNotificationService';
import { undoService } from '../../services/undoService';
import { boostService } from '../../services/boostService';
import { Profile } from '../../lib/database.types';
import { StudentBadgeInline } from '../../components/common/StudentBadge';
import { ScreenBackground } from '../../components/ui';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = height * 0.65;
const SWIPE_THRESHOLD = 120;
const SWIPE_OUT_DURATION = 300;

interface DiscoverProfile extends Profile {
  age?: number;
  distance_km?: number;
  is_boosted?: boolean;
}

const DiscoverScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { location, discoveryRadius, requestLocation, permissionStatus } = useLocation();
  const { filters } = useFilters();

  // State
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwipeLoading, setIsSwipeLoading] = useState(false);
  const [useLocationFilter, setUseLocationFilter] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [undoTimeRemaining, setUndoTimeRemaining] = useState(0);

  const position = useRef(new Animated.ValueXY()).current;
  const swipeAnim = useRef(new Animated.Value(1)).current;

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  // Profilleri yükle
  const loadProfiles = useCallback(async () => {
    if (!user?.id) {
      console.log('❌ No user ID, skipping profile load');
      return;
    }

    console.log('🚀 Loading profiles for user:', user.id);
    console.log('📊 Current filters:', JSON.stringify(filters));
    setIsLoading(true);
    try {
      let profilesData: any[] = [];

      // Konum varsa ve konum filtresi aktifse, yakındaki profilleri al
      if (useLocationFilter && location) {
        console.log('📍 Using location filter');
        profilesData = await locationService.getNearbyProfiles(
          user.id,
          location.latitude,
          location.longitude,
          discoveryRadius,
          20
        );
      } else {
        // Normal profil listesi
        console.log('📋 Fetching discover profiles without location');
        const { data, error } = await profileService.getDiscoverProfiles(user.id, 20);
        if (error) {
          console.error('❌ Profil getirme hatası:', error);
          return;
        }
        profilesData = data || [];
        console.log('✅ Profiles fetched:', profilesData.length);
      }

      if (profilesData.length > 0) {
        // Profilleri işle ve filtrele
        let processedProfiles = profilesData.map(profile => ({
          ...profile,
          age: profile.year ? calculateAge(profile.year) : undefined,
          distance_km: profile.distance_km,
        }));

        console.log('🔄 Processing profiles:', processedProfiles.length);

        // Filtreleri uygula - sadece aktif filtreler için
        if (filters.verifiedOnly) {
          const beforeFilter = processedProfiles.length;
          processedProfiles = processedProfiles.filter(p => p.is_verified);
          console.log('🔍 VerifiedOnly filter:', beforeFilter, '->', processedProfiles.length);
        }

        // Yaş filtresi
        if (filters.ageMin > 18 || filters.ageMax < 100) {
          const beforeFilter = processedProfiles.length;
          processedProfiles = processedProfiles.filter(p => {
            if (!p.age) return true;
            return p.age >= filters.ageMin && p.age <= filters.ageMax;
          });
          console.log('🔍 Age filter:', beforeFilter, '->', processedProfiles.length);
        }

        // Mesafe filtresi
        if (filters.distance > 0) {
          processedProfiles = processedProfiles.filter(p => {
            if (!p.distance_km) return true;
            return p.distance_km <= filters.distance;
          });
        }

        // İsim/bölüm araması
        if (filters.searchQuery.trim()) {
          const query = filters.searchQuery.toLowerCase();
          processedProfiles = processedProfiles.filter(p =>
            (p.full_name && p.full_name.toLowerCase().includes(query)) ||
            (p.department && p.department.toLowerCase().includes(query))
          );
        }

        // Boosted profilleri kontrol et ve önceliklendir
        try {
          const boostedUserIds = await boostService.getBoostedProfiles(user.id);
          processedProfiles = processedProfiles.map(p => ({
            ...p,
            is_boosted: boostedUserIds.includes(p.id),
          }));

          // Boosted profilleri öne al
          processedProfiles.sort((a, b) => {
            if (a.is_boosted && !b.is_boosted) return -1;
            if (!a.is_boosted && b.is_boosted) return 1;
            return 0;
          });
        } catch (boostError) {
          console.log('⚠️ Boost service error (ignoring):', boostError);
        }

        console.log('✅ Final profiles to display:', processedProfiles.length);
        setProfiles(processedProfiles);
        setCurrentIndex(0);
      } else {
        console.log('⚠️ No profiles to display');
        setProfiles([]);
      }
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, useLocationFilter, location, discoveryRadius, filters]);

  // Yaş hesapla (sınıftan)
  const calculateAge = (year: string): number => {
    const yearMap: { [key: string]: number } = {
      'freshman': 19,
      'sophomore': 20,
      'junior': 21,
      'senior': 22,
      'graduate': 24,
      'hazırlık': 18,
      '1. Sınıf': 19,
      '2. Sınıf': 20,
      '3. Sınıf': 21,
      '4. Sınıf': 22,
      'Yüksek Lisans': 24,
      'Doktora': 26,
    };
    return yearMap[year] || 21;
  };

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Card rotation based on swipe
  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });

  // Like label opacity
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  // Nope label opacity
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD / 2, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  // Super like label opacity (swipe up)
  const superLikeOpacity = position.y.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD / 2, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  // Next card scale animation
  const nextCardScale = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [1, 0.92, 1],
    extrapolate: 'clamp',
  });

  const nextCardOpacity = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [1, 0.6, 1],
    extrapolate: 'clamp',
  });

  // Check for match (mock - 30% chance)
  const checkForMatch = useCallback((profile: DiscoverProfile, isMatch: boolean) => {
    if (isMatch) {
      // Local notification gönder
      pushNotificationService.sendLocalNotification(
        '🎉 Yeni Eşleşme!',
        `${profile.full_name || 'Biri'} seninle eşleşti!`,
        { type: 'match', userId: profile.id }
      );

      // Navigate to match success screen
      setTimeout(() => {
        navigation.navigate('MatchSuccess', {
          matchedUserId: profile.id,
          matchedUserName: profile.full_name || 'Kullanıcı',
          matchedUserPhoto: profile.photos?.[0] || profile.avatar_url || '',
        });
      }, 300);
    }
  }, [navigation]);

  // Swipe işlemi
  const performSwipe = async (action: 'like' | 'nope' | 'superlike') => {
    if (!user?.id || !currentProfile || isSwipeLoading) return;

    setIsSwipeLoading(true);
    try {
      // Undo için swipe'ı kaydet
      await undoService.storeSwipe(user.id, currentProfile, action);
      setCanUndo(true);
      setUndoTimeRemaining(5000);

      const { data, isMatch, error } = await matchService.swipe(
        user.id,
        currentProfile.id,
        action
      );

      if (error) {
        console.error('Swipe hatası:', error);
      } else {
        console.log('Swipe kaydedildi:', action, isMatch ? '- EŞLEŞTİ!' : '');

        // Eğer like veya superlike ise match kontrolü yap
        if ((action === 'like' || action === 'superlike') && isMatch) {
          checkForMatch(currentProfile, true);
        }
      }
    } catch (error) {
      console.error('Swipe başarısız:', error);
    } finally {
      setIsSwipeLoading(false);
    }
  };

  // Undo işlemi
  const handleUndo = async () => {
    if (!user?.id || !canUndo) return;

    const isPremium = false; // TODO: Premium kontrolü ekle
    const result = await undoService.performUndo(user.id, isPremium);

    if (result.success && result.profile) {
      // Profili geri ekle
      setProfiles(prev => [result.profile!, ...prev.slice(currentIndex)]);
      setCurrentIndex(0);
      setCanUndo(false);
      setUndoTimeRemaining(0);
    }
  };

  // Undo timer
  useEffect(() => {
    if (undoTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setUndoTimeRemaining(prev => Math.max(0, prev - 100));
      }, 100);

      if (undoTimeRemaining <= 100) {
        setCanUndo(false);
      }

      return () => clearTimeout(timer);
    }
  }, [undoTimeRemaining]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          handleLike();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          handlePass();
        } else if (gesture.dy < -SWIPE_THRESHOLD) {
          handleSuperLike();
        } else {
          // Spring back to center
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            tension: 40,
            useNativeDriver: Platform.OS !== 'web',
          }).start();
        }
      },
    })
  ).current;

  const handleLike = () => {
    if (!currentProfile) return;
    const profile = currentProfile;

    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: width + 100, y: 0 },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(swipeAnim, {
        toValue: 0,
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      performSwipe('like');
      nextCard();
    });
  };

  const handlePass = () => {
    if (!currentProfile) return;

    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: -width - 100, y: 0 },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(swipeAnim, {
        toValue: 0,
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      performSwipe('nope');
      nextCard();
    });
  };

  const handleSuperLike = () => {
    if (!currentProfile) return;
    const profile = currentProfile;

    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: 0, y: -height },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(swipeAnim, {
        toValue: 0,
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      performSwipe('superlike');
      nextCard();
    });
  };

  const nextCard = () => {
    position.setValue({ x: 0, y: 0 });
    swipeAnim.setValue(1);

    // Remove the swiped profile from the list
    setProfiles((prev) => {
      const newProfiles = prev.filter((_, idx) => idx !== currentIndex);

      // If no profiles left, reload
      if (newProfiles.length === 0) {
        loadProfiles();
      }

      return newProfiles;
    });
    // Current index stays the same since we removed the current profile
    // Next profile moves into current position
  };

  // Render next card (background)
  const renderNextCard = () => {
    if (!nextProfile) return null;

    return (
      <Animated.View
        style={[
          styles.card,
          styles.nextCard,
          {
            transform: [{ scale: nextCardScale }],
            opacity: nextCardOpacity,
          },
        ]}
      >
        <Image source={{ uri: nextProfile.photos?.[0] || nextProfile.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nextProfile.full_name || 'U') }} style={styles.cardImage} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.gradient}
        />
      </Animated.View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <ScreenBackground intensity={50}>
        <View style={[styles.container, styles.centerContent, { paddingTop: insets.top, backgroundColor: 'transparent' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Profiller yükleniyor...</Text>
        </View>
      </ScreenBackground>
    );
  }

  // No profiles state
  if (!currentProfile) {
    return (
      <ScreenBackground intensity={50}>
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: 'transparent' }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={[styles.logoIcon, { backgroundColor: `${colors.primary}15` }]}>
                <MaterialIcons name="school" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.logoText, { color: colors.textPrimary }]}>UniFinder</Text>
            </View>
          </View>

          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={80} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Profil Bulunamadı</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Şu an gösterilecek profil yok.{'\n'}Daha sonra tekrar kontrol edin!
            </Text>
            <TouchableOpacity
              style={[styles.refreshButton, { backgroundColor: colors.primary }]}
              onPress={loadProfiles}
            >
              <MaterialIcons name="refresh" size={20} color="#fff" />
              <Text style={styles.refreshButtonText}>Yenile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground intensity={50}>
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: 'transparent' }]}>
        {/* Ambient Background */}
        <View style={styles.backgroundBlobs}>
          <View style={[styles.blob, styles.blobTop]} />
          <View style={[styles.blob, styles.blobBottom]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, { backgroundColor: `${colors.primary}15` }]}>
              <MaterialIcons name="school" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.logoText, { color: colors.textPrimary }]}>UniFinder</Text>
          </View>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('FilterSearch' as never)}
          >
            <MaterialIcons name="tune" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Card Container */}
        <View style={styles.cardContainer}>
          {/* Next Card (Background) */}
          {renderNextCard()}

          {/* Current Card */}
          <Animated.View
            style={[
              styles.card,
              {
                transform: [
                  { translateX: position.x },
                  { translateY: position.y },
                  { rotate },
                ],
              },
            ]}
            {...panResponder.panHandlers}
          >
            {/* User Photo */}
            <Image
              source={{ uri: currentProfile.photos?.[0] || currentProfile.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentProfile.full_name || 'U') + '&size=400&background=6366f1&color=fff' }}
              style={styles.cardImage}
              resizeMode="cover"
            />

            {/* Like/Nope/Super Labels */}
            <Animated.View style={[styles.likeLabel, { opacity: likeOpacity }]}>
              <Text style={styles.likeLabelText}>BEĞENDİM</Text>
            </Animated.View>
            <Animated.View style={[styles.nopeLabel, { opacity: nopeOpacity }]}>
              <Text style={styles.nopeLabelText}>GEÇ</Text>
            </Animated.View>
            <Animated.View style={[styles.superLikeLabel, { opacity: superLikeOpacity }]}>
              <Text style={styles.superLikeLabelText}>SÜPER</Text>
            </Animated.View>

            {/* Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.gradient}
            />

            {/* Info Panel */}
            <View style={styles.infoPanel}>
              <View style={styles.infoHeader}>
                <View style={styles.nameContainer}>
                  <Text style={styles.nameText}>
                    {currentProfile.full_name || 'Kullanıcı'}{currentProfile.age ? `, ${currentProfile.age}` : ''}
                  </Text>
                  {/* Verified Badge */}
                  {currentProfile.is_verified && (
                    <View style={styles.verifiedBadge}>
                      <MaterialIcons name="verified" size={18} color="#3b82f6" />
                    </View>
                  )}
                  {/* Boost Badge */}
                  {currentProfile.is_boosted && (
                    <View style={styles.boostBadge}>
                      <MaterialIcons name="bolt" size={14} color="#f59e0b" />
                    </View>
                  )}
                  {/* Student Badge */}
                  {(currentProfile as any).badge_type && (
                    <StudentBadgeInline badgeType={(currentProfile as any).badge_type} />
                  )}
                  {currentProfile.is_active && (
                    <View style={styles.activeIndicator}>
                      <View style={styles.activeDot} />
                      <Text style={styles.activeText}>Aktif</Text>
                    </View>
                  )}
                </View>
                <View style={styles.departmentContainer}>
                  <MaterialIcons name="school" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.departmentText}>
                    {currentProfile.department || 'Bölüm'} • {(currentProfile as any).university_name || currentProfile.university || 'Üniversite'}
                  </Text>
                </View>
              </View>

              {/* Tags */}
              <View style={styles.tagsContainer}>
                {(currentProfile.interests || []).slice(0, 3).map((interest, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Undo Button */}
          {canUndo && (
            <TouchableOpacity
              style={[styles.undoButton, { opacity: undoTimeRemaining / 5000 }]}
              onPress={handleUndo}
              accessibilityLabel="Son swipe'ı geri al"
            >
              <MaterialIcons name="replay" size={24} color="#f59e0b" />
            </TouchableOpacity>
          )}

          {/* Pass Button */}
          <TouchableOpacity style={styles.passButton} onPress={handlePass}>
            <MaterialIcons name="close" size={32} color="#f43f5e" />
          </TouchableOpacity>

          {/* Super Like Button */}
          <TouchableOpacity style={styles.superLikeButton} onPress={handleSuperLike}>
            <MaterialIcons name="star" size={28} color="#38bdf8" />
          </TouchableOpacity>

          {/* Like Button */}
          <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
            <MaterialIcons name="favorite" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  backgroundBlobs: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blobTop: {
    width: 300,
    height: 300,
    top: -50,
    right: -50,
    backgroundColor: 'rgba(19, 55, 236, 0.1)',
  },
  blobBottom: {
    width: 250,
    height: 250,
    bottom: 100,
    left: -50,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(19, 55, 236, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
      },
    }),
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    top: '50%',
  },
  likeLabel: {
    position: 'absolute',
    top: 40,
    left: 20,
    borderWidth: 4,
    borderColor: '#22c55e',
    borderRadius: 8,
    padding: 8,
    transform: [{ rotate: '-15deg' }],
  },
  likeLabelText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  nopeLabel: {
    position: 'absolute',
    top: 40,
    right: 20,
    borderWidth: 4,
    borderColor: '#ef4444',
    borderRadius: 8,
    padding: 8,
    transform: [{ rotate: '15deg' }],
  },
  nopeLabelText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  superLikeLabel: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    borderWidth: 4,
    borderColor: '#38bdf8',
    borderRadius: 8,
    padding: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  superLikeLabelText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  nextCard: {
    position: 'absolute',
    top: 0,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  infoHeader: {
    gap: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
  },
  activeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#dcfce7',
  },
  departmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  departmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 24,
    paddingBottom: 100,
  },
  undoButton: {
    position: 'absolute',
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  passButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  superLikeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(19, 55, 236, 0.4)',
      } as any,
      default: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  noMoreText: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 100,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24,
    gap: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  boostBadge: {
    marginLeft: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 10,
    padding: 2,
  },
});

export default DiscoverScreen;
