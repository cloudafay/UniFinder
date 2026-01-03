// Seviye Atlama Modal Komponenti
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Confetti from './ui/Confetti';

const { width, height } = Dimensions.get('window');

interface LevelUpModalProps {
  visible: boolean;
  newLevel: number;
  onClose: () => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({
  visible,
  newLevel,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const starAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Giriş animasyonu
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(starAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(starAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [visible]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const starScale = starAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti */}
        {visible && <Confetti active={true} />}

        {/* Blur Background */}
        <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />

        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient
            colors={['#1e1b4b', '#312e81', '#4338ca']}
            style={styles.gradientBg}
          >
            {/* Yıldız efektleri */}
            <View style={styles.starsContainer}>
              {[...Array(8)].map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.star,
                    {
                      top: `${10 + Math.random() * 80}%`,
                      left: `${5 + Math.random() * 90}%`,
                      transform: [{ scale: starScale }],
                      opacity: starAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 0.8],
                      }),
                    },
                  ]}
                >
                  <MaterialIcons name="star" size={12 + Math.random() * 8} color="#fbbf24" />
                </Animated.View>
              ))}
            </View>

            {/* Level Badge */}
            <Animated.View style={[styles.levelBadge, { transform: [{ rotate: spin }] }]}>
              <LinearGradient
                colors={['#fbbf24', '#f59e0b', '#d97706']}
                style={styles.levelBadgeInner}
              >
                <Text style={styles.levelNumber}>{newLevel}</Text>
              </LinearGradient>
            </Animated.View>

            {/* Başlık */}
            <Text style={styles.title}>🎉 SEVİYE ATLADIN! 🎉</Text>
            <Text style={styles.subtitle}>Tebrikler! Artık seviye {newLevel} oldun</Text>

            {/* Ödüller */}
            <View style={styles.rewardsContainer}>
              <View style={styles.rewardItem}>
                <MaterialIcons name="bolt" size={24} color="#fbbf24" />
                <Text style={styles.rewardText}>+1 Boost</Text>
              </View>
              <View style={styles.rewardItem}>
                <MaterialIcons name="visibility" size={24} color="#22c55e" />
                <Text style={styles.rewardText}>Daha fazla görünürlük</Text>
              </View>
            </View>

            {/* Kapat Butonu */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.closeButtonGradient}
              >
                <Text style={styles.closeButtonText}>Harika!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    width: width * 0.85,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradientBg: {
    padding: 32,
    alignItems: 'center',
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
  },
  levelBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 24,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  levelBadgeInner: {
    flex: 1,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  levelNumber: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
    textAlign: 'center',
  },
  rewardsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  rewardText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  closeButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default LevelUpModal;
