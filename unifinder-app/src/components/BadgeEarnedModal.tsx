// Rozet Kazanma Modal Komponenti (Kutlama Animasyonu)
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
import { Badge } from '../services/gamificationService';

const { width } = Dimensions.get('window');

interface BadgeEarnedModalProps {
  visible: boolean;
  badge: Badge | null;
  onClose: () => void;
}

const RARITY_COLORS: Record<string, readonly [string, string]> = {
  common: ['#94a3b8', '#64748b'],
  rare: ['#3b82f6', '#1d4ed8'],
  epic: ['#a855f7', '#7c3aed'],
  legendary: ['#f59e0b', '#d97706'],
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Yaygın',
  rare: 'Nadir',
  epic: 'Epik',
  legendary: 'Efsanevi',
};

const BadgeEarnedModal: React.FC<BadgeEarnedModalProps> = ({
  visible,
  badge,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && badge) {
      // Giriş animasyonları
      Animated.parallel([
        // Scale bounce
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
        // Badge bounce
        Animated.sequence([
          Animated.delay(300),
          Animated.spring(bounceAnim, {
            toValue: 1,
            friction: 3,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
        // Glow pulse
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.5,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
        // Shine effect
        Animated.loop(
          Animated.timing(shineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      bounceAnim.setValue(0);
    }
  }, [visible, badge]);

  if (!badge) return null;

  const rarityColors = RARITY_COLORS[badge.rarity] || RARITY_COLORS.common;

  const badgeScale = bounceAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1.2, 1],
  });

  const shineTranslate = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 200],
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
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            style={styles.gradientBg}
          >
            {/* Işık efektleri */}
            <Animated.View
              style={[
                styles.glowEffect,
                {
                  backgroundColor: rarityColors[0],
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 0.5],
                  }),
                },
              ]}
            />

            {/* Başlık */}
            <View style={styles.headerContainer}>
              <MaterialIcons name="emoji-events" size={28} color="#fbbf24" />
              <Text style={styles.headerText}>YENİ ROZET!</Text>
              <MaterialIcons name="emoji-events" size={28} color="#fbbf24" />
            </View>

            {/* Badge Icon */}
            <Animated.View
              style={[
                styles.badgeContainer,
                { transform: [{ scale: badgeScale }] },
              ]}
            >
              <LinearGradient
                colors={rarityColors as readonly [string, string]}
                style={styles.badgeGradient}
              >
                {/* Shine effect */}
                <Animated.View
                  style={[
                    styles.shineEffect,
                    { transform: [{ translateX: shineTranslate }] },
                  ]}
                />
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
              </LinearGradient>
            </Animated.View>

            {/* Badge Info */}
            <Text style={styles.badgeName}>{badge.name_tr || badge.name}</Text>
            <Text style={styles.badgeDescription}>
              {badge.description_tr || badge.description}
            </Text>

            {/* Rarity Badge */}
            <View style={[styles.rarityBadge, { backgroundColor: `${rarityColors[0]}30` }]}>
              <View style={[styles.rarityDot, { backgroundColor: rarityColors[0] }]} />
              <Text style={[styles.rarityText, { color: rarityColors[0] }]}>
                {RARITY_LABELS[badge.rarity]}
              </Text>
            </View>

            {/* XP Reward */}
            <View style={styles.xpContainer}>
              <MaterialIcons name="star" size={20} color="#fbbf24" />
              <Text style={styles.xpText}>
                +{badge.rarity === 'legendary' ? 200 : badge.rarity === 'epic' ? 100 : badge.rarity === 'rare' ? 50 : 25} XP
              </Text>
            </View>

            {/* Kapat Butonu */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <LinearGradient
                colors={rarityColors as readonly [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
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
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContainer: {
    width: width * 0.85,
    borderRadius: 28,
    overflow: 'hidden',
  },
  gradientBg: {
    padding: 32,
    alignItems: 'center',
  },
  glowEffect: {
    position: 'absolute',
    top: '20%',
    width: 200,
    height: 200,
    borderRadius: 100,
    filter: 'blur(60px)',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  badgeContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  badgeGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  badgeIcon: {
    fontSize: 56,
  },
  badgeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rarityText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  xpText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fbbf24',
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

export default BadgeEarnedModal;
