// Prompt Beğenme Butonu Komponenti
import React, { useState, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { promptService } from '../services/promptService';
import { useAuth } from '../context/AuthContext';

interface PromptLikeButtonProps {
  answerId: string;
  initialLiked?: boolean;
  initialCount?: number;
  onLikeChange?: (liked: boolean, count: number) => void;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

const PromptLikeButton: React.FC<PromptLikeButtonProps> = ({
  answerId,
  initialLiked = false,
  initialCount = 0,
  onLikeChange,
  size = 'medium',
  showCount = true,
}) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkLikeStatus();
  }, [answerId]);

  const checkLikeStatus = async () => {
    if (!user?.id) return;
    const liked = await promptService.hasLiked(user.id, answerId);
    setIsLiked(liked);
  };

  const handlePress = async () => {
    if (!user?.id || isLoading) return;
    
    setIsLoading(true);
    
    // Animasyon
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Kalp patlaması animasyonu (beğenildiğinde)
    if (!isLiked) {
      Animated.sequence([
        Animated.timing(heartAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(heartAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    try {
      const { liked, error } = await promptService.likeAnswer(user.id, answerId);
      
      if (!error) {
        const newCount = liked ? likeCount + 1 : likeCount - 1;
        setIsLiked(liked);
        setLikeCount(newCount);
        onLikeChange?.(liked, newCount);
      }
    } catch (error) {
      console.error('Beğeni hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const iconSize = size === 'small' ? 18 : size === 'large' ? 28 : 22;
  const fontSize = size === 'small' ? 11 : size === 'large' ? 15 : 13;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.7}
      style={styles.container}
    >
      <Animated.View style={[styles.buttonContent, { transform: [{ scale: scaleAnim }] }]}>
        <MaterialIcons
          name={isLiked ? 'favorite' : 'favorite-border'}
          size={iconSize}
          color={isLiked ? '#ef4444' : '#9ca3af'}
        />
        {showCount && likeCount > 0 && (
          <Text style={[styles.countText, { fontSize, color: isLiked ? '#ef4444' : '#9ca3af' }]}>
            {likeCount}
          </Text>
        )}
      </Animated.View>
      
      {/* Kalp patlaması efekti */}
      <Animated.View
        style={[
          styles.heartBurst,
          {
            opacity: heartAnim,
            transform: [
              {
                scale: heartAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1.5],
                }),
              },
            ],
          },
        ]}
      >
        <MaterialIcons name="favorite" size={iconSize * 1.5} color="#ef4444" />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontWeight: '600',
  },
  heartBurst: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
});

export default PromptLikeButton;
