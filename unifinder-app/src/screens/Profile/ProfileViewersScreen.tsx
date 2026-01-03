/**
 * Profil Ziyaretçileri Ekranı
 * Premium özellik - Son 30 günde profilinizi görüntüleyenler
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { 
  getProfileViewers, 
  getProfileViewStats,
  ProfileViewer,
  ProfileViewStats 
} from '../../services/profileViewService';
import { isPremium } from '../../services/premiumService';
import { Colors } from '../../constants/colors';

const ProfileViewersScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [viewers, setViewers] = useState<ProfileViewer[]>([]);
  const [stats, setStats] = useState<ProfileViewStats>({
    totalViews: 0,
    uniqueViewers: 0,
    todayViews: 0,
    weekViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPremium, setHasPremium] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const premium = await isPremium();
      setHasPremium(premium);

      if (premium) {
        const [viewerData, statsData] = await Promise.all([
          getProfileViewers(),
          getProfileViewStats(),
        ]);
        setViewers(viewerData);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Ziyaretçi verileri yüklenemedi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  const renderViewer = ({ item }: { item: ProfileViewer }) => (
    <TouchableOpacity
      style={[styles.viewerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.avatarPlaceholder}
          >
            <Text style={styles.avatarText}>
              {item.full_name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </LinearGradient>
        )}
        {item.is_verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
          </View>
        )}
      </View>

      {/* Bilgiler */}
      <View style={styles.viewerInfo}>
        <Text style={[styles.viewerName, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.full_name || 'İsimsiz Kullanıcı'}
        </Text>
        <Text style={[styles.viewerDetails, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.department || item.university || 'Bilgi yok'}
        </Text>
        <Text style={[styles.viewTime, { color: colors.textSecondary }]}>
          {formatTime(item.last_viewed_at)}
          {item.view_count > 1 && ` · ${item.view_count} kez`}
        </Text>
      </View>

      {/* Ok */}
      <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderPremiumLock = () => (
    <View style={styles.premiumLockContainer}>
      <LinearGradient
        colors={['#f59e0b', '#d97706']}
        style={styles.premiumIconContainer}
      >
        <MaterialIcons name="visibility" size={48} color="#fff" />
      </LinearGradient>
      
      <Text style={[styles.premiumTitle, { color: colors.textPrimary }]}>
        Seni Kim Görüntüledi?
      </Text>
      <Text style={[styles.premiumDescription, { color: colors.textSecondary }]}>
        Profilini görüntüleyen kişileri görmek için Gold veya üstü bir plana yükseltin
      </Text>

      {/* Blur önizleme */}
      <View style={[styles.blurPreview, { backgroundColor: colors.surface }]}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.blurRow}>
            <View style={[styles.blurAvatar, { backgroundColor: colors.border }]} />
            <View style={styles.blurLines}>
              <View style={[styles.blurLine, { backgroundColor: colors.border, width: '60%' }]} />
              <View style={[styles.blurLine, { backgroundColor: colors.border, width: '40%' }]} />
            </View>
          </View>
        ))}
        <View style={styles.blurOverlay}>
          <MaterialIcons name="lock" size={32} color={colors.textSecondary} />
        </View>
      </View>

      <TouchableOpacity
        style={styles.upgradeButton}
        onPress={() => navigation.navigate('Premium')}
      >
        <LinearGradient
          colors={['#f59e0b', '#d97706']}
          style={styles.upgradeButtonGradient}
        >
          <MaterialIcons name="star" size={20} color="#fff" />
          <Text style={styles.upgradeButtonText}>Premium'a Yükselt</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="visibility-off" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        Henüz Ziyaretçi Yok
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Profilinizi görüntüleyen kişiler burada görünecek
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profil Ziyaretçileri</Text>
        <View style={styles.headerBadge}>
          <MaterialIcons name="star" size={16} color="#f59e0b" />
        </View>
      </View>

      {!hasPremium ? (
        renderPremiumLock()
      ) : (
        <>
          {/* İstatistikler */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats.todayViews}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bugün</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats.weekViews}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bu Hafta</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{stats.uniqueViewers}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Toplam</Text>
            </View>
          </View>

          {/* Liste */}
          <FlatList
            data={viewers}
            keyExtractor={(item) => item.id}
            renderItem={renderViewer}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadData();
                }}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  headerBadge: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    flexGrow: 1,
  },
  viewerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  viewerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  viewerName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  viewerDetails: {
    fontSize: 13,
    marginBottom: 2,
  },
  viewTime: {
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  premiumLockContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  premiumIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  premiumDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  blurPreview: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  blurRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  blurAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  blurLines: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
  blurLine: {
    height: 12,
    borderRadius: 6,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ProfileViewersScreen;

