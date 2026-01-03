// Match Success Screen
// Eşleşme başarı ekranı

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MatchSuccess'>;
type MatchSuccessRouteProp = RouteProp<RootStackParamList, 'MatchSuccess'>;

const { width, height } = Dimensions.get('window');

// Mock current user
const CURRENT_USER = {
  photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  name: 'Sen',
};

const MatchSuccessScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<MatchSuccessRouteProp>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { matchedUserName, matchedUserPhoto } = route.params;

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const leftAvatarAnim = useRef(new Animated.Value(-100)).current;
  const rightAvatarAnim = useRef(new Animated.Value(100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      // Fade in overlay
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
      // Scale up content
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: Platform.OS !== 'web',
      }),
      // Slide in avatars
      Animated.spring(leftAvatarAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(rightAvatarAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // Pulse animation for bolt icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, []);

  const handleSendMessage = () => {
    // Navigate to chat with matched user
    navigation.replace('Chat', {
      matchId: route.params.matchedUserId,
      userName: matchedUserName,
      userPhoto: matchedUserPhoto,
    });
  };

  const handleKeepExploring = () => {
    navigation.goBack();
  };

  return (
    <View className="flex-1">
      {/* Blurred Background */}
      <View className="absolute inset-0">
        <BlurView
          intensity={Platform.OS === 'ios' ? 60 : 100}
          tint={isDark ? 'dark' : 'light'}
          className="flex-1"
        />
      </View>

      {/* Glass Overlay */}
      <Animated.View
        className="flex-1 items-center justify-center px-6"
        style={{
          opacity: opacityAnim,
          backgroundColor: isDark
            ? 'rgba(16, 19, 34, 0.65)'
            : 'rgba(255, 255, 255, 0.65)',
        }}
      >
        {/* Ambient Glow */}
        <View
          className="absolute bg-primary/40 rounded-full"
          style={{
            width: 320,
            height: 320,
            top: height / 2 - 160,
            left: width / 2 - 160,
            opacity: 0.5,
          }}
        />

        {/* Content */}
        <Animated.View
          className="items-center w-full max-w-md"
          style={{
            transform: [{ scale: scaleAnim }],
          }}
        >
          {/* Floating Avatars */}
          <View className="relative h-40 w-full items-center justify-center mb-8">
            {/* Left Avatar (Current User) */}
            <Animated.View
              className="absolute"
              style={{
                left: '50%',
                marginLeft: -85,
                transform: [
                  { translateX: leftAvatarAnim },
                  { rotate: '-12deg' },
                ],
              }}
            >
              <View
                className={`w-32 h-32 rounded-full p-1 ${
                  isDark ? 'bg-slate-700' : 'bg-white'
                }`}
                style={Platform.select({
                  web: {
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                  } as any,
                  default: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 10,
                  },
                })}
              >
                <Image
                  source={{ uri: CURRENT_USER.photo }}
                  className="w-full h-full rounded-full"
                />
              </View>
            </Animated.View>

            {/* Right Avatar (Matched User) */}
            <Animated.View
              className="absolute"
              style={{
                right: '50%',
                marginRight: -85,
                transform: [
                  { translateX: rightAvatarAnim },
                  { rotate: '12deg' },
                ],
              }}
            >
              <View
                className={`w-32 h-32 rounded-full p-1 ${
                  isDark ? 'bg-slate-700' : 'bg-white'
                }`}
                style={Platform.select({
                  web: {
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                  } as any,
                  default: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 10,
                  },
                })}
              >
                <Image
                  source={{ uri: matchedUserPhoto }}
                  className="w-full h-full rounded-full"
                />
              </View>
              {/* Heart Badge */}
              <View
                className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2 border-4"
                style={{
                  borderColor: isDark ? '#1e293b' : '#fff',
                  ...Platform.select({
                    web: {
                      boxShadow: '0 2px 4px rgba(19, 55, 236, 0.4)',
                    } as any,
                    default: {
                      shadowColor: '#1337ec',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.4,
                      shadowRadius: 4,
                      elevation: 5,
                    },
                  }),
                }}
              >
                <Ionicons name="heart" size={16} color="#fff" />
              </View>
            </Animated.View>

            {/* Center Bolt Icon */}
            <Animated.View
              className={`absolute z-30 rounded-full p-2 ${
                isDark ? 'bg-slate-800' : 'bg-white'
              }`}
              style={{
                transform: [{ scale: pulseAnim }],
                ...Platform.select({
                  web: {
                    boxShadow: '0 4px 8px rgba(19, 55, 236, 0.3)',
                  } as any,
                  default: {
                    shadowColor: '#1337ec',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  },
                }),
              }}
            >
              <MaterialIcons name="bolt" size={32} color="#1337ec" />
            </Animated.View>
          </View>

          {/* Headline */}
          <Text
            className={`text-4xl font-black tracking-tight text-center mb-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Eşleştiniz!
          </Text>

          {/* Subtitle */}
          <Text
            className={`text-lg font-medium text-center mb-10 ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            Sen ve {matchedUserName} birbirinizi beğendiniz.
          </Text>

          {/* Action Buttons */}
          <View className="w-full px-4 gap-3">
            {/* Send Message Button */}
            <TouchableOpacity
              onPress={handleSendMessage}
              className="w-full h-14 bg-primary rounded-full flex-row items-center justify-center"
              style={Platform.select({
                web: {
                  boxShadow: '0 4px 15px rgba(19, 55, 236, 0.3)',
                } as any,
                default: {
                  shadowColor: '#1337ec',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 15,
                  elevation: 8,
                },
              })}
              activeOpacity={0.9}
            >
              <Text className="text-white text-lg font-bold mr-2">
                Mesaj Gönder
              </Text>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>

            {/* Keep Exploring Button */}
            <TouchableOpacity
              onPress={handleKeepExploring}
              className={`w-full h-12 rounded-full items-center justify-center ${
                isDark ? 'active:bg-white/5' : 'active:bg-slate-100/50'
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`text-base font-semibold ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                Keşfetmeye Devam Et
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export default MatchSuccessScreen;
