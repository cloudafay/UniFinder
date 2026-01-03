// Badge Component
// Bildirim sayısı ve durum göstergesi

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  // For count badge
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  
  // For label badge
  label?: string;
  
  // For icon badge
  icon?: keyof typeof MaterialIcons.glyphMap;
  
  // Styling
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  outline?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  
  // Position (for wrapping children)
  children?: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  offset?: { x: number; y: number };
}

const variantColors: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  primary: { bg: Colors.primary, text: '#fff', border: Colors.primary },
  secondary: { bg: '#64748b', text: '#fff', border: '#64748b' },
  success: { bg: '#22c55e', text: '#fff', border: '#22c55e' },
  warning: { bg: '#f59e0b', text: '#fff', border: '#f59e0b' },
  danger: { bg: '#ef4444', text: '#fff', border: '#ef4444' },
  info: { bg: '#0ea5e9', text: '#fff', border: '#0ea5e9' },
};

const sizeStyles: Record<BadgeSize, { height: number; minWidth: number; fontSize: number; paddingH: number; iconSize: number; dotSize: number }> = {
  sm: { height: 16, minWidth: 16, fontSize: 10, paddingH: 4, iconSize: 10, dotSize: 8 },
  md: { height: 20, minWidth: 20, fontSize: 12, paddingH: 6, iconSize: 12, dotSize: 10 },
  lg: { height: 24, minWidth: 24, fontSize: 14, paddingH: 8, iconSize: 14, dotSize: 12 },
};

const Badge: React.FC<BadgeProps> = ({
  count,
  maxCount = 99,
  showZero = false,
  label,
  icon,
  variant = 'primary',
  size = 'md',
  dot = false,
  outline = false,
  style,
  textStyle,
  children,
  position = 'top-right',
  offset = { x: 0, y: 0 },
}) => {
  const colors = variantColors[variant];
  const sizes = sizeStyles[size];

  // Don't render if count is 0 and showZero is false
  if (count !== undefined && count === 0 && !showZero && !dot) {
    return children ? <View>{children}</View> : null;
  }

  const getDisplayValue = (): string => {
    if (count !== undefined) {
      return count > maxCount ? `${maxCount}+` : String(count);
    }
    return label || '';
  };

  const getBadgeStyle = (): ViewStyle => {
    if (dot) {
      return {
        width: sizes.dotSize,
        height: sizes.dotSize,
        borderRadius: sizes.dotSize / 2,
        backgroundColor: outline ? 'transparent' : colors.bg,
        borderWidth: outline ? 2 : 0,
        borderColor: colors.border,
      };
    }

    const hasContent = count !== undefined || label || icon;
    const isCircle = !label && !icon && count !== undefined && count < 10;

    return {
      height: sizes.height,
      minWidth: isCircle ? sizes.height : sizes.minWidth,
      paddingHorizontal: hasContent && !isCircle ? sizes.paddingH : 0,
      borderRadius: sizes.height / 2,
      backgroundColor: outline ? 'transparent' : colors.bg,
      borderWidth: outline ? 1.5 : 0,
      borderColor: colors.border,
    };
  };

  const getPositionStyle = (): ViewStyle => {
    const baseOffset = -sizes.height / 3;
    
    switch (position) {
      case 'top-right':
        return { top: baseOffset + offset.y, right: baseOffset + offset.x };
      case 'top-left':
        return { top: baseOffset + offset.y, left: baseOffset + offset.x };
      case 'bottom-right':
        return { bottom: baseOffset + offset.y, right: baseOffset + offset.x };
      case 'bottom-left':
        return { bottom: baseOffset + offset.y, left: baseOffset + offset.x };
      default:
        return { top: baseOffset, right: baseOffset };
    }
  };

  const badgeElement = (
    <View
      style={[
        styles.badge,
        getBadgeStyle(),
        children ? styles.positioned : undefined,
        children ? getPositionStyle() : undefined,
        style,
      ]}
    >
      {!dot && icon && (
        <MaterialIcons
          name={icon}
          size={sizes.iconSize}
          color={outline ? colors.bg : colors.text}
        />
      )}
      {!dot && (count !== undefined || label) && (
        <Text
          style={[
            styles.text,
            {
              fontSize: sizes.fontSize,
              color: outline ? colors.bg : colors.text,
            },
            textStyle,
          ]}
        >
          {getDisplayValue()}
        </Text>
      )}
    </View>
  );

  if (children) {
    return (
      <View style={styles.container}>
        {children}
        {badgeElement}
      </View>
    );
  }

  return badgeElement;
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  positioned: {
    position: 'absolute',
    zIndex: 1,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Badge;
