// Confetti Animation Component
// Match olunca confetti efekti

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Konfeti renkleri
const CONFETTI_COLORS = [
  '#FF6B6B', // Kırmızı
  '#4ECDC4', // Turkuaz
  '#FFE66D', // Sarı
  '#95E1D3', // Mint
  '#F38181', // Pembe
  '#AA96DA', // Mor
  '#FCBAD3', // Açık pembe
  '#1337ec', // Primary
  '#EC4899', // Pink
  '#10B981', // Yeşil
];

interface ConfettiPieceProps {
  delay: number;
  color: string;
  startX: number;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ delay, color, startX }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animate = () => {
      // Reset
      translateY.setValue(-50);
      opacity.setValue(1);

      // Random horizontal movement
      const targetX = startX + (Math.random() - 0.5) * 200;

      Animated.parallel([
        // Fall down
        Animated.timing(translateY, {
          toValue: height + 100,
          duration: 3000 + Math.random() * 2000,
          delay,
          useNativeDriver: Platform.OS !== 'web',
        }),
        // Horizontal drift
        Animated.timing(translateX, {
          toValue: targetX,
          duration: 3000 + Math.random() * 2000,
          delay,
          useNativeDriver: Platform.OS !== 'web',
        }),
        // Rotate
        Animated.loop(
          Animated.timing(rotate, {
            toValue: 1,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: Platform.OS !== 'web',
          })
        ),
        // Fade out at end
        Animated.timing(opacity, {
          toValue: 0,
          duration: 3000 + Math.random() * 2000,
          delay: delay + 2000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    };

    animate();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const size = 8 + Math.random() * 8;

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          width: size,
          height: size * (Math.random() > 0.5 ? 1.5 : 1),
          backgroundColor: color,
          borderRadius: Math.random() > 0.5 ? size / 2 : 2,
          transform: [
            { translateX },
            { translateY },
            { rotate: rotateInterpolate },
          ],
          opacity,
        },
      ]}
    />
  );
};

interface ConfettiProps {
  active: boolean;
  count?: number;
  duration?: number;
  onComplete?: () => void;
}

const Confetti: React.FC<ConfettiProps> = ({
  active,
  count = 100,
  duration = 5000,
  onComplete,
}) => {
  const [pieces, setPieces] = useState<Array<{ id: number; color: string; startX: number; delay: number }>>([]);

  useEffect(() => {
    if (active) {
      // Generate confetti pieces
      const newPieces = Array.from({ length: count }).map((_, index) => ({
        id: index,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        startX: Math.random() * width,
        delay: Math.random() * 500,
      }));
      setPieces(newPieces);

      // Cleanup after duration
      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setPieces([]);
    }
  }, [active, count, duration, onComplete]);

  if (!active || pieces.length === 0) return null;

  return (
    <View style={[styles.container, { pointerEvents: 'none' }]}>
      {pieces.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          color={piece.color}
          startX={piece.startX}
          delay={piece.delay}
        />
      ))}
    </View>
  );
};

// Alternatif: Kalp patlaması efekti (Match için ideal)
interface HeartExplosionProps {
  active: boolean;
  onComplete?: () => void;
}

export const HeartExplosion: React.FC<HeartExplosionProps> = ({ active, onComplete }) => {
  const hearts = useRef<Array<{ id: number; anim: Animated.Value; x: number; y: number }>>([]).current;
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (active) {
      // Generate hearts
      for (let i = 0; i < 20; i++) {
        hearts.push({
          id: i,
          anim: new Animated.Value(0),
          x: width / 2 + (Math.random() - 0.5) * 100,
          y: height / 2,
        });
      }
      forceUpdate(prev => prev + 1);

      // Animate each heart
      hearts.forEach((heart, index) => {
        const angle = (index / 20) * Math.PI * 2;
        const distance = 150 + Math.random() * 100;

        Animated.sequence([
          Animated.delay(index * 30),
          Animated.timing(heart.anim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start();
      });

      // Cleanup
      const timer = setTimeout(() => {
        hearts.length = 0;
        onComplete?.();
      }, 2000);

      return () => {
        clearTimeout(timer);
        hearts.length = 0;
      };
    }
  }, [active]);

  if (!active) return null;

  return (
    <View style={[styles.container, { pointerEvents: 'none' }]}>
      {hearts.map((heart, index) => {
        const angle = (index / 20) * Math.PI * 2;
        const distance = 150 + Math.random() * 100;

        const translateX = heart.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(angle) * distance],
        });

        const translateY = heart.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(angle) * distance - 50],
        });

        const scale = heart.anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 1.5, 0],
        });

        const opacity = heart.anim.interpolate({
          inputRange: [0, 0.8, 1],
          outputRange: [1, 1, 0],
        });

        return (
          <Animated.Text
            key={heart.id}
            style={[
              styles.heart,
              {
                left: heart.x,
                top: heart.y,
                transform: [{ translateX }, { translateY }, { scale }],
                opacity,
              },
            ]}
          >
            ❤️
          </Animated.Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
  },
  heart: {
    position: 'absolute',
    fontSize: 24,
  },
});

export default Confetti;
