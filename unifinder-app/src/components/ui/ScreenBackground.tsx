// Screen Background Component
// Tüm ekranlarda kullanılacak bulanık arka plan

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface ScreenBackgroundProps {
  children: React.ReactNode;
  intensity?: number; // Blur yoğunluğu (0-100)
  showGradient?: boolean;
}

const ScreenBackground: React.FC<ScreenBackgroundProps> = ({
  children,
  intensity = 80,
  showGradient = true,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={styles.container}>
      {/* Arka plan rengi */}
      <View
        style={[
          styles.background,
          { backgroundColor: isDark ? '#101322' : '#f6f6f8' },
        ]}
      />

      {/* Dekoratif gradient daireler */}
      {showGradient && (
        <>
          <View style={[styles.gradientCircle, styles.circle1]}>
            <LinearGradient
              colors={isDark ? ['rgba(19, 55, 236, 0.3)', 'rgba(19, 55, 236, 0)'] : ['rgba(19, 55, 236, 0.15)', 'rgba(19, 55, 236, 0)']}
              style={styles.gradient}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </View>
          <View style={[styles.gradientCircle, styles.circle2]}>
            <LinearGradient
              colors={isDark ? ['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0)'] : ['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0)']}
              style={styles.gradient}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </View>
        </>
      )}

      {/* Blur katmanı */}
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={styles.blurContainer}
      >
        {children}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientCircle: {
    position: 'absolute',
    borderRadius: 999,
    overflow: 'hidden',
  },
  circle1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.2,
    right: -width * 0.2,
  },
  circle2: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: height * 0.1,
    left: -width * 0.2,
  },
  gradient: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
  },
});

export default ScreenBackground;
