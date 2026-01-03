// Message Card Component
// Mesaj listesi için mesaj kartı - Glassmorphism tasarım

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants';

interface MessageCardProps {
  user: {
    name: string;
    photo: string;
    isOnline?: boolean;
  };
  lastMessage: string;
  time: string;
  unreadCount?: number;
  isNewMatch?: boolean;
  onPress: () => void;
}

const MessageCard: React.FC<MessageCardProps> = ({
  user,
  lastMessage,
  time,
  unreadCount = 0,
  isNewMatch = false,
  onPress,
}) => {
  const { colors, isDark } = useTheme();
  const hasUnread = unreadCount > 0;

  const defaultPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=100&background=6366f1&color=fff`;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.6)',
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(255, 255, 255, 0.5)',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${user.name} ile sohbet${hasUnread ? `, ${unreadCount} okunmamış mesaj` : ''}`}
      accessibilityRole="button"
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: user.photo || defaultPhoto }}
          style={styles.avatar}
          accessibilityLabel={`${user.name} profil fotoğrafı`}
        />
        {user.isOnline && <View style={styles.onlineIndicator} />}
        {isNewMatch && (
          <View style={styles.newMatchBadge}>
            <Text style={styles.newMatchText}>YENİ</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[
              styles.userName,
              { color: colors.textPrimary },
              hasUnread && styles.userNameUnread,
            ]}
            numberOfLines={1}
          >
            {user.name}
          </Text>
          <Text
            style={[
              styles.time,
              { color: hasUnread ? Colors.primary : colors.textTertiary },
              hasUnread && styles.timeUnread,
            ]}
          >
            {time}
          </Text>
        </View>

        <View style={styles.messageRow}>
          <Text
            style={[
              styles.lastMessage,
              { color: hasUnread ? colors.textPrimary : colors.textSecondary },
              hasUnread && styles.lastMessageUnread,
            ]}
            numberOfLines={1}
          >
            {lastMessage || (isNewMatch ? 'Yeni eşleşme! Merhaba de 👋' : 'Henüz mesaj yok')}
          </Text>

          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      },
      default: {},
    }),
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  newMatchBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newMatchText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  userNameUnread: {
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    marginLeft: 8,
  },
  timeUnread: {
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  lastMessageUnread: {
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default MessageCard;
