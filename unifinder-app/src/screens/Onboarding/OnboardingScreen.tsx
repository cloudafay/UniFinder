// Tanıtım Ekranı
// İlk kullanım için hoşgeldin ekranları

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/types';

const { width, height } = Dimensions.get('window');
const SLIDE_HEIGHT = height * 0.6;

// Tanıtım verileri
const slides = [
  {
    id: '1',
    icon: 'school',
    title: 'Üniversitenden\nArkadaşlar Bul',
    description: 'Sadece .edu.tr e-posta sahipleri kullanabilir. Güvenli ve doğrulanmış bir topluluk.',
    color: Colors.primary,
    gradient: ['#1337ec', '#6366f1'] as const,
  },
  {
    id: '2',
    icon: 'favorite',
    title: 'Swipe ile\nEşleş',
    description: 'Sağa kaydır beğen, sola kaydır geç. Karşılıklı beğenilerde eşleşme başlar!',
    color: '#EC4899',
    gradient: ['#EC4899', '#f472b6'] as const,
  },
  {
    id: '3',
    icon: 'chat-bubble',
    title: 'Sohbet Et ve\nTanış',
    description: 'Eşleştiğin kişilerle mesajlaş, ortak ilgi alanlarınızı keşfet.',
    color: '#10B981',
    gradient: ['#10B981', '#34d399'] as const,
  },
  {
    id: '4',
    icon: 'groups',
    title: 'Kampüste\nBuluş',
    description: 'Çalışma arkadaşı, spor partneri veya yeni dostlar edin. Hadi başlayalım!',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#fbbf24'] as const,
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      slidesRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      completeOnboarding();
    }
  };

  const skip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@unifinder_onboarding_complete', 'true');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      console.error('Onboarding tamamlama hatası:', error);
    }
  };

  const renderSlide = ({ item, index }: { item: typeof slides[0]; index: number }) => {
    return (
      <View style={[styles.slide, { width }]}>
        {/* İkon Container */}
        <View style={styles.iconWrapper}>
          <LinearGradient
            colors={item.gradient}
            style={styles.iconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name={item.icon as any} size={56} color="#fff" />
          </LinearGradient>
        </View>

        {/* Text Container */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {item.title}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  const Paginator = () => {
    return (
      <View style={styles.paginatorContainer}>
        {slides.map((item, index) => {
          const isActive = currentIndex === index;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  width: isActive ? 24 : 8,
                  backgroundColor: isActive ? item.color : colors.textTertiary,
                  opacity: isActive ? 1 : 0.3,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a1a' : '#f8fafc' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Gradient Background */}
      <LinearGradient
        colors={isDark
          ? ['#0a0a1a', '#1a1a3a', '#0a0a1a']
          : ['#f8fafc', '#e8edff', '#f8fafc']}
        style={StyleSheet.absoluteFill}
      />

      {/* Skip Button */}
      <TouchableOpacity
        style={[styles.skipButton, { top: insets.top + 16 }]}
        onPress={skip}
      >
        <Text style={[styles.skipText, { color: colors.textSecondary }]}>Atla</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={32}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        contentContainerStyle={styles.slidesContainer}
      />

      {/* Bottom Section */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
        <Paginator />

        {/* Next/Start Button */}
        <TouchableOpacity
          style={styles.nextButtonWrapper}
          onPress={scrollTo}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={slides[currentIndex].gradient}
            style={styles.nextButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {currentIndex === slides.length - 1 ? (
              <Text style={styles.nextButtonText}>Başla</Text>
            ) : (
              <MaterialIcons name="arrow-forward" size={28} color="#fff" />
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Progress Text */}
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {currentIndex + 1} / {slides.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  slidesContainer: {
    // Removed alignItems to prevent layout issues on mobile
  },
  slide: {
    height: height * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconWrapper: {
    marginBottom: 48,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
      } as any,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
      default: {},
    }),
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  bottomSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  paginatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButtonWrapper: {
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(19, 55, 236, 0.4)',
      } as any,
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  nextButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressText: {
    fontSize: 14,
  },
});

export default OnboardingScreen;
