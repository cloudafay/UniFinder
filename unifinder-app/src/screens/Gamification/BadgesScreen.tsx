// Rozetler Ekranı
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { gamificationService, Badge, UserBadge } from '../../services/gamificationService';
import { RootStackParamList } from '../../navigation/types';

type BadgesScreenRouteProp = RouteProp<RootStackParamList, 'Badges'>;

const RARITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  common: { bg: '#94a3b820', text: '#94a3b8', border: '#94a3b840' },
  rare: { bg: '#3b82f620', text: '#3b82f6', border: '#3b82f640' },
  epic: { bg: '#a855f720', text: '#a855f7', border: '#a855f740' },
  legendary: { bg: '#f59e0b20', text: '#f59e0b', border: '#f59e0b40' },
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Yaygın',
  rare: 'Nadir',
  epic: 'Epik',
  legendary: 'Efsanevi',
};

const CATEGORY_LABELS: Record<string, string> = {
  social: 'Sosyal',
  activity: 'Aktivite',
  achievement: 'Başarı',
  special: 'Özel',
};

const BadgesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<BadgesScreenRouteProp>();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const targetUserId = route.params?.userId || user?.id;
  
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!targetUserId) return;
    
    try {
      const [badges, earned] = await Promise.all([
        gamificationService.getAllBadges(),
        gamificationService.getUserBadges(targetUserId),
      ]);
      
      setAllBadges(badges);
      setUserBadges(earned);
    } catch (error) {
      console.error('Rozet yükleme hatası:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
  const categories = [...new Set(allBadges.map(b => b.category))];
  
  const filteredBadges = selectedCategory 
    ? allBadges.filter(b => b.category === selectedCategory)
    : allBadges;

  const earnedCount = userBadges.length;
  const totalCount = allBadges.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Rozetler</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statsIcon}>
            <MaterialIcons name="emoji-events" size={32} color="#f59e0b" />
          </View>
          <View style={styles.statsContent}>
            <Text style={[styles.statsTitle, { color: colors.textPrimary }]}>
              {earnedCount} / {totalCount} Rozet
            </Text>
            <Text style={[styles.statsSubtitle, { color: colors.textSecondary }]}>
              {totalCount - earnedCount} rozet daha kazanabilirsin
            </Text>
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipActive,
              { borderColor: colors.border }
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[
              styles.categoryText,
              { color: !selectedCategory ? colors.primary : colors.textSecondary }
            ]}>
              Tümü
            </Text>
          </TouchableOpacity>
          
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
                { borderColor: colors.border }
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[
                styles.categoryText,
                { color: selectedCategory === cat ? colors.primary : colors.textSecondary }
              ]}>
                {CATEGORY_LABELS[cat] || cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Badges Grid */}
        <View style={styles.badgesGrid}>
          {filteredBadges.map((badge) => {
            const isEarned = earnedBadgeIds.has(badge.id);
            const rarityStyle = RARITY_COLORS[badge.rarity] || RARITY_COLORS.common;
            
            return (
              <View 
                key={badge.id} 
                style={[
                  styles.badgeCard,
                  { backgroundColor: colors.surface },
                  !isEarned && styles.badgeLocked
                ]}
              >
                <View style={[styles.badgeIconContainer, { backgroundColor: rarityStyle.bg }]}>
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  {!isEarned && (
                    <View style={styles.lockOverlay}>
                      <MaterialIcons name="lock" size={20} color="rgba(255,255,255,0.8)" />
                    </View>
                  )}
                </View>
                
                <Text 
                  style={[styles.badgeName, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {badge.name_tr || badge.name}
                </Text>
                
                <Text 
                  style={[styles.badgeDescription, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {badge.description_tr || badge.description}
                </Text>
                
                <View style={[styles.rarityBadge, { backgroundColor: rarityStyle.bg, borderColor: rarityStyle.border }]}>
                  <Text style={[styles.rarityText, { color: rarityStyle.text }]}>
                    {RARITY_LABELS[badge.rarity]}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  placeholder: { width: 40 },
  content: { flex: 1, paddingHorizontal: 16 },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  statsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f59e0b20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statsContent: { flex: 1 },
  statsTitle: { fontSize: 18, fontWeight: '700' },
  statsSubtitle: { fontSize: 13, marginTop: 4 },
  categoryScroll: { marginBottom: 16 },
  categoryContainer: { gap: 8 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: '#6366f1',
  },
  categoryText: { fontSize: 14, fontWeight: '500' },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  badgeLocked: { opacity: 0.5 },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeIcon: { fontSize: 32 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  badgeDescription: { fontSize: 11, textAlign: 'center', marginBottom: 8, lineHeight: 16 },
  rarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  rarityText: { fontSize: 10, fontWeight: '600' },
});

export default BadgesScreen;
