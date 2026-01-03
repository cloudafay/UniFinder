// Etkinlikler Ekranı
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { eventService, Event } from '../../services/eventService';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORY_ICONS: Record<string, string> = {
  party: '🎉',
  study: '📚',
  sports: '⚽',
  social: '☕',
  other: '📌',
};

const CATEGORY_LABELS: Record<string, string> = {
  party: 'Parti',
  study: 'Çalışma',
  sports: 'Spor',
  social: 'Sosyal',
  other: 'Diğer',
};

const EventsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters = selectedCategory ? { category: selectedCategory } : undefined;
      const { data, error } = await eventService.getEvents(filters);
      
      if (data) {
        setEvents(data);
      }
      if (error) {
        console.error('Etkinlik yükleme hatası:', error);
      }
    } catch (error) {
      console.error('Etkinlik yükleme hatası:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  // Sayfa her odaklandığında etkinlikleri yenile
  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Yarın';
    if (diffDays < 7) return `${diffDays} gün sonra`;
    
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={[styles.eventCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      activeOpacity={0.7}
    >
      {/* Gizli etkinlik için kilit overlay */}
      {!item.is_public && (
        <View style={styles.privateOverlay}>
          <View style={[styles.privateBadge, { backgroundColor: 'rgba(239, 68, 68, 0.9)' }]}>
            <MaterialIcons name="lock" size={14} color="#fff" />
            <Text style={styles.privateText}>Gizli</Text>
          </View>
        </View>
      )}
      
      {(item.image_url || item.cover_image) ? (
        <Image source={{ uri: item.image_url || item.cover_image || '' }} style={styles.eventImage} />
      ) : (
        <View style={[styles.eventImagePlaceholder, { backgroundColor: `${colors.primary}20` }]}>
          <Text style={styles.categoryEmoji}>{CATEGORY_ICONS[item.category] || '📌'}</Text>
        </View>
      )}
      
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={styles.categoryBadgeText}>
              {CATEGORY_ICONS[item.category]} {CATEGORY_LABELS[item.category]}
            </Text>
          </View>
          <Text style={[styles.eventDate, { color: colors.primary }]}>
            {formatDate(item.event_date)}
          </Text>
        </View>
        
        <Text style={[styles.eventTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={styles.eventMeta}>
          <View style={styles.metaItem}>
            <MaterialIcons name="schedule" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {formatTime(item.event_date)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="location-on" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.location_name || item.location}
            </Text>
          </View>
        </View>
        
        <View style={styles.eventFooter}>
          <View style={styles.participantsInfo}>
            <MaterialIcons name="people" size={16} color={colors.textSecondary} />
            <Text style={[styles.participantsText, { color: colors.textSecondary }]}>
              {item.participant_count || 0} / {item.capacity || item.max_participants}
            </Text>
          </View>
          <View style={styles.footerRight}>
            {!item.is_public && (
              <MaterialIcons name="lock" size={16} color={colors.textTertiary} style={{ marginRight: 4 }} />
            )}
            <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const categories = ['party', 'study', 'sports', 'social', 'other'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Etkinlikler</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('CreateEvent' as never)} 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        data={[null, ...categories]}
        keyExtractor={(item) => item || 'all'}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
        contentContainerStyle={styles.categoryContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item && styles.categoryChipActive,
              { borderColor: colors.border }
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={[
              styles.categoryChipText,
              { color: selectedCategory === item ? colors.primary : colors.textSecondary }
            ]}>
              {item ? `${CATEGORY_ICONS[item]} ${CATEGORY_LABELS[item]}` : '🌟 Tümü'}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Events List */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="event" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                Etkinlik Bulunamadı
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                İlk etkinliği sen oluştur!
              </Text>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('CreateEvent' as never)}
              >
                <MaterialIcons name="add" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Etkinlik Oluştur</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryList: { maxHeight: 50 },
  categoryContainer: { paddingHorizontal: 16, gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: '#6366f1',
  },
  categoryChipText: { fontSize: 13, fontWeight: '500' },
  listContent: { padding: 16, paddingBottom: 100 },
  eventCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  privateOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  privateText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  eventImage: { width: '100%', height: 140 },
  eventImagePlaceholder: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: { fontSize: 40 },
  eventContent: { padding: 16 },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: { fontSize: 12, fontWeight: '500' },
  eventDate: { fontSize: 13, fontWeight: '600' },
  eventTitle: { fontSize: 17, fontWeight: '600', marginBottom: 8 },
  eventMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  metaText: { fontSize: 13 },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  participantsInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  participantsText: { fontSize: 13 },
  footerRight: { flexDirection: 'row', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptyText: { fontSize: 14, marginTop: 8 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  createButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default EventsScreen;
