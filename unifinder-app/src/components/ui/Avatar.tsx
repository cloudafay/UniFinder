// Avatar Component
// Profil fotoğrafı bileşeni

import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  online?: boolean;
  verified?: boolean;
  bordered?: boolean;
  borderColor?: string;
  style?: ViewStyle;
  onPress?: () => void;
  showEditBadge?: boolean;
  onEditPress?: () => void;
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
  xxl: 120,
};

const fontSizeMap: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
};

const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  online,
  verified,
  bordered = false,
  borderColor,
  style,
  onPress,
  showEditBadge = false,
  onEditPress,
}) => {
  const avatarSize = sizeMap[size];
  const fontSize = fontSizeMap[size];
  const statusSize = Math.max(avatarSize * 0.25, 8);
  const badgeSize = Math.max(avatarSize * 0.35, 20);

  const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getBackgroundColor = (name?: string): string => {
    if (!name) return '#64748b';
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
      '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
      '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
      '#d946ef', '#ec4899', '#f43f5e',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const containerStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    ...(bordered && {
      borderWidth: 2,
      borderColor: borderColor || Colors.primary,
      padding: 2,
    }),
  };

  const imageStyle: ViewStyle = {
    width: '100%',
    height: '100%',
    borderRadius: bordered ? (avatarSize - 8) / 2 : avatarSize / 2,
  };

  const renderContent = () => {
    if (source) {
      return (
        <Image
          source={{ uri: source }}
          style={imageStyle as any}
          resizeMode="cover"
        />
      );
    }

    return (
      <View
        style={[
          imageStyle,
          styles.placeholder,
          { backgroundColor: getBackgroundColor(name) },
        ]}
      >
        <Text style={[styles.initials, { fontSize }]}>
          {getInitials(name)}
        </Text>
      </View>
    );
  };

  const renderStatusIndicator = () => {
    if (online === undefined) return null;

    return (
      <View
        style={[
          styles.statusIndicator,
          {
            width: statusSize,
            height: statusSize,
            borderRadius: statusSize / 2,
            backgroundColor: online ? '#22c55e' : '#94a3b8',
            borderWidth: Math.max(statusSize * 0.2, 2),
            right: bordered ? 0 : -2,
            bottom: bordered ? 0 : -2,
          },
        ]}
      />
    );
  };

  const renderVerifiedBadge = () => {
    if (!verified) return null;

    const badgePosition = {
      right: bordered ? -2 : -4,
      bottom: bordered ? -2 : -4,
    };

    return (
      <View
        style={[
          styles.verifiedBadge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            ...badgePosition,
          },
        ]}
      >
        <MaterialIcons
          name="verified"
          size={badgeSize * 0.7}
          color="#fff"
        />
      </View>
    );
  };

  const renderEditBadge = () => {
    if (!showEditBadge) return null;

    return (
      <TouchableOpacity
        style={[
          styles.editBadge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
          },
        ]}
        onPress={onEditPress}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name="edit"
          size={badgeSize * 0.5}
          color="#fff"
        />
      </TouchableOpacity>
    );
  };

  const content = (
    <View style={[containerStyle, style]}>
      {renderContent()}
      {renderStatusIndicator()}
      {renderVerifiedBadge()}
      {renderEditBadge()}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
    borderColor: '#101322',
  },
  verifiedBadge: {
    position: 'absolute',
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#101322',
  },
  editBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#101322',
  },
});

export default Avatar;
