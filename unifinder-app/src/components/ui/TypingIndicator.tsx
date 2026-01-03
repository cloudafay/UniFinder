// Typing Indicator Component
// Chat'te "yazıyor..." animasyonu

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface TypingIndicatorProps {
  isTyping?: boolean;
  userName?: string;
  showText?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isTyping = true,
  userName,
  showText = true,
}) => {
  const { colors, isDark } = useTheme();
  
  // 3 nokta için animasyon değerleri
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isTyping) return;

    const createDotAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
    };

    const anim1 = createDotAnimation(dot1, 0);
    const anim2 = createDotAnimation(dot2, 150);
    const anim3 = createDotAnimation(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [isTyping, dot1, dot2, dot3]);

  if (!isTyping) return null;

  const getDotStyle = (dot: Animated.Value) => {
    const translateY = dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -6],
    });

    const opacity = dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    });

    return {
      transform: [{ translateY }],
      opacity,
    };
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isDark ? colors.glass : 'rgba(0,0,0,0.05)',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: colors.textSecondary },
              getDotStyle(dot1),
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: colors.textSecondary },
              getDotStyle(dot2),
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: colors.textSecondary },
              getDotStyle(dot3),
            ]}
          />
        </View>
      </View>
      
      {showText && (
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          {userName ? `${userName} yazıyor...` : 'yazıyor...'}
        </Text>
      )}
    </View>
  );
};

// Alternatif: Inline typing indicator (mesaj listesinde kullanım için)
export const InlineTypingIndicator: React.FC<{ color?: string }> = ({ color }) => {
  const { colors } = useTheme();
  const dotColor = color || colors.textSecondary;
  
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
    };

    const anims = [
      createAnimation(dot1, 0),
      createAnimation(dot2, 200),
      createAnimation(dot3, 400),
    ];

    anims.forEach(anim => anim.start());

    return () => anims.forEach(anim => anim.stop());
  }, []);

  const getOpacity = (dot: Animated.Value) => {
    return dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });
  };

  return (
    <View style={styles.inlineContainer}>
      <Animated.View
        style={[styles.inlineDot, { backgroundColor: dotColor, opacity: getOpacity(dot1) }]}
      />
      <Animated.View
        style={[styles.inlineDot, { backgroundColor: dotColor, opacity: getOpacity(dot2) }]}
      />
      <Animated.View
        style={[styles.inlineDot, { backgroundColor: dotColor, opacity: getOpacity(dot3) }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  // Inline styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  inlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default TypingIndicator;
