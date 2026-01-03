// Glass Panel Component
// Glassmorphism efektli panel/card

import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../constants';

type PanelVariant = 'default' | 'elevated' | 'outlined' | 'filled';

interface GlassPanelProps {
  children: React.ReactNode;
  variant?: PanelVariant;
  dark?: boolean;
  style?: ViewStyle;
  padding?: number | 'none' | 'sm' | 'md' | 'lg';
  rounded?: number | 'sm' | 'md' | 'lg' | 'xl';
  onPress?: () => void;
  activeOpacity?: number;
  glowColor?: string;
  borderColor?: string;
}

const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  variant = 'default',
  dark = false,
  style,
  padding = 'md',
  rounded = 'lg',
  onPress,
  activeOpacity = 0.8,
  glowColor,
  borderColor,
}) => {
  const getPadding = (): number => {
    if (typeof padding === 'number') return padding;
    switch (padding) {
      case 'none': return 0;
      case 'sm': return 12;
      case 'md': return 16;
      case 'lg': return 24;
      default: return 16;
    }
  };

  const getBorderRadius = (): number => {
    if (typeof rounded === 'number') return rounded;
    switch (rounded) {
      case 'sm': return 8;
      case 'md': return 12;
      case 'lg': return 16;
      case 'xl': return 24;
      default: return 16;
    }
  };

  const getVariantStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      padding: getPadding(),
      borderRadius: getBorderRadius(),
    };

    if (dark) {
      switch (variant) {
        case 'default':
          return {
            ...baseStyle,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderWidth: 1,
            borderColor: borderColor || 'rgba(255, 255, 255, 0.08)',
            ...Platform.select({
              web: {
                backdropFilter: 'blur(20px)',
              },
              default: {},
            }),
          };
        case 'elevated':
          return {
            ...baseStyle,
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            borderWidth: 1,
            borderColor: borderColor || 'rgba(255, 255, 255, 0.1)',
            ...Platform.select({
              web: {
                backdropFilter: 'blur(24px)',
                boxShadow: glowColor 
                  ? `0 8px 32px ${glowColor}40`
                  : '0 8px 32px rgba(0, 0, 0, 0.3)',
              },
              default: {
                elevation: 8,
                shadowColor: glowColor || '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
              },
            }),
          };
        case 'outlined':
          return {
            ...baseStyle,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: borderColor || 'rgba(255, 255, 255, 0.2)',
          };
        case 'filled':
          return {
            ...baseStyle,
            backgroundColor: 'rgba(16, 19, 34, 0.9)',
            borderWidth: 1,
            borderColor: borderColor || 'rgba(255, 255, 255, 0.05)',
          };
        default:
          return baseStyle;
      }
    } else {
      // Light mode
      switch (variant) {
        case 'default':
          return {
            ...baseStyle,
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            borderWidth: 1,
            borderColor: borderColor || 'rgba(255, 255, 255, 0.6)',
            ...Platform.select({
              web: {
                backdropFilter: 'blur(24px)',
              },
              default: {},
            }),
          };
        case 'elevated':
          return {
            ...baseStyle,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderWidth: 1,
            borderColor: borderColor || 'rgba(0, 0, 0, 0.05)',
            ...Platform.select({
              web: {
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              },
              default: {
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
              },
            }),
          };
        case 'outlined':
          return {
            ...baseStyle,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: borderColor || 'rgba(0, 0, 0, 0.1)',
          };
        case 'filled':
          return {
            ...baseStyle,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: borderColor || 'rgba(0, 0, 0, 0.05)',
          };
        default:
          return baseStyle;
      }
    }
  };

  const panelStyle: ViewStyle = {
    ...getVariantStyle(),
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={panelStyle}
        onPress={onPress}
        activeOpacity={activeOpacity}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={panelStyle}>{children}</View>;
};

export default GlassPanel;
