// UniFinder Theme Configuration
// Tasarım dosyalarından çıkarılan tema ayarları

export const Theme = {
  // Font Family
  fonts: {
    primary: 'Inter',
    display: 'Inter',
  },

  // Font Weights
  fontWeights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Font Sizes
  fontSizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 34,
  },

  // Border Radius
  borderRadius: {
    sm: 8,
    DEFAULT: 16,
    md: 12,
    lg: 24,
    xl: 32,
    '2xl': 40,
    full: 9999,
  },

  // Spacing (4px base)
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    10: 40,
    12: 48,
    14: 56,
    16: 64,
  },

  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 32,
      elevation: 12,
    },
    primary: {
      shadowColor: '#1337ec',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.39,
      shadowRadius: 14,
      elevation: 8,
    },
  },

  // Glass Effect Styles
  glass: {
    light: {
      backgroundColor: 'rgba(255, 255, 255, 0.65)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    dark: {
      backgroundColor: 'rgba(16, 19, 34, 0.65)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
  },

  // Animation Durations
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
} as const;

// Theme Colors Interface
export interface ThemeColors {
  // Background
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;

  // Surface (cards, panels)
  surface: string;
  surfaceSecondary: string;
  surfaceElevated: string;

  // Glass
  glass: string;
  glassBorder: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Border
  border: string;
  borderSecondary: string;

  // Primary
  primary: string;
  primaryDark: string;
  primaryLight: string;

  // Status
  success: string;
  error: string;
  warning: string;
  info: string;
  secondary: string;  // Added for screen compatibility

  // Actions
  like: string;
  pass: string;
  superLike: string;

  // Shadows
  shadow: string;
  shadowPrimary: string;

  // Input
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;

  // Tab Bar
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;

  // Card
  cardBackground: string;
  cardBorder: string;

  // Overlay
  overlay: string;
  overlayLight: string;
}

// Light Theme Colors
export const lightTheme: ThemeColors = {
  // Background
  background: '#F8FAFC', // Slate 50
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#F1F5F9', // Slate 100

  // Surface
  surface: 'rgba(255, 255, 255, 0.8)',
  surfaceSecondary: 'rgba(255, 255, 255, 0.95)',
  surfaceElevated: '#FFFFFF',

  // Glass - More modern blur feel
  glass: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.5)',

  // Text - Modern Slate Scale
  textPrimary: '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  textTertiary: '#94A3B8', // Slate 400
  textInverse: '#FFFFFF',

  // Border
  border: '#E2E8F0', // Slate 200
  borderSecondary: '#F1F5F9', // Slate 100

  // Primary - Modern Indigo
  primary: '#6366F1', // Indigo 500
  primaryDark: '#4F46E5', // Indigo 600
  primaryLight: '#818CF8', // Indigo 400

  // Status
  success: '#10B981', // Emerald 500
  error: '#EF4444', // Red 500
  warning: '#F59E0B', // Amber 500
  info: '#3B82F6', // Blue 500
  secondary: '#64748B', // Slate 500

  // Actions
  like: '#6366F1', // Indigo
  pass: '#F43F5E', // Rose 500
  superLike: '#0EA5E9', // Sky 500

  // Shadows - Softer & Colored
  shadow: 'rgba(148, 163, 184, 0.1)',
  shadowPrimary: 'rgba(99, 102, 241, 0.25)',

  // Input
  inputBackground: '#F8FAFC',
  inputBorder: '#E2E8F0',
  inputText: '#0F172A',
  inputPlaceholder: '#94A3B8',

  // Tab Bar
  tabBarBackground: 'rgba(255, 255, 255, 0.9)',
  tabBarActive: '#6366F1',
  tabBarInactive: '#94A3B8',

  // Card
  cardBackground: '#FFFFFF',
  cardBorder: 'rgba(226, 232, 240, 0.6)',

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.6)',
  overlayLight: 'rgba(15, 23, 42, 0.3)',
};

// Dark Theme Colors
export const darkTheme: ThemeColors = {
  // Background - Deep Modern Navy
  background: '#0F172A', // Slate 900
  backgroundSecondary: '#1E293B', // Slate 800
  backgroundTertiary: '#334155', // Slate 700

  // Surface
  surface: 'rgba(30, 41, 59, 0.8)',
  surfaceSecondary: 'rgba(51, 65, 85, 0.8)',
  surfaceElevated: '#1E293B',

  // Glass
  glass: 'rgba(15, 23, 42, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',

  // Text
  textPrimary: '#F8FAFC', // Slate 50
  textSecondary: '#CBD5E1', // Slate 300
  textTertiary: '#64748B', // Slate 500
  textInverse: '#0F172A',

  // Border
  border: '#334155', // Slate 700
  borderSecondary: '#1E293B',

  // Primary
  primary: '#818CF8', // Indigo 400 (Lighter for dark mode)
  primaryDark: '#6366F1', // Indigo 500
  primaryLight: '#A5B4FC', // Indigo 300

  // Status
  success: '#34D399', // Emerald 400
  error: '#F87171', // Red 400
  warning: '#FBBF24', // Amber 400
  info: '#60A5FA', // Blue 400
  secondary: '#94A3B8',

  // Actions
  like: '#818CF8',
  pass: '#FB7185', // Rose 400
  superLike: '#38BDF8', // Sky 400

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.5)',
  shadowPrimary: 'rgba(99, 102, 241, 0.4)',

  // Input
  inputBackground: '#1E293B',
  inputBorder: '#334155',
  inputText: '#F8FAFC',
  inputPlaceholder: '#64748B',

  // Tab Bar
  tabBarBackground: 'rgba(15, 23, 42, 0.9)',
  tabBarActive: '#818CF8',
  tabBarInactive: '#64748B',

  // Card
  cardBackground: '#1E293B',
  cardBorder: 'rgba(255, 255, 255, 0.05)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.6)',
};

// Get theme colors based on mode
export const getThemeColors = (isDark: boolean): ThemeColors => {
  return isDark ? darkTheme : lightTheme;
};

export default Theme;
