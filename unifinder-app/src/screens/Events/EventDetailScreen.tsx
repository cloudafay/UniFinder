// Etkinlik Detay Ekranı
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
  Linking,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapWrapper } from '../../components/MapWrapper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { eventService, Event, EventParticipant } from '../../services/eventService';
import { shareService } from '../../services/shareService';
import { RootStackParamList } from '../../navigation/types';

type EventDetailRouteProp = RouteProp<RootStackParamList, 'EventDetail'>;

const CATEGORY_ICONS: Record<string, string> = {
  party: '🎉', study: '📚', sports: '⚽', social: '☕', other: '📌',
};

const EventDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<EventDetailRouteProp>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const { eventId } = route.params;

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [userStatus, setUserStatus] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    try {
      const [eventResult, participantsResult] = await Promise.all([
        eventService.getEventById(eventId),
        eventService.getParticipants(eventId),
      ]);

      if (eventResult.data) {
        setEvent(eventResult.data);
      }
      if (participantsResult.data) {
        setParticipants(participantsResult.data);
        const userParticipant = participantsResult.data.find(p => p.user_id === user?.id);
        setUserStatus(userParticipant?.status || null);
      }
    } catch (error) {
      console.error('Etkinlik yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, user?.id]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleJoin = async (status: 'going' | 'interested') => {
    if (!user?.id || !event) return;

    setIsJoining(true);
    try {
      const { error } = await eventService.joinEvent(eventId, user.id, status);

      if (error) {
        Alert.alert('Hata', error);
      } else {
        setUserStatus(status);
        loadEvent();
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir sorun oluştu');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user?.id) return;

    Alert.alert(
      'Etkinlikten Ayrıl',
      'Bu etkinlikten ayrılmak istediğine emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ayrıl',
          style: 'destructive',
          onPress: async () => {
            setIsJoining(true);
            try {
              await eventService.leaveEvent(eventId, user.id);
              setUserStatus(null);
              loadEvent();
            } catch (error) {
              Alert.alert('Hata', 'Bir sorun oluştu');
            } finally {
              setIsJoining(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <MaterialIcons name="error-outline" size={64} color={colors.textTertiary} />
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>Etkinlik bulunamadı</Text>
      </View>
    );
  }

  const isFull = (event.participant_count || 0) >= (event.capacity ?? event.max_participants);
  const isCreator = event.creator_id === user?.id;
  const goingCount = participants.filter(p => p.status === 'going').length;
  const interestedCount = participants.filter(p => p.status === 'interested').length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {event.image_url ? (
            <Image source={{ uri: event.image_url }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: `${colors.primary}30` }]}>
              <Text style={styles.heroEmoji}>{CATEGORY_ICONS[event.category] || '📌'}</Text>
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          />

          {/* Back Button */}
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 8 }]}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            style={[styles.shareButton, { top: insets.top + 8 }]}
            onPress={() => shareService.shareEvent(eventId, event?.title || '', formatDate(event?.event_date || ''))}
          >
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{event.title}</Text>

          {/* Date & Time */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.infoIcon, { backgroundColor: `${colors.primary}15` }]}>
              <MaterialIcons name="event" size={24} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
                {formatDate(event.event_date)}
              </Text>
              <Text style={[styles.infoSubtitle, { color: colors.textSecondary }]}>
                Saat {formatTime(event.event_date)}
              </Text>
            </View>
          </View>

          {/* Location */}
          <TouchableOpacity 
            style={[styles.infoCard, { backgroundColor: colors.surface }]}
            onPress={() => {
              if (event.latitude && event.longitude) {
                // Google Maps veya Apple Maps'i aç
                const url = Platform.select({
                  ios: `maps:0,0?q=${event.location}@${event.latitude},${event.longitude}`,
                  android: `geo:${event.latitude},${event.longitude}?q=${event.latitude},${event.longitude}(${event.location})`,
                  default: `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`,
                });
                Linking.openURL(url);
              }
            }}
          >
            <View style={[styles.infoIcon, { backgroundColor: '#22c55e15' }]}>
              <MaterialIcons name="location-on" size={24} color="#22c55e" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
                {event.location || event.location_name}
              </Text>
              <Text style={[styles.infoSubtitle, { color: colors.textSecondary }]}>
                {event.latitude ? 'Haritada göster' : 'Konum bilgisi'}
              </Text>
            </View>
            {event.latitude && <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />}
          </TouchableOpacity>

          {/* Mini Map */}
          {event.latitude && event.longitude && (
            <TouchableOpacity 
              style={styles.miniMapContainer}
              onPress={() => {
                const url = Platform.select({
                  ios: `maps:0,0?q=${event.location}@${event.latitude},${event.longitude}`,
                  android: `geo:${event.latitude},${event.longitude}?q=${event.latitude},${event.longitude}(${event.location})`,
                  default: `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`,
                });
                Linking.openURL(url);
              }}
              activeOpacity={0.9}
            >
              <MapWrapper
                style={styles.miniMap}
                region={{
                  latitude: event.latitude,
                  longitude: event.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                markerCoordinate={{
                  latitude: event.latitude,
                  longitude: event.longitude,
                }}
                markerTitle={event.title}
                colors={colors}
                interactive={false}
              />
              {Platform.OS !== 'web' && (
                <View style={styles.miniMapOverlay}>
                  <MaterialIcons name="open-in-new" size={20} color="#fff" />
                  <Text style={styles.miniMapOverlayText}>Haritada Aç</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Participants */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.infoIcon, { backgroundColor: '#f59e0b15' }]}>
              <MaterialIcons name="people" size={24} color="#f59e0b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
                {goingCount} Katılımcı
              </Text>
              <Text style={[styles.infoSubtitle, { color: colors.textSecondary }]}>
                {interestedCount} ilgileniyor • {event.capacity} kapasite
              </Text>
            </View>
          </View>

          {/* Description */}
          {event.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Açıklama</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {event.description}
              </Text>
            </View>
          )}

          {/* Participants Preview */}
          {participants.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Katılımcılar</Text>
              <View style={styles.participantsList}>
                {participants.slice(0, 6).map((p, index) => (
                  <View key={p.id} style={[styles.participantAvatar, { marginLeft: index > 0 ? -12 : 0 }]}>
                    <Image
                      source={{ uri: (p as any).profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent((p as any).profile?.full_name || 'U')}` }}
                      style={styles.avatarImage}
                    />
                  </View>
                ))}
                {participants.length > 6 && (
                  <View style={[styles.participantAvatar, styles.moreAvatar, { marginLeft: -12 }]}>
                    <Text style={styles.moreText}>+{participants.length - 6}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background }]}>
        {isCreator ? (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="edit" size={20} color={colors.textPrimary} />
            <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Düzenle</Text>
          </TouchableOpacity>
        ) : userStatus ? (
          <View style={styles.actionRow}>
            <View style={[styles.statusBadge, { backgroundColor: userStatus === 'going' ? '#22c55e20' : '#f59e0b20' }]}>
              <MaterialIcons
                name={userStatus === 'going' ? 'check-circle' : 'star'}
                size={18}
                color={userStatus === 'going' ? '#22c55e' : '#f59e0b'}
              />
              <Text style={[styles.statusText, { color: userStatus === 'going' ? '#22c55e' : '#f59e0b' }]}>
                {userStatus === 'going' ? 'Katılıyorsun' : 'İlgileniyorsun'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.leaveButton, { borderColor: '#ef4444' }]}
              onPress={handleLeave}
              disabled={isJoining}
            >
              <Text style={styles.leaveButtonText}>Ayrıl</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.interestedButton, { borderColor: colors.primary }]}
              onPress={() => handleJoin('interested')}
              disabled={isJoining}
            >
              <MaterialIcons name="star-outline" size={20} color={colors.primary} />
              <Text style={[styles.interestedButtonText, { color: colors.primary }]}>İlgileniyorum</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.joinButton, { backgroundColor: isFull ? colors.textTertiary : colors.primary }]}
              onPress={() => handleJoin('going')}
              disabled={isJoining || isFull}
            >
              {isJoining ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="check" size={20} color="#fff" />
                  <Text style={styles.joinButtonText}>{isFull ? 'Dolu' : 'Katıl'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  heroContainer: { height: 280, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 80 },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 20, marginTop: -40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: '600' },
  infoSubtitle: { fontSize: 13, marginTop: 2 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  description: { fontSize: 15, lineHeight: 24 },
  // Mini harita stilleri
  miniMapContainer: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  miniMap: {
    flex: 1,
  },
  miniMapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  miniMapOverlayText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  participantsList: { flexDirection: 'row', alignItems: 'center' },
  participantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  moreAvatar: { backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  moreText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: { fontSize: 16, fontWeight: '600' },
  statusBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  statusText: { fontSize: 15, fontWeight: '600' },
  leaveButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  leaveButtonText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
  interestedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  interestedButtonText: { fontSize: 15, fontWeight: '600' },
  joinButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  joinButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  errorText: { fontSize: 16, marginTop: 16 },
});

export default EventDetailScreen;
