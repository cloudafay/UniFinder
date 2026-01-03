// Bildirim Merkezi Ekranı
// Modern tasarım ve animasyonlar ile

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Pressable,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import { matchService } from '../../services/matchService';
import { RootStackParamList } from '../../navigation/types';

const { width, height } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Bildirim türleri
type NotificationType = 'match' | 'message' | 'campus_alert' | 'profile_view' | 'system' | 'like_request' | 'like' | 'superlike';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  image?: string;
  userId?: string;
  createdAt?: string;
  data?: {
    likerId?: string;
    likerName?: string;
    likerPhoto?: string;
    isSuperLike?: boolean;
    matchId?: string;
    matchedUserId?: string;
    [key: string]: any;
  };
}

// Animasyonlu bildirim kartı
const AnimatedNotificationCard: React.FC<{
  notification: Notification;
  index: number;
  onPress: () => void;
  onAcceptLike?: (notification: Notification) => void;
  colors: any;
  isDark: boolean;
}> = ({ notification, index, onPress, onAcceptLike, colors, isDark }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [index]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const isUnread = !notification.isRead;
  const hasImage = notification.image && (notification.type === 'match' || notification.type === 'message');

  const getIconInfo = () => {
    switch (notification.type) {
      case 'match':
        return { icon: 'favorite', color: '#ec4899', bgGradient: ['#ec4899', '#f43f5e'] };
      case 'message':
        return { icon: 'chat-bubble', color: Colors.primary, bgGradient: [Colors.primary, '#6366f1'] };
      case 'campus_alert':
        return { icon: 'campaign', color: '#f59e0b', bgGradient: ['#f59e0b', '#f97316'] };
      case 'profile_view':
        return { icon: 'visibility', color: '#8b5cf6', bgGradient: ['#8b5cf6', '#a855f7'] };
      case 'system':
        return { icon: 'shield', color: '#06b6d4', bgGradient: ['#06b6d4', '#0ea5e9'] };
      case 'like_request':
      case 'like':
        return { icon: 'favorite', color: '#f43f5e', bgGradient: ['#f43f5e', '#ec4899'] };
      case 'superlike':
        return { icon: 'star', color: '#fbbf24', bgGradient: ['#fbbf24', '#f59e0b'] };
      default:
        return { icon: 'notifications', color: Colors.primary, bgGradient: [Colors.primary, '#6366f1'] };
    }
  };

  const iconInfo = getIconInfo();

  return (
    <Animated.View
      style={[
        {
          opacity: animatedValue,
          transform: [
            { translateY: animatedValue.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
            { scale: scaleValue },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: isDark
              ? isUnread ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.5)'
              : isUnread ? 'rgba(255, 255, 255, 0.95)' : 'rgba(248, 250, 252, 0.9)',
            borderColor: isDark
              ? isUnread ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)'
              : isUnread ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          },
        ]}
      >
        {/* Gradient accent stripe */}
        {isUnread && (
          <LinearGradient
            colors={iconInfo.bgGradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.accentStripe}
          />
        )}

        <View style={styles.cardContent}>
          {/* Avatar veya Icon */}
          {hasImage ? (
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={iconInfo.bgGradient as [string, string]}
                style={styles.avatarGradientBorder}
              >
                <View style={[styles.avatarInner, { backgroundColor: isDark ? '#0f172a' : '#fff' }]}>
                  <Image
                    source={{ uri: notification.image }}
                    style={styles.avatar}
                  />
                </View>
              </LinearGradient>
              {notification.type === 'match' && (
                <View style={styles.matchBadge}>
                  <LinearGradient
                    colors={['#ec4899', '#f43f5e']}
                    style={styles.matchBadgeGradient}
                  >
                    <MaterialIcons name="favorite" size={10} color="#fff" />
                  </LinearGradient>
                </View>
              )}
            </View>
          ) : (
            <LinearGradient
              colors={isUnread ? iconInfo.bgGradient as [string, string] : [isDark ? '#334155' : '#e2e8f0', isDark ? '#1e293b' : '#cbd5e1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <MaterialIcons
                name={iconInfo.icon as any}
                size={22}
                color={isUnread ? '#fff' : isDark ? '#94a3b8' : '#64748b'}
              />
            </LinearGradient>
          )}

          {/* İçerik */}
          <View style={styles.textContent}>
            <View style={styles.headerRow}>
              <Text 
                style={[
                  styles.title,
                  { color: isDark ? '#fff' : '#1e293b' },
                  !isUnread && { color: isDark ? '#94a3b8' : '#64748b', fontWeight: '500' }
                ]}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              {isUnread && (
                <View style={[styles.unreadDot, { backgroundColor: iconInfo.color }]} />
              )}
            </View>
            <Text
              style={[
                styles.message,
                { color: isDark ? '#cbd5e1' : '#475569' },
                !isUnread && { color: isDark ? '#64748b' : '#94a3b8' }
              ]}
              numberOfLines={2}
            >
              {notification.message}
            </Text>
            <View style={styles.timeRow}>
              <MaterialIcons 
                name="access-time" 
                size={12} 
                color={isDark ? '#64748b' : '#94a3b8'} 
              />
              <Text style={[styles.time, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                {notification.time}
              </Text>
            </View>

            {/* Beğeni onay butonu - sadece like_request için */}
            {notification.type === 'like_request' && !notification.isRead && onAcceptLike && (
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onAcceptLike(notification);
                }}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.acceptButtonGradient}
                >
                  <MaterialIcons name="check" size={16} color="#fff" />
                  <Text style={styles.acceptButtonText}>Onayla</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Ok ikonu */}
          <View style={styles.arrowContainer}>
            <MaterialIcons 
              name="chevron-right" 
              size={24} 
              color={isDark ? '#475569' : '#cbd5e1'} 
            />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const NotificationCenterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Header animasyonu
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const closeButtonScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(closeButtonScale, {
        toValue: 1,
        delay: 200,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Bildirimleri yükle
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await notificationService.getMyNotifications(user.id);
      
      if (error) {
        console.error('Bildirimler yüklenemedi:', error);
        return;
      }

      if (data) {
        const formattedNotifications: Notification[] = data.map((n: any) => ({
          id: n.id,
          type: n.type || 'system',
          title: n.title,
          message: n.body,
          time: formatTime(n.created_at),
          isRead: n.is_read,
          image: n.data?.likerPhoto || n.data?.image,
          userId: n.data?.likerId || n.data?.matchedUserId || n.data?.user_id,
          createdAt: n.created_at,
          data: n.data || {},
        }));
        setNotifications(formattedNotifications);
      }
    } catch (err) {
      console.error('Bildirim yükleme hatası:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Zaman formatla
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} sa önce`;
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  // Sayfa odağa geldiğinde yükle
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadNotifications();
    }, [loadNotifications])
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const newNotifications = notifications.filter(n => !n.isRead);
  const earlierNotifications = notifications.filter(n => n.isRead);

  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Bildirimleri okundu işaretleme hatası:', err);
    }
  };

  // Beğeniyi onayla ve eşleş
  const handleAcceptLike = async (notification: Notification) => {
    if (!user?.id || !notification.data?.likerId) return;

    try {
      const { data: matchData, error } = await matchService.acceptLike(
        user.id,
        notification.data.likerId
      );

      if (error) {
        Alert.alert('Hata', 'Eşleşme oluşturulamadı. Lütfen tekrar deneyin.');
        console.error('Accept like error:', error);
        return;
      }

      // Bildirimi okundu işaretle
      await notificationService.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
      );

      // Eşleşme başarılı - sohbet sayfasına yönlendir
      Alert.alert(
        '🎉 Eşleşme!',
        `${notification.data?.likerName || 'Kullanıcı'} ile eşleştiniz!`,
        [
          {
            text: 'Mesaj Gönder',
            onPress: () => {
              navigation.navigate('Chat', {
                matchId: matchData?.id || notification.data?.likerId || '',
                userName: notification.data?.likerName || 'Kullanıcı',
                userPhoto: notification.data?.likerPhoto || '',
              });
            },
          },
          { text: 'Daha Sonra', style: 'cancel' },
        ]
      );
    } catch (err) {
      console.error('Beğeni onaylama hatası:', err);
      Alert.alert('Hata', 'Bir hata oluştu.');
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      await notificationService.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Bildirim okundu işaretleme hatası:', err);
    }

    // Bildirim türüne göre yönlendirme
    if (notification.type === 'match') {
      // Eşleşme - sohbete git
      const matchId = notification.data?.matchId || notification.userId;
      navigation.navigate('Chat', {
        matchId: matchId || '',
        userName: notification.title.replace('🎉 Yeni Eşleşme!', '').replace('Yeni Eşleşme: ', '').trim() || 'Kullanıcı',
        userPhoto: notification.image || '',
      });
    } else if (notification.type === 'message' && notification.userId) {
      navigation.navigate('Chat', {
        matchId: notification.userId,
        userName: notification.title,
        userPhoto: notification.image || '',
      });
    } else if (notification.type === 'like_request') {
      // Like request - profili göster veya onay modal
      if (notification.data?.likerId) {
        // Profil detay sayfasına git (varsa) veya hiçbir şey yapma
        console.log('Like request from:', notification.data.likerId);
      }
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#050510' : colors.background }]}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Bildirimler yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#050510' : colors.background }]}>
      {/* Arka plan efektleri */}
      <View style={[styles.ambientContainer, { pointerEvents: 'none' as const }]}>
        <LinearGradient
          colors={isDark 
            ? ['rgba(19, 55, 236, 0.15)', 'transparent'] 
            : ['rgba(19, 55, 236, 0.08)', 'transparent']}
          style={styles.gradientTop}
        />
        <View style={[styles.ambientBlob, styles.blobTopRight]} />
        <View style={[styles.ambientBlob, styles.blobBottomLeft]} />
      </View>

      {/* Header */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            paddingTop: insets.top + 16,
            opacity: headerOpacity,
            backgroundColor: isDark ? 'rgba(5, 5, 16, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          }
        ]}
      >
        <BlurView intensity={isDark ? 40 : 60} style={StyleSheet.absoluteFill} />
        
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : colors.textPrimary }]}>
              Bildirimler
            </Text>
            {newNotifications.length > 0 && (
              <View style={styles.countBadge}>
                <LinearGradient
                  colors={[Colors.primary, '#6366f1']}
                  style={styles.countBadgeGradient}
                >
                  <Text style={styles.countText}>{newNotifications.length}</Text>
                </LinearGradient>
              </View>
            )}
          </View>

          <View style={styles.headerRight}>
            {newNotifications.length > 0 && (
              <TouchableOpacity
                style={[styles.markAllButton, { 
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                }]}
                onPress={markAllAsRead}
                activeOpacity={0.7}
              >
                <MaterialIcons name="done-all" size={16} color={Colors.primary} />
                <Text style={styles.markAllText}>Tümü Okundu</Text>
              </TouchableOpacity>
            )}
            
            {/* Kapatma Butonu */}
            <Animated.View style={{ transform: [{ scale: closeButtonScale }] }}>
              <TouchableOpacity
                style={[styles.closeButton, { 
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                }]}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={20} color={isDark ? '#fff' : colors.textPrimary} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </Animated.View>

      {/* Bildirimler Listesi */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Yeni Bildirimler */}
        {newNotifications.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionDot}>
                  <LinearGradient
                    colors={[Colors.primary, '#6366f1']}
                    style={styles.sectionDotGradient}
                  />
                </View>
                <Text style={[styles.sectionTitle, { color: isDark ? '#cbd5e1' : '#64748b' }]}>
                  YENİ
                </Text>
              </View>
              <View style={[styles.sectionLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
            </View>
            {newNotifications.map((notification, index) => (
              <AnimatedNotificationCard
                key={notification.id}
                notification={notification}
                index={index}
                onPress={() => handleNotificationPress(notification)}
                onAcceptLike={handleAcceptLike}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </>
        )}

        {/* Önceki Bildirimler */}
        {earlierNotifications.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: newNotifications.length > 0 ? 24 : 0 }]}>
              <View style={styles.sectionTitleContainer}>
                <MaterialIcons name="history" size={14} color={isDark ? '#64748b' : '#94a3b8'} />
                <Text style={[styles.sectionTitleEarlier, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  DAHA ÖNCE
                </Text>
              </View>
              <View style={[styles.sectionLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
            </View>
            {earlierNotifications.map((notification, index) => (
              <AnimatedNotificationCard
                key={notification.id}
                notification={notification}
                index={index + newNotifications.length}
                onPress={() => handleNotificationPress(notification)}
                onAcceptLike={handleAcceptLike}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </>
        )}

        {/* Boş Durum */}
        {notifications.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={isDark ? ['#1e293b', '#0f172a'] : ['#f1f5f9', '#e2e8f0']}
                style={styles.emptyIconGradient}
              >
                <MaterialIcons name="notifications-off" size={56} color={isDark ? '#475569' : '#94a3b8'} />
              </LinearGradient>
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#cbd5e1' : '#475569' }]}>
              Henüz bildirim yok
            </Text>
            <Text style={[styles.emptyMessage, { color: isDark ? '#64748b' : '#94a3b8' }]}>
              Yeni eşleşmeler, mesajlar ve{'\n'}duyurular burada görünecek
            </Text>
            
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.goBack()}
            >
              <LinearGradient
                colors={[Colors.primary, '#6366f1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyButtonGradient}
              >
                <Text style={styles.emptyButtonText}>Keşfetmeye Başla</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(19, 55, 236, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  ambientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  ambientBlob: {
    position: 'absolute',
    borderRadius: 9999,
    ...Platform.select({
      web: {
        filter: 'blur(100px)',
      },
      default: {
        opacity: 0.3,
      },
    }),
  },
  blobTopRight: {
    top: -100,
    right: -100,
    width: 400,
    height: 400,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  blobBottomLeft: {
    bottom: -150,
    left: -100,
    width: 500,
    height: 500,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  countBadge: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  countBadgeGradient: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
    gap: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sectionDotGradient: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  sectionTitleEarlier: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  sectionLine: {
    flex: 1,
    height: 1,
  },
  card: {
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        transition: 'all 0.2s ease',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  accentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingLeft: 16,
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradientBorder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    padding: 2,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  matchBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  matchBadgeGradient: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    fontWeight: '500',
  },
  arrowContainer: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  floatingCloseButton: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 30,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  floatingButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    gap: 6,
  },
  floatingButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  acceptButton: {
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  acceptButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});

export default NotificationCenterScreen;
