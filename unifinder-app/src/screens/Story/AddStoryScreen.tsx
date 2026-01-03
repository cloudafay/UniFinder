// Hikaye Ekleme Ekranı
// Modern Instagram/TikTok benzeri hikaye paylaşma

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

const AddStoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Animasyonlar
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonScale1 = useRef(new Animated.Value(1)).current;
  const buttonScale2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateButton = (anim: Animated.Value) => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
  };

  // Kamera ile fotoğraf çek
  const takePhoto = async () => {
    animateButton(buttonScale1);
    
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('İzin Gerekli', 'Kamera erişimi için izin vermeniz gerekiyor.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Galeriden fotoğraf seç
  const pickImage = async () => {
    animateButton(buttonScale2);
    
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Hikayeyi paylaş
  const shareStory = async () => {
    if (!selectedImage || !user?.id) {
      Alert.alert('Hata', 'Lütfen bir fotoğraf seçin.');
      return;
    }

    setIsLoading(true);

    try {
      const fileName = `story_${user.id}_${Date.now()}.jpg`;
      let imageUrl = selectedImage;

      // Fotoğrafı yükle
      try {
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('stories')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          console.error('Story upload error:', uploadError);
          Alert.alert('Hata', 'Fotoğraf yüklenemedi. Lütfen tekrar deneyin.');
          setIsLoading(false);
          return;
        }
        
        if (uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('stories')
            .getPublicUrl(fileName);
          imageUrl = publicUrlData.publicUrl;
          console.log('✅ Story uploaded:', imageUrl);
        }
      } catch (uploadErr) {
        console.error('Story upload exception:', uploadErr);
        Alert.alert('Hata', 'Fotoğraf yüklenirken bir hata oluştu.');
        setIsLoading(false);
        return;
      }

      // Veritabanına kaydet
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error: insertError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          caption: caption.trim() || null,
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) {
        console.error('Hikaye kaydetme hatası:', insertError);
        Alert.alert('Hata', 'Hikaye paylaşılırken bir hata oluştu.');
        setIsLoading(false);
        return;
      }

      Alert.alert('Başarılı', 'Hikayen paylaşıldı! 🎉');
      navigation.goBack();
    } catch (error) {
      console.error('Hikaye paylaşma hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fotoğraf seçilmemişse modern seçim ekranını göster
  if (!selectedImage) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0f' : '#f8fafc' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        {/* Animated Background */}
        <View style={styles.bgContainer}>
          <LinearGradient
            colors={isDark 
              ? ['rgba(99, 102, 241, 0.15)', 'transparent', 'rgba(236, 72, 153, 0.1)']
              : ['rgba(99, 102, 241, 0.08)', 'transparent', 'rgba(236, 72, 153, 0.05)']}
            style={styles.bgGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={[styles.bgOrb, styles.bgOrb1, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)' }]} />
          <View style={[styles.bgOrb, styles.bgOrb2, { backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.08)' }]} />
        </View>

        {/* Header */}
        <Animated.View style={[styles.header, { paddingTop: insets.top + 8, opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color={isDark ? '#fff' : '#1e293b'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#1e293b' }]}>
            Hikaye Oluştur
          </Text>
          <View style={{ width: 44 }} />
        </Animated.View>

        {/* Main Content */}
        <Animated.View 
          style={[
            styles.mainContent, 
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={[styles.heroIconContainer, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)' }]}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6', '#ec4899']}
                style={styles.heroIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Feather name="plus-circle" size={48} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={[styles.heroTitle, { color: isDark ? '#fff' : '#1e293b' }]}>
              Anını Paylaş
            </Text>
            <Text style={[styles.heroSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Fotoğraf çek veya galerinden seç
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Animated.View style={{ transform: [{ scale: buttonScale1 }], flex: 1 }}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={takePhoto}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#f97316', '#ea580c']}
                  style={styles.actionCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.actionIconWrapper}>
                    <Ionicons name="camera" size={32} color="#fff" />
                  </View>
                  <Text style={styles.actionCardTitle}>Kamera</Text>
                  <Text style={styles.actionCardDesc}>Anı yakala</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: buttonScale2 }], flex: 1 }}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={pickImage}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  style={styles.actionCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.actionIconWrapper}>
                    <Ionicons name="images" size={32} color="#fff" />
                  </View>
                  <Text style={styles.actionCardTitle}>Galeri</Text>
                  <Text style={styles.actionCardDesc}>Fotoğraf seç</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Info Badge */}
          <View style={[styles.infoBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.infoText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Hikayeler 24 saat görünür kalır
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  // Fotoğraf seçildiyse önizleme ekranı
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: '#000' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Fotoğraf Önizleme */}
      <Image
        source={{ uri: selectedImage }}
        style={styles.previewImage}
        resizeMode="contain"
      />

      {/* Üst Gradient & Header */}
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'transparent']}
        style={[styles.topGradient, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          style={styles.previewBackBtn}
          onPress={() => setSelectedImage(null)}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.previewTitle}>Önizleme</Text>
        <View style={{ width: 44 }} />
      </LinearGradient>

      {/* Alt Kontroller */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
        style={[styles.bottomGradient, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Caption Input */}
        <View style={styles.captionWrapper}>
          <View style={styles.captionInputContainer}>
            <Feather name="type" size={18} color="rgba(255,255,255,0.5)" />
            <TextInput
              style={styles.captionInput}
              placeholder="Bir şeyler yaz..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={caption}
              onChangeText={setCaption}
              maxLength={150}
              multiline
            />
            {caption.length > 0 && (
              <Text style={styles.charCount}>{caption.length}/150</Text>
            )}
          </View>
        </View>

        {/* Paylaş Butonu */}
        <TouchableOpacity
          style={[styles.shareBtn, isLoading && styles.shareBtnDisabled]}
          onPress={shareStory}
          disabled={isLoading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={isLoading ? ['#6b7280', '#4b5563'] : ['#ec4899', '#f43f5e']}
            style={styles.shareBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.shareBtnText}>Hikayeni Paylaş</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bgOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  bgOrb1: {
    width: 300,
    height: 300,
    top: -50,
    right: -100,
  },
  bgOrb2: {
    width: 250,
    height: 250,
    bottom: 100,
    left: -80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  heroIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  heroIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  actionCardGradient: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  actionIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  actionCardDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignSelf: 'center',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewImage: {
    width: width,
    height: height,
    position: 'absolute',
    backgroundColor: '#000',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 40,
    zIndex: 10,
  },
  previewBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 60,
    zIndex: 10,
  },
  captionWrapper: {
    marginBottom: 16,
  },
  captionInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
  },
  captionInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 12,
    maxHeight: 80,
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  shareBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  shareBtnDisabled: {
    opacity: 0.7,
  },
  shareBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  shareBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});

export default AddStoryScreen;
