// Hikaye Görüntüleme Ekranı
// Instagram/WhatsApp benzeri tam ekran hikaye görüntüleyici
// Emoji tepkileri ve yanıtlama desteği

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { storyService, Story } from '../../services/storyService';
import { 
  STORY_EMOJIS, 
  StoryEmoji, 
  addReaction, 
  getReactionCounts,
  getUserReactions,
  ReactionCount 
} from '../../services/storyReactionService';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ViewStoryRouteProp = RouteProp<RootStackParamList, 'ViewStory'>;

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 saniye

const ViewStoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ViewStoryRouteProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { storyId, userId } = route.params;

  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [myReactions, setMyReactions] = useState<string[]>([]);
  const [reactionCounts, setReactionCounts] = useState<ReactionCount[]>([]);
  const [storyOwner, setStoryOwner] = useState<{ name: string; avatar: string | null }>({
    name: 'Kullanıcı',
    avatar: null,
  });

  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const reactionScale = useRef(new Animated.Value(0)).current;

  // Hikayeleri ve kullanıcı bilgisini yükle
  useEffect(() => {
    loadStories();
    loadStoryOwner();
  }, [userId]);

  const loadStoryOwner = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', userId)
        .single();
      
      if (data) {
        setStoryOwner({
          name: data.full_name || 'Kullanıcı',
          avatar: data.avatar_url,
        });
      }
    } catch (err) {
      console.error('Kullanıcı bilgisi yüklenemedi:', err);
    }
  };

  const loadStories = async () => {
    try {
      const { data, error } = await storyService.getUserStories(userId);
      if (!error && data && data.length > 0) {
        setStories(data);
        const startIndex = data.findIndex(s => s.id === storyId);
        setCurrentIndex(startIndex >= 0 ? startIndex : 0);
        
        if (userId !== user?.id) {
          storyService.viewStory(storyId, user?.id || '');
        }
        
        // Tepki bilgilerini yükle
        loadReactions(storyId);
      } else {
        navigation.goBack();
      }
    } catch (err) {
      console.error('Hikaye yükleme hatası:', err);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadReactions = async (storyIdToLoad: string) => {
    const [counts, userReacts] = await Promise.all([
      getReactionCounts(storyIdToLoad),
      getUserReactions(storyIdToLoad),
    ]);
    setReactionCounts(counts);
    setMyReactions(userReacts);
  };

  // Progress animasyonu
  const startProgress = useCallback(() => {
    progress.setValue(0);
    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    animationRef.current.start(({ finished }) => {
      if (finished) {
        goToNextStory();
      }
    });
  }, [currentIndex, stories.length]);

  const pauseProgress = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
  }, []);

  const resumeProgress = useCallback(() => {
    if (!paused && !showReactions && !showReplyInput) {
      const currentValue = (progress as any)._value || 0;
      animationRef.current = Animated.timing(progress, {
        toValue: 1,
        duration: STORY_DURATION * (1 - currentValue),
        useNativeDriver: false,
      });
      animationRef.current.start(({ finished }) => {
        if (finished) {
          goToNextStory();
        }
      });
    }
  }, [paused, showReactions, showReplyInput]);

  useEffect(() => {
    if (!loading && stories.length > 0 && !showReactions && !showReplyInput) {
      startProgress();
    }
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [currentIndex, loading, stories.length, showReactions, showReplyInput]);

  // Tepki paneli açma/kapama
  useEffect(() => {
    if (showReactions) {
      pauseProgress();
      Animated.spring(reactionScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.spring(reactionScale, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      resumeProgress();
    }
  }, [showReactions]);

  // Hikaye geçişleri
  const goToNextStory = () => {
    if (currentIndex < stories.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      if (userId !== user?.id && stories[nextIndex]) {
        storyService.viewStory(stories[nextIndex].id, user?.id || '');
      }
      loadReactions(stories[nextIndex].id);
    } else {
      navigation.goBack();
    }
  };

  const goToPrevStory = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      loadReactions(stories[prevIndex].id);
    }
  };

  const handlePress = (side: 'left' | 'right') => {
    if (showReactions || showReplyInput) {
      setShowReactions(false);
      setShowReplyInput(false);
      return;
    }
    if (side === 'left') {
      goToPrevStory();
    } else {
      goToNextStory();
    }
  };

  const handlePressIn = () => {
    setPaused(true);
    pauseProgress();
  };

  const handlePressOut = () => {
    setPaused(false);
    resumeProgress();
  };

  // Tepki gönder
  const handleReaction = async (emoji: StoryEmoji) => {
    const currentStory = stories[currentIndex];
    if (!currentStory) return;

    // Animasyon
    Animated.sequence([
      Animated.timing(reactionScale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(reactionScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    // Tepkiyi kaydet
    const result = await addReaction(currentStory.id, emoji);
    if (result.success) {
      loadReactions(currentStory.id);
    }

    setShowReactions(false);
  };

  // Yanıt gönder
  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    const currentStory = stories[currentIndex];
    if (!currentStory) return;

    try {
      // Hikayeye yanıt olarak mesaj gönder
      // Not: Bu match olmadan direkt mesaj gönderiyor, uygulamanın akışına göre düzenlenebilir
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          content: replyText,
          message_type: 'story_reply',
          story_id: currentStory.id,
          // match_id gerekli olabilir - uygulama mantığına göre düzenlenmeli
        });

      if (!error) {
        // Bildirim gönder
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'message',
          title: 'Hikayene Yanıt',
          body: `${user?.fullName || 'Birisi'}: "${replyText.slice(0, 50)}${replyText.length > 50 ? '...' : ''}"`,
          data: { story_id: currentStory.id, sender_id: user?.id },
        });

        if (Platform.OS === 'web') {
          window.alert('Yanıtınız gönderildi!');
        } else {
          Alert.alert('Başarılı', 'Yanıtınız gönderildi!');
        }
      }
    } catch (err) {
      console.error('Yanıt gönderme hatası:', err);
    }

    setReplyText('');
    setShowReplyInput(false);
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dk`;
    if (diffHours < 24) return `${diffHours} sa`;
    return date.toLocaleDateString('tr-TR');
  };

  const handleDeleteStory = async () => {
    if (stories[currentIndex] && userId === user?.id) {
      const confirmDelete = () => {
        const doDelete = async () => {
          try {
            await storyService.deleteStory(stories[currentIndex].id);
            if (stories.length === 1) {
              navigation.goBack();
            } else {
              const newStories = stories.filter((_, i) => i !== currentIndex);
              setStories(newStories);
              if (currentIndex >= newStories.length) {
                setCurrentIndex(newStories.length - 1);
              }
            }
          } catch (err) {
            console.error('Hikaye silme hatası:', err);
          }
        };

        if (Platform.OS === 'web') {
          if (window.confirm('Bu hikayeyi silmek istediğinize emin misiniz?')) {
            doDelete();
          }
        } else {
          Alert.alert(
            'Hikayeyi Sil',
            'Bu hikayeyi silmek istediğinize emin misiniz?',
            [
              { text: 'İptal', style: 'cancel' },
              { text: 'Sil', style: 'destructive', onPress: doDelete },
            ]
          );
        }
      };
      confirmDelete();
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (stories.length === 0) {
    return null;
  }

  const currentStory = stories[currentIndex];
  const isOwnStory = userId === user?.id;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Story Image */}
      <Image
        source={{ uri: currentStory.image_url }}
        style={styles.storyImage}
        resizeMode="contain"
        onError={(e) => console.log('Story image error:', e.nativeEvent.error)}
      />

      {/* Progress Bars */}
      <View style={[styles.progressContainer, { top: insets.top + 8 }]}>
        {stories.map((_, index) => (
          <View key={index} style={styles.progressBar}>
            <View style={styles.progressBackground} />
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: index < currentIndex 
                    ? '100%' 
                    : index === currentIndex
                    ? progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      })
                    : '0%',
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Header */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={[styles.headerGradient, { paddingTop: insets.top + 24 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => navigation.navigate('UserProfile', { userId })}
          >
            <Image
              source={{ uri: storyOwner.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(storyOwner.name)}&size=100` }}
              style={styles.userAvatar}
            />
            <View>
              <Text style={styles.userName}>{storyOwner.name}</Text>
              <Text style={styles.storyTime}>{formatTime(currentStory.created_at)}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            {isOwnStory && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleDeleteStory}
              >
                <Ionicons name="trash-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Touch Areas */}
      <View style={styles.touchContainer}>
        <TouchableOpacity
          style={styles.touchAreaLeft}
          onPress={() => handlePress('left')}
          onLongPress={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        />
        <TouchableOpacity
          style={styles.touchAreaRight}
          onPress={() => handlePress('right')}
          onLongPress={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        />
      </View>

      {/* Caption & Reactions Display */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={[styles.bottomGradient, { paddingBottom: insets.bottom + 80 }]}
      >
        {currentStory.caption && (
          <Text style={styles.caption}>{currentStory.caption}</Text>
        )}
        
        {/* Tepki sayıları */}
        {reactionCounts.length > 0 && (
          <View style={styles.reactionCountsContainer}>
            {reactionCounts.slice(0, 4).map((rc, idx) => (
              <View key={idx} style={styles.reactionCountBadge}>
                <Text style={styles.reactionEmoji}>{rc.emoji}</Text>
                <Text style={styles.reactionCountText}>{rc.count}</Text>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>

      {/* Bottom Action Bar (Başkasının hikayesi ise) */}
      {!isOwnStory && !showReplyInput && (
        <View style={[styles.bottomActionBar, { bottom: insets.bottom + 16 }]}>
          <TouchableOpacity 
            style={styles.replyButton}
            onPress={() => {
              pauseProgress();
              setShowReplyInput(true);
            }}
          >
            <Text style={styles.replyButtonText}>Yanıtla...</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => setShowReactions(!showReactions)}
          >
            <Ionicons name="heart-outline" size={28} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="paper-plane-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Reply Input */}
      {showReplyInput && (
        <View style={[styles.replyInputContainer, { bottom: insets.bottom + 16 }]}>
          <TextInput
            style={styles.replyInput}
            placeholder="Yanıt yaz..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={replyText}
            onChangeText={setReplyText}
            autoFocus
            onBlur={() => {
              if (!replyText.trim()) {
                setShowReplyInput(false);
                resumeProgress();
              }
            }}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !replyText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendReply}
            disabled={!replyText.trim()}
          >
            <Ionicons name="send" size={20} color={replyText.trim() ? Colors.primary : 'rgba(255,255,255,0.4)'} />
          </TouchableOpacity>
        </View>
      )}

      {/* Reaction Picker */}
      {showReactions && (
        <Animated.View 
          style={[
            styles.reactionPicker, 
            { 
              bottom: insets.bottom + 70,
              transform: [{ scale: reactionScale }],
            }
          ]}
        >
          {STORY_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.emojiButton,
                myReactions.includes(emoji) && styles.emojiButtonSelected,
              ]}
              onPress={() => handleReaction(emoji)}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {/* View Count (kendi hikayesi ise) */}
      {isOwnStory && (
        <View style={[styles.viewCountContainer, { bottom: insets.bottom + 16 }]}>
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text style={styles.viewCount}>{currentStory.view_count}</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: width,
    height: height,
    position: 'absolute',
    backgroundColor: '#000',
  },
  progressContainer: {
    position: 'absolute',
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  progressBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 40,
    zIndex: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  storyTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    bottom: 150,
    flexDirection: 'row',
  },
  touchAreaLeft: {
    flex: 1,
  },
  touchAreaRight: {
    flex: 2,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  caption: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  reactionCountsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  reactionCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCountText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  bottomActionBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  replyButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  replyButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  reactionButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
  },
  shareButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
  },
  replyInputContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 16,
  },
  replyInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  reactionPicker: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 4,
  },
  emojiButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  emojiButtonSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  emoji: {
    fontSize: 24,
  },
  viewCountContainer: {
    position: 'absolute',
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewCount: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});

export default ViewStoryScreen;
