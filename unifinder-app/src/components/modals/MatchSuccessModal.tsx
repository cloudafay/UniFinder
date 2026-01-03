// Match Success Modal Component
// Eşleşme başarı modal'ı - Glassmorphism tasarım

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants';

const { width, height } = Dimensions.get('window');

interface MatchSuccessModalProps {
  visible: boolean;
  matchedUser: {
    name: string;
    photo: string;
  };
  currentUserPhoto?: string;
  onClose: () => void;
  onSendMessage: () => void;
  onKeepSwiping: () => void;
}

const MatchSuccessModal: React.FC<MatchSuccessModalProps> = ({
  visible,
  matchedUser,
  currentUserPhoto,
  onClose,
  onSendMessage,
  onKeepSwiping,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      heartScale.setValue(0);

      // Start animations
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(heartScale, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const defaultPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedUser.name)}&size=200&background=6366f1&color=fff`;
  const defaultCurrentPhoto = 'https://ui-avatars.com/api/?name=Me&size=200&background=ec4899&color=fff';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Background Blur */}
        {Platform.OS !== 'web' && (
          <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
        )}

        {/* Gradient Background */}
        <LinearGradient
          colors={['rgba(19, 55, 236, 0.9)', 'rgba(139, 92, 246, 0.9)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Match Text */}
          <Text style={styles.matchTitle}>🎉 Eşleşme!</Text>
          <Text style={styles.matchSubtitle}>
            Sen ve {matchedUser.name} birbirinizi beğendiniz
          </Text>

          {/* Photos Container */}
          <View style={styles.photosContainer}>
            {/* Current User Photo */}
            <View style={styles.photoWrapper}>
              <Image
                source={{ uri: currentUserPhoto || defaultCurrentPhoto }}
                style={styles.photo}
              />
              <View style={styles.photoRing} />
            </View>

            {/* Heart Icon */}
            <Animated.View
              style={[
                styles.heartContainer,
                { transform: [{ scale: heartScale }] },
              ]}
            >
              <LinearGradient
                colors={['#ec4899', '#f43f5e']}
                style={styles.heartGradient}
              >
                <MaterialIcons name="favorite" size={28} color="#fff" />
              </LinearGradient>
            </Animated.View>

            {/* Matched User Photo */}
            <View style={styles.photoWrapper}>
              <Image
                source={{ uri: matchedUser.photo || defaultPhoto }}
                style={styles.photo}
              />
              <View style={styles.photoRing} />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.messageButton}
              onPress={onSendMessage}
              accessibilityLabel="Mesaj gönder"
              accessibilityRole="button"
            >
              <MaterialIcons name="chat-bubble" size={20} color="#fff" />
              <Text style={styles.messageButtonText}>Mesaj Gönder</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keepSwipingButton}
              onPress={onKeepSwiping}
              accessibilityLabel="Keşfetmeye devam et"
              accessibilityRole="button"
            >
              <Text style={styles.keepSwipingText}>Keşfetmeye Devam Et</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityLabel="Kapat"
          accessibilityRole="button"
        >
          <MaterialIcons name="close" size={24} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  matchTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  matchSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 40,
  },
  photosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  photoRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 66,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heartContainer: {
    marginHorizontal: -20,
    zIndex: 10,
  },
  heartGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(236, 72, 153, 0.5)',
      },
      default: {
        shadowColor: '#ec4899',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 10,
      },
    }),
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 28,
    gap: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  keepSwipingButton: {
    paddingVertical: 16,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  keepSwipingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MatchSuccessModal;
