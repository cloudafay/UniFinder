// Skeleton Loading Component
// Veri yüklenirken placeholder animasyonları

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface SkeletonProps {
  width?: number | `${number}%` | 'auto';
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

// Temel Skeleton bileşeni
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%' as const,
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          opacity,
        },
        style,
      ]}
    />
  );
};

// Discover Card Skeleton
export const DiscoverCardSkeleton: React.FC = () => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.discoverCard, { backgroundColor: colors.surface }]}>
      <Skeleton width="100%" height={400} borderRadius={24} />
      <View style={styles.discoverCardContent}>
        <Skeleton width="60%" height={28} borderRadius={8} />
        <View style={styles.discoverCardRow}>
          <Skeleton width={80} height={20} borderRadius={10} />
          <Skeleton width={100} height={20} borderRadius={10} style={{ marginLeft: 8 }} />
        </View>
        <Skeleton width="80%" height={16} borderRadius={6} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
};

// Message List Item Skeleton
export const MessageItemSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.messageItem, { backgroundColor: colors.surface }]}>
      <Skeleton width={56} height={56} borderRadius={28} />
      <View style={styles.messageContent}>
        <Skeleton width="50%" height={18} borderRadius={6} />
        <Skeleton width="70%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
      <View style={styles.messageRight}>
        <Skeleton width={40} height={12} borderRadius={4} />
      </View>
    </View>
  );
};

// Message List Skeleton (birden fazla item)
export const MessageListSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <MessageItemSkeleton key={index} />
      ))}
    </View>
  );
};

// Notification Item Skeleton
export const NotificationItemSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.notificationItem, { backgroundColor: colors.surface }]}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.notificationContent}>
        <Skeleton width="40%" height={16} borderRadius={4} />
        <Skeleton width="90%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
        <Skeleton width={60} height={12} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
};

// Notification List Skeleton
export const NotificationListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <NotificationItemSkeleton key={index} />
      ))}
    </View>
  );
};

// Profile Skeleton
export const ProfileSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.profileContainer}>
      {/* Avatar */}
      <View style={styles.profileHeader}>
        <Skeleton width={100} height={100} borderRadius={50} />
        <Skeleton width="50%" height={24} borderRadius={8} style={{ marginTop: 16 }} />
        <Skeleton width="30%" height={16} borderRadius={6} style={{ marginTop: 8 }} />
      </View>

      {/* Stats */}
      <View style={styles.profileStats}>
        <View style={styles.profileStat}>
          <Skeleton width={40} height={24} borderRadius={6} />
          <Skeleton width={60} height={14} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.profileStat}>
          <Skeleton width={40} height={24} borderRadius={6} />
          <Skeleton width={60} height={14} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.profileStat}>
          <Skeleton width={40} height={24} borderRadius={6} />
          <Skeleton width={60} height={14} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </View>

      {/* Bio */}
      <View style={[styles.profileSection, { backgroundColor: colors.glass }]}>
        <Skeleton width="100%" height={14} borderRadius={4} />
        <Skeleton width="80%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
        <Skeleton width="60%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
      </View>

      {/* Interests */}
      <View style={styles.interestsRow}>
        <Skeleton width={80} height={32} borderRadius={16} />
        <Skeleton width={100} height={32} borderRadius={16} style={{ marginLeft: 8 }} />
        <Skeleton width={70} height={32} borderRadius={16} style={{ marginLeft: 8 }} />
      </View>
    </View>
  );
};

// Chat Messages Skeleton
export const ChatMessagesSkeleton: React.FC<{ count?: number }> = ({ count = 10 }) => {
  return (
    <View style={styles.chatContainer}>
      {Array.from({ length: count }).map((_, index) => {
        const isMe = index % 3 === 0;
        return (
          <View
            key={index}
            style={[
              styles.chatMessage,
              isMe ? styles.chatMessageRight : styles.chatMessageLeft,
            ]}
          >
            <Skeleton
              width={isMe ? 180 : 220}
              height={isMe ? 40 : 60}
              borderRadius={16}
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  // Discover Card
  discoverCard: {
    borderRadius: 24,
    padding: 16,
    margin: 16,
  },
  discoverCardContent: {
    marginTop: 16,
  },
  discoverCardRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  // Message Item
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  messageRight: {
    marginLeft: 8,
  },
  // Notification Item
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  // Profile
  profileContainer: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  profileStat: {
    alignItems: 'center',
  },
  profileSection: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // Chat
  chatContainer: {
    padding: 16,
  },
  chatMessage: {
    marginVertical: 4,
  },
  chatMessageLeft: {
    alignSelf: 'flex-start',
  },
  chatMessageRight: {
    alignSelf: 'flex-end',
  },
});

export default Skeleton;
