// Style Utilities
// Platform-aware style helpers

import { Platform, ViewStyle } from 'react-native';

/**
 * Creates a cross-platform shadow style
 * Web uses boxShadow, native uses shadow* properties
 */
export const createShadow = (
  color: string,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number = 4
): ViewStyle => {
  // Convert hex color to rgba for web
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const rgbaColor = color.startsWith('#') ? hexToRgba(color, opacity) : color;

  return Platform.select({
    web: {
      boxShadow: `0 ${offsetY}px ${radius}px ${rgbaColor}`,
    } as ViewStyle,
    default: {
      shadowColor: color,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
      elevation: elevation,
    },
  }) as ViewStyle;
};

/**
 * Creates primary button shadow
 */
export const primaryShadow = (): ViewStyle => {
  return createShadow('#1337ec', 4, 0.4, 16, 8);
};

/**
 * Creates card shadow
 */
export const cardShadow = (): ViewStyle => {
  return createShadow('#000000', 4, 0.1, 12, 4);
};

/**
 * Creates subtle shadow
 */
export const subtleShadow = (): ViewStyle => {
  return createShadow('#000000', 2, 0.05, 8, 2);
};

/**
 * Predefined shadow styles
 */
export const Shadows = {
  sm: createShadow('#000000', 2, 0.05, 4, 2),
  md: createShadow('#000000', 4, 0.1, 8, 4),
  lg: createShadow('#000000', 8, 0.15, 16, 8),
  xl: createShadow('#000000', 12, 0.2, 24, 12),
  primary: createShadow('#1337ec', 4, 0.4, 14, 8),
  danger: createShadow('#ef4444', 4, 0.4, 14, 8),
  success: createShadow('#22c55e', 4, 0.3, 12, 6),
};

export default { createShadow, primaryShadow, cardShadow, subtleShadow, Shadows };

