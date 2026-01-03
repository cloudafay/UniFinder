// Refresh Control Component
// Pull-to-Refresh için özelleştirilmiş bileşen

import React from 'react';
import { RefreshControl as RNRefreshControl, Platform } from 'react-native';
import { Colors } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

interface RefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
  tintColor?: string;
  title?: string;
}

const RefreshControl: React.FC<RefreshControlProps> = ({
  refreshing,
  onRefresh,
  tintColor,
  title,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <RNRefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={tintColor || Colors.primary}
      colors={[Colors.primary, '#EC4899', '#10B981']} // Android için çoklu renk
      progressBackgroundColor={isDark ? colors.surface : '#fff'}
      title={title}
      titleColor={colors.textSecondary}
      {...Platform.select({
        ios: {},
        android: {
          progressViewOffset: 20,
        },
        default: {},
      })}
    />
  );
};

export default RefreshControl;
