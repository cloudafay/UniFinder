// UniFinder Color Palette
// Tasarım dosyalarından çıkarılan renk paleti

export const Colors = {
  // Primary Colors - Modern Indigo
  primary: '#6366F1', // Indigo 500
  primaryDark: '#4F46E5', // Indigo 600
  primaryLight: '#818CF8', // Indigo 400

  // Background Colors
  backgroundLight: '#F8FAFC', // Slate 50
  backgroundDark: '#0F172A', // Slate 900

  // Glass Effect Colors
  glass: {
    light: 'rgba(255, 255, 255, 0.7)',
    dark: 'rgba(15, 23, 42, 0.7)',
    border: {
      light: 'rgba(255, 255, 255, 0.5)',
      dark: 'rgba(255, 255, 255, 0.1)',
    },
  },

  // Text Colors
  text: {
    primary: '#0F172A',      // Slate 900
    secondary: '#475569',    // Slate 600
    tertiary: '#94A3B8',     // Slate 400
    white: '#ffffff',
    dark: '#0F172A',         // Slate 900
  },

  // Status Colors
  status: {
    success: '#10B981',      // Emerald 500
    error: '#EF4444',        // Red 500
    warning: '#F59E0B',      // Amber 500
    info: '#3B82F6',         // Blue 500
    active: '#10B981',       // Emerald 500
  },

  // Action Button Colors
  actions: {
    like: '#6366F1',         // Indigo
    pass: '#F43F5E',         // Rose 500
    superLike: '#0EA5E9',    // Sky 500
  },

  // Border Colors
  border: {
    light: '#E2E8F0',        // Slate 200
    dark: 'rgba(255, 255, 255, 0.1)',
  },

  // Shadow Colors
  shadow: {
    primary: 'rgba(99, 102, 241, 0.35)',
    dark: 'rgba(0, 0, 0, 0.4)',
  },

  // Gradient Colors
  gradients: {
    primary: ['#6366F1', '#818CF8'] as const,
    purple: ['#8B5CF6', '#A78BFA'] as const,
    background: ['rgba(248, 250, 252, 0.4)', 'rgba(248, 250, 252, 0.9)'] as const,
  },

  // Top-level shortcuts for common status colors (used by many screens)
  secondary: '#64748B',    // Slate 500
  success: '#10B981',      // Emerald 500
  error: '#EF4444',        // Red 500
  warning: '#F59E0B',      // Amber 500
  info: '#3B82F6',         // Blue 500
} as const;

export default Colors;
