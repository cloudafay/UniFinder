// Register Interest Screen
// Kayıt - İlgi alanları ekranı

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { createShadow } from '../../utils/styles';
import { LinearGradient } from 'expo-linear-gradient';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RegisterInterest'>;
type RegisterInterestRouteProp = RouteProp<AuthStackParamList, 'RegisterInterest'>;

// Interest categories with items
const INTEREST_CATEGORIES = [
  {
    id: 'academics',
    title: 'AKADEMİK',
    items: [
      { id: 'cs', label: 'Bilgisayar Bilimleri', icon: 'code-tags' },
      { id: 'psychology', label: 'Psikoloji' },
      { id: 'literature', label: 'Edebiyat' },
      { id: 'stem', label: 'STEM' },
      { id: 'history', label: 'Tarih' },
      { id: 'economics', label: 'Ekonomi' },
      { id: 'engineering', label: 'Mühendislik' },
      { id: 'medicine', label: 'Tıp' },
      { id: 'law', label: 'Hukuk' },
      { id: 'arts', label: 'Güzel Sanatlar' },
    ],
  },
  {
    id: 'activities',
    title: 'AKTİVİTELER',
    items: [
      { id: 'hiking', label: 'Doğa Yürüyüşü', icon: 'hiking' },
      { id: 'gaming', label: 'Oyun', icon: 'gamepad-variant' },
      { id: 'photography', label: 'Fotoğrafçılık', icon: 'camera' },
      { id: 'cooking', label: 'Yemek Yapma', icon: 'chef-hat' },
      { id: 'art', label: 'Sanat', icon: 'palette' },
      { id: 'music', label: 'Müzik', icon: 'music' },
      { id: 'reading', label: 'Kitap Okuma', icon: 'book-open-variant' },
      { id: 'travel', label: 'Seyahat', icon: 'airplane' },
      { id: 'fitness', label: 'Fitness', icon: 'dumbbell' },
      { id: 'movies', label: 'Sinema', icon: 'movie-open' },
    ],
  },
  {
    id: 'campus',
    title: 'KAMPÜS YAŞAMI',
    items: [
      { id: 'study-groups', label: 'Çalışma Grupları' },
      { id: 'nightlife', label: 'Gece Hayatı', icon: 'glass-cocktail' },
      { id: 'volunteering', label: 'Gönüllülük', icon: 'hand-heart' },
      { id: 'sports', label: 'Spor', icon: 'soccer' },
      { id: 'clubs', label: 'Kulüpler' },
      { id: 'events', label: 'Etkinlikler', icon: 'calendar-star' },
      { id: 'cafe', label: 'Kafeler', icon: 'coffee' },
      { id: 'library', label: 'Kütüphane', icon: 'library' },
    ],
  },
  {
    id: 'social',
    title: 'SOSYAL',
    items: [
      { id: 'networking', label: 'Networking' },
      { id: 'dating', label: 'Tanışma', icon: 'heart' },
      { id: 'friendship', label: 'Arkadaşlık', icon: 'account-group' },
      { id: 'mentoring', label: 'Mentorluk' },
      { id: 'language', label: 'Dil Değişimi', icon: 'translate' },
    ],
  },
];

const RegisterInterestScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RegisterInterestRouteProp>();
  const { theme } = useTheme();
  const { register } = useAuth();
  const isDark = theme === 'dark';

  // Get registration data from previous screens
  const { email, password, fullName, department, classYear, bio, photos } = route.params;

  // Selected interests state
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isValid = selectedInterests.length >= 3;

  const handleGoBack = () => {
    // Navigate back to photo screen with current data preserved
    navigation.navigate('RegisterPhoto', {
      email,
      password,
      fullName,
      department,
      classYear,
      bio,
      photos, // Pass photos back so they're preserved
    });
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interestId)) {
        return prev.filter((id) => id !== interestId);
      } else {
        return [...prev, interestId];
      }
    });
  };

  const handleComplete = async () => {
    if (!isValid || isLoading) return;

    setIsLoading(true);
    try {
      // Combine all registration data including email and password
      const registrationData = {
        email,
        password,
        fullName,
        department,
        classYear,
        bio,
        photos,
        interests: selectedInterests,
      };

      console.log('Kayıt başlatılıyor:', { ...registrationData, password: '***' });
      
      // Call register with full data (will save to database)
      const result = await register(registrationData);

      if (result.error) {
        // Kayıt başarısız
        console.log('Kayıt hatası:', result.error);
        setIsLoading(false);
        Alert.alert(
          'Kayıt Hatası',
          result.error,
          [{ text: 'Tamam' }]
        );
        return;
      }

      // E-posta doğrulama gerekiyor mu?
      if (result.needsEmailVerification) {
        console.log('E-posta doğrulaması gerekli, doğrulama ekranına yönlendiriliyor');
        setIsLoading(false);
        navigation.navigate('EmailVerification', { email: result.email || email });
        return;
      }

      console.log('Kayıt başarıyla tamamlandı');
      // Navigation will be handled by AuthContext after successful sign up
      // setUser triggers isAuthenticated = true, which switches to MainTabs
    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      setIsLoading(false);
      Alert.alert(
        'Kayıt Hatası',
        error?.message || 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.',
        [{ text: 'Tamam' }]
      );
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Atla',
      'İlgi alanları seçmeden devam etmek istediğinizden emin misiniz? Bu, eşleşmelerinizi etkileyebilir.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Atla',
          onPress: () => {
            // Skip with empty interests
            setSelectedInterests([]);
            handleComplete();
          },
        },
      ]
    );
  };

  const renderInterestChip = (item: { id: string; label: string; icon?: string }) => {
    const isSelected = selectedInterests.includes(item.id);

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => toggleInterest(item.id)}
        className={`h-10 rounded-full px-5 flex-row items-center justify-center mr-3 mb-3 ${
          isSelected
            ? 'bg-primary'
            : isDark
              ? 'bg-slate-800/60 border border-white/10'
              : 'bg-white/65 border border-white/50'
        }`}
        style={
          isSelected
            ? createShadow('#1337ec', 0, 0.4, 20, 6)
            : createShadow('#000', 4, 0.05, 30, 2)
        }
        activeOpacity={0.8}
      >
        {item.icon && (
          <MaterialCommunityIcons
            name={item.icon as any}
            size={18}
            color={isSelected ? '#fff' : isDark ? '#d1d5db' : '#4b5563'}
            style={{ marginRight: 6 }}
          />
        )}
        <Text
          className={`text-sm font-medium ${
            isSelected
              ? 'text-white font-semibold'
              : isDark
                ? 'text-gray-200'
                : 'text-slate-900'
          }`}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0a0a1a' : '#f0f4ff' }}>
      <LinearGradient
        colors={isDark 
          ? ['#0a0a1a', '#1a1a3a', '#0a0a1a'] 
          : ['#f0f4ff', '#e8f0fe', '#dbeafe']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView
        className="flex-1"
        edges={['top']}
      >
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        {/* Back Button and Progress Bar */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={handleGoBack}
            className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
              isDark ? 'bg-white/10' : 'bg-black/5'
            }`}
          >
            <Ionicons name="arrow-back" size={22} color={isDark ? '#fff' : '#1e293b'} />
          </TouchableOpacity>
          
          {/* Progress Bar */}
          <View className="flex-row items-center gap-1.5 flex-1">
            <View className="h-1.5 flex-1 rounded-full bg-primary/30" />
            <View className="h-1.5 flex-1 rounded-full bg-primary/30" />
            <View
              className="h-1.5 flex-1 rounded-full bg-primary"
              style={createShadow('#1337ec', 0, 0.25, 10, 3)}
            />
          </View>
        </View>

        {/* Titles */}
        <Text
          className={`text-3xl font-bold leading-tight tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          Seni ne heyecanlandırıyor?
        </Text>
        <Text
          className={`mt-2 text-base font-medium leading-normal ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          Kendi grubunu bulmamıza yardımcı olmak için en az 3 ilgi alanı seç.
        </Text>
      </View>

      {/* Scrollable Interest Chips */}
      <ScrollView
        className="flex-1 px-6 pt-4"
        contentContainerStyle={{ paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        {INTEREST_CATEGORIES.map((category) => (
          <View key={category.id} className="mb-8">
            <Text
              className={`text-xs font-bold tracking-wider mb-3 ${
                isDark ? 'text-blue-300' : 'text-blue-700'
              }`}
            >
              {category.title}
            </Text>
            <View className="flex-row flex-wrap">
              {category.items.map((item) => renderInterestChip(item))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Sticky Footer */}
      <View
        className={`absolute bottom-0 left-0 right-0 p-6`}
        style={{ 
          backgroundColor: isDark ? 'rgba(10, 10, 26, 0.95)' : 'rgba(240, 244, 255, 0.95)',
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)'
        }}
      >
        {/* Selection Counter */}
        {selectedInterests.length > 0 && (
          <View className="flex-row justify-center mb-3">
            <Text
              className={`text-sm font-medium ${
                isValid
                  ? 'text-green-600'
                  : isDark
                    ? 'text-gray-400'
                    : 'text-gray-500'
              }`}
            >
              {selectedInterests.length} ilgi alanı seçildi
              {!isValid && ` (${3 - selectedInterests.length} daha seç)`}
            </Text>
          </View>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleComplete}
          disabled={!isValid || isLoading}
          className={`w-full py-4 rounded-full flex-row items-center justify-center ${
            isValid && !isLoading ? 'bg-primary' : 'bg-primary/50'
          }`}
          style={isValid && !isLoading ? createShadow('#1337ec', 4, 0.3, 15, 8) : undefined}
          activeOpacity={0.9}
        >
          <Text className="text-white font-bold text-base mr-2">
            {isLoading ? 'Kaydediliyor...' : 'Sonraki Adım'}
          </Text>
          {!isLoading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          onPress={handleSkip}
          className="mt-4 items-center"
          disabled={isLoading}
        >
          <Text
            className={`text-sm font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            Şimdilik atla
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </View>
  );
};

export default RegisterInterestScreen;
