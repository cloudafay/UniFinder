/**
 * Takip Edilenler Ekranı
 * Kullanıcının takip ettiklerini listeler
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
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getFollowing, unfollowUser, FollowUser } from '../../services/followService';
import { Colors } from '../../constants/colors';

const FollowingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user: currentUser } = useAuth();

  const userId = route.params?.userId || currentUser?.id;
  const isOwnProfile = userId === currentUser?.id;

  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFollowing = useCallback(async () => {
    try {
      const data = await getFollowing(userId);
      setFollowing(data);
    } catch (error) {
      console.error('Takip edilen listesi yüklenemedi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFollowing();
  }, [loadFollowing]);

  const handleUnfollow = async (targetUser: FollowUser) => {
    const confirmUnfollow = () => {
      Alert.alert(
        'Takipten Çık',
        `${targetUser.full_name} adlı kullanıcıyı takipten çıkmak istediğinize emin misiniz?`,
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Takipten Çık',
            style: 'destructive',
            onPress: async () => {
              // Optimistic update
              setFollowing(prev => prev.filter(f => f.id !== targetUser.id));
              
              const result = await unfollowUser(targetUser.id);
              if (!result.success) {
                // Geri al
                setFollowing(prev => [...prev, targetUser]);
                Alert.alert('Hata', result.error || 'İşlem başarısız');
              }
            },
          },
        ]
      );
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `${targetUser.full_name} adlı kullanıcıyı takipten çıkmak istediğinize emin misiniz?`
      );
      if (confirmed) {
        setFollowing(prev => prev.filter(f => f.id !== targetUser.id));
        const result = await unfollowUser(targetUser.id);
        if (!result.success) {
          setFollowing(prev => [...prev, targetUser]);
          window.alert(result.error || 'İşlem başarısız');
        }
      }
    } else {
      confirmUnfollow();
    }
  };

  const renderFollowing = ({ item }: { item: FollowUser }) => {
    const isSelf = item.id === currentUser?.id;

    return (
      <TouchableOpacity
        style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.full_name || 'İsimsiz Kullanıcı'}
          </Text>
          <Text style={[styles.userDetails, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.department || item.university || 'Bilgi yok'}
          </Text>
        </View>

        {/* Takipten Çık Butonu (Sadece kendi profili için) */}
        {isOwnProfile && !isSelf && (
          <TouchableOpacity
            style={[styles.unfollowButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleUnfollow(item)}
          >
            <Text style={[styles.unfollowButtonText, { color: colors.textPrimary }]}>
              Takip
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="person-add-alt" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        Kimseyi Takip Etmiyor
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {isOwnProfile
          ? 'Keşfet sayfasından yeni kişileri takip edebilirsiniz'
          : 'Bu kullanıcı henüz kimseyi takip etmiyor'}
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Takip Edilenler</Text>
        <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
          {following.length}
        </Text>
      </View>

      {/* Liste */}
      <FlatList
        data={following}
        keyExtractor={(item) => item.id}
        renderItem={renderFollowing}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadFollowing();
            }}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />
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
  headerCount: {
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  userCard: {
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
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  userDetails: {
    fontSize: 13,
  },
  unfollowButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
  },
  unfollowButtonText: {
    fontSize: 13,
    fontWeight: '600',
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
});

export default FollowingScreen;

