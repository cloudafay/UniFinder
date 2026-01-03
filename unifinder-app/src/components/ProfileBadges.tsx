// Profilde Badge Gösterimi Komponenti
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { gamificationService, UserBadge } from '../services/gamificationService';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ProfileBadgesProps {
  userId: string;
  maxDisplay?: number;
  showTitle?: boolean;
  compact?: boolean;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#94a3b8',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

const ProfileBadges: React.FC<ProfileBadgesProps> = ({
  userId,
  maxDisplay = 3,
  showTitle = true,
  compact = false,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, [userId]);

  const loadBadges = async () => {
    try {
      const [topBadges, allBadges] = await Promise.all([
        gamificationService.getTopBadges(userId, maxDisplay),
        gamificationService.getUserBadges(userId),
      ]);
      setBadges(topBadges);
      setTotalCount(allBadges.length);
    } catch (error) {
      console.error('Badge yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || badges.length === 0) {
    return null;
  }

  const handlePress = () => {
    navigation.navigate('Badges', { userId });
  };

  if (compact) {
    return (
      <TouchableOpacity onPress={handlePress} style={styles.compactContainer}>
        <View style={styles.compactBadges}>
          {badges.slice(0, 3).map((userBadge, index) => (
            <View
              key={userBadge.id}
              style={[
                styles.compactBadge,
                {
                  backgroundColor: `${RARITY_COLORS[userBadge.badge?.rarity || 'common']}20`,
                  marginLeft: index > 0 ? -8 : 0,
                  zIndex: 3 - index,
                },
              ]}
            >
              <Text style={styles.compactBadgeIcon}>
                {userBadge.badge?.icon || '🏅'}
              </Text>
            </View>
          ))}
        </View>
        {totalCount > maxDisplay && (
          <Text style={[styles.moreText, { color: colors.textSecondary }]}>
            +{totalCount - maxDisplay}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {showTitle && (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <MaterialIcons name="military-tech" size={20} color="#fbbf24" />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Rozetler
            </Text>
          </View>
          <TouchableOpacity onPress={handlePress}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>
              Tümünü Gör ({totalCount})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgesScroll}
      >
        {badges.map((userBadge) => {
          const badge = userBadge.badge;
          if (!badge) return null;
          
          const rarityColor = RARITY_COLORS[badge.rarity] || RARITY_COLORS.common;
          
          return (
            <TouchableOpacity
              key={userBadge.id}
              style={[styles.badgeItem, { borderColor: `${rarityColor}40` }]}
              onPress={handlePress}
            >
              <View style={[styles.badgeIconContainer, { backgroundColor: `${rarityColor}20` }]}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
              </View>
              <Text
                style={[styles.badgeName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {badge.name_tr || badge.name}
              </Text>
              <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
            </TouchableOpacity>
          );
        })}

        {totalCount > maxDisplay && (
          <TouchableOpacity
            style={[styles.moreItem, { backgroundColor: colors.background }]}
            onPress={handlePress}
          >
            <Text style={[styles.moreCount, { color: colors.primary }]}>
              +{totalCount - maxDisplay}
            </Text>
            <Text style={[styles.moreLabel, { color: colors.textSecondary }]}>
              daha
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
  },
  badgesScroll: {
    gap: 12,
  },
  badgeItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 80,
  },
  badgeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeIcon: {
    fontSize: 24,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 70,
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  moreItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 60,
  },
  moreCount: {
    fontSize: 18,
    fontWeight: '700',
  },
  moreLabel: {
    fontSize: 11,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactBadges: {
    flexDirection: 'row',
  },
  compactBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  compactBadgeIcon: {
    fontSize: 14,
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ProfileBadges;
